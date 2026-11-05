export function readStorage(key, fallback, validate = () => true) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value !== null && validate(value) ? value : fallback;
  } catch {
    return fallback;
  }
}
export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function startRecord(records, game, now = Date.now()) {
  const previous = records[game.id];
  const record = {
    id: game.id,
    title: game.title,
    thumbnail: game.thumbnail,
    category: game.category,
    provider: game.provider,
    touch: game.touch || false,
    lastPlayed: now,
    seconds: previous?.seconds || 0,
    launches: (previous?.launches || 0) + 1,
  };
  return Object.fromEntries(
    Object.entries({ ...records, [game.id]: record })
      .sort((a, b) => b[1].lastPlayed - a[1].lastPlayed)
      .slice(0, 100),
  );
}
export function addTime(records, id, seconds, now = Date.now()) {
  if (!records[id] || !Number.isFinite(seconds) || seconds <= 0) return records;
  return {
    ...records,
    [id]: { ...records[id], seconds: records[id].seconds + Math.min(seconds, 60), lastPlayed: now },
  };
}
export const validRecords = (value) =>
  value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.values(value).every(
    (record) =>
      typeof record?.id === 'string' &&
      typeof record.title === 'string' &&
      typeof record.thumbnail === 'string' &&
      record.thumbnail.startsWith('https://') &&
      Number.isFinite(record.seconds) &&
      record.seconds >= 0 &&
      Number.isFinite(record.lastPlayed),
  );
