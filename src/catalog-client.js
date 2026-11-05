const worker = new Worker(new URL('./catalog.worker.js', import.meta.url), { type: 'module' });
const pending = new Map();
let requestId = 0;
worker.onmessage = ({ data }) => {
  const request = pending.get(data.requestId);
  if (!request) return;
  pending.delete(data.requestId);
  data.error ? request.reject(new Error(data.error)) : request.resolve(data.result);
};
worker.onerror = () => {
  for (const request of pending.values())
    request.reject(new Error('The library could not be loaded. Refresh to try again.'));
  pending.clear();
};
export function queryCatalog(query) {
  return new Promise((resolve, reject) => {
    const id = ++requestId;
    pending.set(id, { resolve, reject });
    worker.postMessage({ requestId: id, query });
  });
}
const details = new Map();
export async function getGame(id) {
  const key = id.startsWith('gm-') ? `gm-${Math.floor(Number(id.slice(3)) / 500)}` : 'pk';
  if (!details.has(key))
    details.set(
      key,
      fetch(`${import.meta.env.BASE_URL}catalog/${key}.json`)
        .then((r) => {
          if (!r.ok) throw new Error('This game is unavailable.');
          return r.json();
        })
        .catch((error) => {
          details.delete(key);
          throw error;
        }),
    );
  const game = (await details.get(key))[id];
  if (!game) throw new Error('This game is no longer in the catalog.');
  return game;
}
