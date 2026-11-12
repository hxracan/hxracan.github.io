// Saves live in the portal's own localStorage so library backups can include them.
function store(name) {
  const key = 'unblockedgames.save.' + name;
  return {
    get(fallback) {
      try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
      } catch {
        return fallback;
      }
    },
    set(value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {}
    },
  };
}
