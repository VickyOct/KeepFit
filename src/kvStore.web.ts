// IndexedDB stores photos and records without localStorage's small size limit.
let database: Promise<IDBDatabase> | undefined;
function openDatabase(): Promise<IDBDatabase> {
  if (!database) {
    database = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('keepfit', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('records');
      request.onsuccess = () => {
        request.result.onversionchange = () => { request.result.close(); database = undefined; };
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('请关闭其他 KeepFit 页面后重试。'));
    }).catch((error) => { database = undefined; throw error; });
  }
  return database;
}

export async function readAll(): Promise<Record<string, string>> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('records', 'readonly');
    const result: Record<string, string> = {};
    const cursor = tx.objectStore('records').openCursor();
    cursor.onsuccess = () => {
      const entry = cursor.result;
      if (entry) { result[String(entry.key)] = entry.value; entry.continue(); }
    };
    tx.oncomplete = () => resolve(result);
    tx.onabort = () => reject(tx.error ?? new Error('读取记录失败'));
    tx.onerror = () => reject(tx.error);
  });
}

// A restore commits every section together, or leaves the previous data intact.
export async function writeEntries(entries: Record<string, string>): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('records', 'readwrite');
    const store = tx.objectStore('records');
    for (const [key, value] of Object.entries(entries)) store.put(value, key);
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error('存储空间不足或保存被中断'));
    tx.onerror = () => reject(tx.error);
  });
}

export default {
  async getItem(key: string): Promise<string | null> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('records', 'readonly');
      const request = tx.objectStore('records').get(key);
      tx.oncomplete = () => resolve(request.result ?? null);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error('读取记录失败'));
    });
  },
  async setItem(key: string, value: string): Promise<void> {
    await writeEntries({ [key]: value });
  },
};
