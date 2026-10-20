const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function worker(fail = false) {
  const listeners = {}, stores = new Map([['keepfit-old', new Map([['/index.html', 'old app']])]]);
  let networkCalls = 0, claimed = false;
  const caches = {
    keys: async () => [...stores.keys()],
    delete: async (key) => stores.delete(key),
    open: async (key) => {
      if (!stores.has(key)) stores.set(key, new Map());
      return {
        addAll: async (urls) => {
          if (fail) throw new Error('Offline during install');
          for (const url of urls) {
            const file = path.join(__dirname, '../dist', decodeURIComponent(url));
            assert.ok(fs.existsSync(file), `Missing cached file: ${url}`);
            stores.get(key).set(url, fs.readFileSync(file));
          }
        },
        match: async (url) => stores.get(key).get(url),
      };
    },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../dist/sw.js'), 'utf8'), {
    URL, caches, fetch: async () => { networkCalls++; throw new Error('Network is offline'); },
    self: { location: { origin: 'https://keepfit.test' }, clients: { claim: async () => { claimed = true; } }, addEventListener: (name, callback) => listeners[name] = callback },
  });
  const run = async (name) => { let pending; listeners[name]({ waitUntil: (p) => pending = p }); await pending; };
  const request = async (pathname, mode = 'cors') => {
    let response;
    listeners.fetch({ request: { url: new URL(pathname, 'https://keepfit.test').href, method: 'GET', mode }, respondWith: (p) => response = p });
    return response;
  };
  return { run, request, stores, networkCalls: () => networkCalls, claimed: () => claimed };
}

test('exported app, scripts, exercise images, referee GIFs and signal figures open without a network after caching', async () => {
  const w = worker();
  await w.run('install'); await w.run('activate');
  assert.ok(w.claimed()); assert.ok(!w.stores.has('keepfit-old'));
  assert.match((await w.request('/', 'navigate')).toString(), /KeepFit/);
  const assets = [...[...w.stores.values()][0].keys()];
  assert.ok(assets.some((url) => url.endsWith('.jpg')));
  assert.ok(assets.some((url) => url.endsWith('.gif')));
  assert.ok(assets.some((url) => /referee\/signals\/disruptive-foul\.\w+\.png$/.test(url)));
  for (const url of assets) assert.ok((await w.request(url)).length > 0, url);
  assert.equal(w.networkCalls(), 0);
  assert.equal(await w.request('https://api.nal.usda.gov/fdc/v1/foods/search'), undefined);
  assert.equal(await w.request('/auth/callback'), undefined);
});

test('failed offline download keeps previous working cache and removes partial update', async () => {
  const w = worker(true);
  await assert.rejects(w.run('install'), /Offline/);
  assert.deepEqual([...w.stores.keys()], ['keepfit-old']);
});
