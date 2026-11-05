import { queryGames } from './catalog-query';
let loading;
const load = () =>
  (loading ||= fetch(`${import.meta.env.BASE_URL}catalog/index.json`, { cache: 'no-cache' })
    .then((r) => {
      if (!r.ok) throw new Error('Could not load the game library.');
      return r.json();
    })
    .catch((error) => {
      loading = null;
      throw error;
    }));
self.onmessage = async ({ data }) => {
  try {
    const rows = await load();
    self.postMessage({ requestId: data.requestId, result: queryGames(rows, data.query) });
  } catch (error) {
    self.postMessage({ requestId: data.requestId, error: error.message });
  }
};
