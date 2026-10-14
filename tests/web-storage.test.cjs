const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { IDBFactory, IDBObjectStore } = require('fake-indexeddb');

function loader() {
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    new Function('require', 'module', 'exports', code)((id) => {
      const base = path.resolve(path.dirname(file), id);
      const resolved = ['.web.ts', '.ts', ''].map((ext) => base + ext).find(fs.existsSync);
      if (!resolved) throw new Error(id);
      return load(resolved);
    }, module, module.exports);
    return module.exports;
  }
  return load;
}

test('browser records, photos and target survive a fresh application instance', async () => {
  global.indexedDB = new IDBFactory();
  const a = loader()('src/storage.ts');
  const meal = { id: 'm1', createdAt: '2026-10-04T12:00:00Z', mealType: '午餐', imageUri: 'data:image/jpeg;base64,YWJj', foods: [], totalProtein: 0 };
  await a.saveMeals([meal]); await a.saveProteinTarget(150);
  assert.deepEqual(await loader()('src/storage.ts').loadAppState(), { meals: [meal], proteinTarget: 150 });
});

test('a restore transaction aborts all writes if browser storage fails', async () => {
  global.indexedDB = new IDBFactory();
  const db = loader()('src/kvStore.web.ts');
  await db.writeEntries({ a: 'original-a', b: 'original-b' });
  const put = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function(value, key) {
    const result = put.call(this, value, key);
    if (key === 'b') this.transaction.abort();
    return result;
  };
  try { await assert.rejects(db.writeEntries({ a: 'new-a', b: 'new-b' })); }
  finally { IDBObjectStore.prototype.put = put; }
  assert.deepEqual(await db.readAll(), { a: 'original-a', b: 'original-b' });
  await db.default.setItem('a', 'retry');
  assert.equal(await db.default.getItem('a'), 'retry');
});

test('backup validation rejects incomplete data and unsafe or temporary photo URLs', () => {
  const { backupDefaults, validateBackup } = loader()('src/webBackup.ts');
  const backup = { format: 'keepfit-web', version: 1, data: { ...backupDefaults } };
  assert.deepEqual(validateBackup(JSON.stringify(backup)), backupDefaults);
  assert.throws(() => validateBackup('{}'));
  for (const key of Object.keys(backupDefaults)) {
    const data = { ...backupDefaults }; delete data[key];
    assert.throws(() => validateBackup(JSON.stringify({ ...backup, data })));
  }
  for (const imageUri of ['blob:expired', 'https://tracker.example/photo.jpg', 'javascript:alert(1)']) {
    const meal = { id: 'm1', createdAt: new Date().toISOString(), mealType: '午餐', imageUri, foods: [], totalProtein: 0 };
    assert.throws(() => validateBackup(JSON.stringify({ ...backup, data: { ...backupDefaults, 'keepfit.meals.v1': JSON.stringify([meal]) } })));
  }
});

test('web deletion confirmation invokes actions only after confirmation', () => {
  let deleted = 0, canceled = 0;
  const { Alert } = loader()('src/alert.web.ts');
  const buttons = [{ style: 'cancel', onPress: () => canceled++ }, { style: 'destructive', onPress: () => deleted++ }];
  global.window = { confirm: () => false };
  Alert.alert('删除？', '', buttons); assert.equal(deleted, 0); assert.equal(canceled, 1);
  window.confirm = () => true;
  Alert.alert('删除？', '', buttons); assert.equal(deleted, 1);
  delete global.window;
});

test('browser backups retain final exam drafts and scores alongside old course progress', async () => {
  global.indexedDB = new IDBFactory();
  const load = loader(); const storage = load('src/refereeStorage.ts');
  const exams = load('src/data/refereeScenarioExams.ts').refereeScenarioExams;
  await storage.completeRefereeLesson('pregame');
  for (const q of exams[0].questions) await storage.saveScenarioAnswer(exams[0].id, q.id, q.correctIndex);
  await storage.submitScenarioExam(exams[0].id);
  await storage.saveScenarioAnswer(exams[1].id, exams[1].questions[0].id, 0);
  const before = await storage.loadRefereeState();
  const { backupDefaults, validateBackup } = load('src/webBackup.ts');
  const entries = await load('src/kvStore.web.ts').readAll();
  const restored = validateBackup(JSON.stringify({ format: 'keepfit-web', version: 1, data: { ...backupDefaults, ...entries } }));
  global.indexedDB = new IDBFactory();
  const afterLoad = loader(); await afterLoad('src/kvStore.web.ts').writeEntries(restored);
  const after = await afterLoad('src/refereeStorage.ts').loadRefereeState();
  assert.deepEqual(after, before);
  assert.equal(after.exams[exams[0].id].bestAttempt.score, 10);
  assert.equal(after.exams[exams[1].id].draftAnswers[exams[1].questions[0].id], 0);
  assert.ok(after.lessons.pregame.completedAt);
});
