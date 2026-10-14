import Storage from './kvStore';

const KEY = 'keepfit.recipe-favorites.v1';
let pending: Promise<unknown> = Promise.resolve();

async function readFavorites(): Promise<string[]> {
  const raw = await Storage.getItem(KEY);
  if (raw === null) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === 'string')) {
    throw new Error('收藏数据格式无法读取');
  }
  return [...new Set(parsed)];
}

export async function loadRecipeFavorites(): Promise<string[]> {
  await pending.catch(() => undefined);
  return readFavorites();
}

// Read-modify-write operations share one queue, including across screen remounts.
export function toggleRecipeFavorite(id: string): Promise<string[]> {
  const operation = pending.catch(() => undefined).then(async () => {
    const current = await readFavorites();
    const next = current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
    await Storage.setItem(KEY, JSON.stringify(next));
    return next;
  });
  pending = operation;
  return operation;
}
