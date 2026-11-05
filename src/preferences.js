export const defaultPreferences = {
  textSize: 'normal',
  density: 'comfortable',
  reducedMotion: false,
  touchDefault: false,
  pageSize: 24,
  keepGameOpen: true,
  confirmClose: true,
  expandedPlayer: false,
  rememberHistory: true,
  rememberTime: true,
  showContinue: true,
};

export function normalizePreferences(value) {
  const result = { ...defaultPreferences };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  for (const key of Object.keys(defaultPreferences)) {
    if (typeof defaultPreferences[key] === 'boolean' && typeof value[key] === 'boolean')
      result[key] = value[key];
  }
  if (['normal', 'large'].includes(value.textSize)) result.textSize = value.textSize;
  if (['comfortable', 'compact'].includes(value.density)) result.density = value.density;
  if ([24, 36, 48].includes(value.pageSize)) result.pageSize = value.pageSize;
  return result;
}

const validId = (value) => typeof value === 'string' && /^(gm-\d+|pk-[a-z0-9-]+)$/.test(value);

export function parseBackup(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.saved) || !Array.isArray(value.recent))
    throw new Error('Invalid library backup');
  const saved = [...new Set(value.saved.filter(validId))].slice(0, 500);
  const recent = [...new Set(value.recent.filter(validId))].slice(0, 100);
  const records = {};
  for (const record of Object.values(value.records || {}).slice(0, 100)) {
    if (
      !validId(record?.id) ||
      !Number.isFinite(record.seconds) ||
      record.seconds < 0 ||
      !Number.isFinite(record.lastPlayed)
    )
      continue;
    if (
      typeof record.title !== 'string' ||
      typeof record.thumbnail !== 'string' ||
      !record.thumbnail.startsWith('https://')
    )
      continue;
    records[record.id] = {
      id: record.id,
      title: record.title.slice(0, 200),
      thumbnail: record.thumbnail,
      category: String(record.category || 'Arcade').slice(0, 80),
      provider: record.id.startsWith('gm-') ? 'GameMonetize' : 'PlayKovo',
      touch: record.touch === true,
      seconds: Math.min(record.seconds, 1e9),
      lastPlayed: record.lastPlayed,
      launches: Math.max(0, Math.floor(Number(record.launches) || 0)),
    };
  }
  return {
    saved,
    recent,
    records,
    preferences: normalizePreferences(value.preferences),
    language: value.language === 'de' ? 'de' : 'en',
    theme: value.theme === 'light' ? 'light' : 'dark',
  };
}
