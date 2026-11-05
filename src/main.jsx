import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight,
  ArrowUp,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Compass,
  Grid2X2,
  Hand,
  Info,
  Moon,
  Play,
  Search,
  Settings2,
  Shuffle,
  Sun,
  X,
} from 'lucide-react';
import { queryCatalog, getGame } from './catalog-client';
import { LanguageContext, Brand, Thumbnail, GameCard, InfoDialog } from './UI';
import Player from './Player';
import Settings from './Settings';
import { defaultPreferences, normalizePreferences, parseBackup } from './preferences';
import { messages, categoryName, relativeDate } from './i18n';
import { useLocalState, usePlayClock, useStableEvent } from './hooks';
import { addTime, startRecord, validRecords } from './storage';
import './styles.css';

const validIds = (value) => Array.isArray(value) && value.every((id) => typeof id === 'string');
function App() {
  const [language, setLanguage, languageSaved] = useLocalState(
    'unblockedgames.language',
    'en',
    (value) => ['en', 'de'].includes(value),
  );
  const [theme, setTheme] = useLocalState('unblockedgames.theme', 'dark', (value) =>
    ['dark', 'light'].includes(value),
  );
  const [saved, setSaved, savedPersistent] = useLocalState(
    'unblockedgames.favorites',
    [],
    validIds,
  );
  const [recent, setRecent, recentPersistent] = useLocalState(
    'unblockedgames.recent',
    [],
    validIds,
  );
  const [records, setRecords, recordsPersistent] = useLocalState(
    'unblockedgames.sessions',
    {},
    validRecords,
  );
  const [storedPreferences, setPreferences, preferencesPersistent] = useLocalState(
    'unblockedgames.preferences',
    {
      ...defaultPreferences,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    },
    (value) => value && typeof value === 'object' && !Array.isArray(value),
  );
  const preferences = useMemo(() => normalizePreferences(storedPreferences), [storedPreferences]);
  const scrollBehavior = preferences.reducedMotion ? 'auto' : 'smooth';
  const [manifest, setManifest] = useState(null),
    [manifestError, setManifestError] = useState(false),
    [view, setView] = useState('discover'),
    [libraryTab, setLibraryTab] = useState('saved');
  const [category, setCategory] = useState('All games'),
    [query, setQuery] = useState(''),
    [sort, setSort] = useState('discovery'),
    [source, setSource] = useState(''),
    [touchOnly, setTouchOnly] = useState(preferences.touchDefault),
    [page, setPage] = useState(1);
  const [result, setResult] = useState({ games: [], total: 0, page: 1, pages: 1 }),
    [busy, setBusy] = useState(true),
    [error, setError] = useState('');
  const [selection, setSelection] = useState(null),
    [session, setSession] = useState(null),
    [info, setInfo] = useState(''),
    [showContinue, setShowContinue] = useState(true),
    [legacyLast, setLegacyLast] = useState(null);
  const searchInput = useRef(null),
    library = useRef(null);
  const deferredQuery = useDeferredValue(query),
    t = messages[language];
  const persistent =
    languageSaved &&
    savedPersistent &&
    recentPersistent &&
    recordsPersistent &&
    preferencesPersistent;
  const format = (value) =>
    new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US').format(value || 0);
  const history = useMemo(
    () => Object.values(records).sort((a, b) => b.lastPlayed - a.lastPlayed),
    [records],
  );
  const lastGame = history[0] || legacyLast;
  const isHome = view === 'discover' && !query;
  const current = Boolean(selection && session && selection.id === session.game.id);
  const onTime = useStableEvent((id, seconds) => {
    if (preferences.rememberHistory && preferences.rememberTime)
      setRecords((previous) => addTime(previous, id, seconds));
  });
  usePlayClock(session, current, onTime);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = `unblockedgames / ${t.heading}`;
  }, [language, t.heading]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0c0d11' : '#f4f4f1');
  }, [theme]);
  useEffect(() => {
    document.documentElement.dataset.density = preferences.density;
    document.documentElement.dataset.motion = preferences.reducedMotion ? 'reduced' : 'full';
    document.documentElement.style.fontSize = preferences.textSize === 'large' ? '18px' : '16px';
  }, [preferences.density, preferences.reducedMotion, preferences.textSize]);
  useEffect(() => setPage(1), [preferences.pageSize]);
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}catalog/manifest.json`, { cache: 'no-cache' })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        setManifest(data);
        setResult((previous) =>
          previous.games.length
            ? previous
            : { ...previous, games: data.featured, total: data.count },
        );
      })
      .catch(() => setManifestError(true));
    const id = new URLSearchParams(window.location.search).get('game');
    if (id)
      getGame(id)
        .then(setSelection)
        .catch(() => setError('game'));
  }, []);
  useEffect(() => {
    if (!history.length && recent[0])
      getGame(recent[0])
        .then(setLegacyLast)
        .catch(() => {});
  }, [history.length, recent]);
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError('');
    queryCatalog({
      q: deferredQuery,
      category,
      sort,
      page,
      source,
      touchOnly,
      limit: preferences.pageSize,
      ids: view === 'library' ? (libraryTab === 'saved' ? saved : recent) : null,
    })
      .then((data) => {
        if (active) {
          setResult(data);
          setBusy(false);
        }
      })
      .catch(() => {
        if (active) {
          setError('library');
          setBusy(false);
        }
      });
    return () => {
      active = false;
    };
  }, [
    deferredQuery,
    category,
    sort,
    page,
    source,
    touchOnly,
    view,
    libraryTab,
    saved,
    recent,
    preferences.pageSize,
  ]);

  const navigate = (next, tab = 'saved') => {
    setView(next);
    setLibraryTab(tab);
    setQuery('');
    setCategory('All games');
    setSource('');
    setTouchOnly(preferences.touchDefault);
    setSort(next === 'discover' ? 'discovery' : 'newest');
    setPage(1);
    window.scrollTo({ top: 0, behavior: scrollBehavior });
  };
  const openGame = (game) => {
    setSelection(game);
    const url = new URL(window.location);
    url.searchParams.set('game', game.id);
    window.history.replaceState({}, '', url);
  };
  const minimize = useStableEvent(() => {
    setSelection(null);
    if (!preferences.keepGameOpen) setSession(null);
    const url = new URL(window.location);
    url.searchParams.delete('game');
    window.history.replaceState({}, '', url);
  });
  const toggleSaved = (id) =>
    setSaved((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [id, ...previous].slice(0, 500),
    );
  const launch = (game) => {
    setSession({ game, token: crypto.randomUUID() });
    if (preferences.rememberHistory) {
      setRecords((previous) => startRecord(previous, game));
      setRecent((previous) => [game.id, ...previous.filter((id) => id !== game.id)].slice(0, 100));
    }
    setSelection(game);
    setShowContinue(true);
  };
  const stop = () => setSession(null);
  const random = async () => {
    try {
      const { game } = await queryCatalog({ category, touchOnly, sort: 'random' });
      if (game) openGame(game);
    } catch {
      setError('library');
    }
  };
  const focusSearch = () => {
    window.setTimeout(() => searchInput.current?.focus(), 0);
  };
  const shortcuts = useStableEvent((event) => {
    if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
    if (
      event.key === '/' &&
      !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)
    ) {
      event.preventDefault();
      focusSearch();
    }
  });
  useEffect(() => {
    document.addEventListener('keydown', shortcuts);
    return () => document.removeEventListener('keydown', shortcuts);
  }, [shortcuts]);
  const searchChange = (value) => {
    setQuery(value);
    setView('all');
    setPage(1);
  };
  const jump = (number) => {
    setPage(number);
    library.current?.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
  };
  const selectCategory = (value) => {
    setCategory(value);
    setPage(1);
  };
  const clearLocal = () => {
    setSaved([]);
    setRecent([]);
    setRecords({});
    setLegacyLast(null);
  };
  const onPreference = (key, value) => {
    setPreferences((previous) => ({ ...normalizePreferences(previous), [key]: value }));
    if (key === 'touchDefault') {
      setTouchOnly(value);
      setPage(1);
    }
  };
  const exportLibrary = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      saved,
      recent,
      records,
      preferences,
      language,
      theme,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `unblockedgames-library-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importLibrary = (value) => {
    const data = parseBackup(value);
    setSaved((previous) => [...new Set([...data.saved, ...previous])].slice(0, 500));
    setRecent((previous) => [...new Set([...data.recent, ...previous])].slice(0, 100));
    setRecords((previous) => ({ ...previous, ...data.records }));
    setPreferences(data.preferences);
    setTheme(data.theme);
    setLanguage(data.language);
    setTouchOnly(data.preferences.touchDefault);
  };
  const resetSettings = () => {
    setPreferences(defaultPreferences);
    setLanguage('en');
    setTheme('dark');
    setTouchOnly(false);
  };
  const categories = manifest?.categories || [];
  const spotlight = manifest?.spotlight || [];
  const pageNumbers = [...new Set([1, result.page - 1, result.page, result.page + 1, result.pages])]
    .filter((value) => value >= 1 && value <= result.pages)
    .sort((a, b) => a - b);
  const heading = query
    ? t.searchResults
    : view === 'library'
      ? libraryTab === 'saved'
        ? t.savedTitle
        : t.recentTitle
      : category !== 'All games'
        ? categoryName(category, language)
        : t.explore;
  const closeInfo = useStableEvent(() => setInfo(''));
  const timeLabel = (record) =>
    record.seconds < 60 ? t.underMinute : `${format(Math.floor(record.seconds / 60))} ${t.minutes}`;

  const showPicks = isHome && page === 1 && category === 'All games' && !source && !touchOnly;
  const pickIds = new Set(showPicks ? spotlight.map((game) => game.id) : []);

  return (
    <LanguageContext.Provider value={{ language, t }}>
      <a className="skip-link" href="#game-library">
        {t.skip}
      </a>
      <header className="site-header">
        <div className="header-inner">
          <button
            className="brand"
            onClick={() => navigate('discover')}
            aria-label="unblockedgames"
          >
            <Brand />
          </button>
          <label className="header-search">
            <Search size={18} />
            <input
              ref={searchInput}
              value={query}
              onChange={(event) => searchChange(event.target.value)}
              placeholder={t.searchPlaceholder}
              aria-label={t.search}
            />
            {query && (
              <button
                className="icon-button clear-search"
                onClick={() => searchChange('')}
                aria-label={t.reset}
              >
                <X size={17} />
              </button>
            )}
          </label>
          <div className="header-tools">
            <button
              className="icon-button theme-toggle"
              onClick={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
              aria-label={theme === 'dark' ? t.light : t.dark}
            >
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              className={`icon-button settings-tab ${view === 'settings' ? 'active' : ''}`}
              onClick={() => navigate('settings')}
              aria-label={t.settings}
              aria-current={view === 'settings' ? 'page' : undefined}
            >
              <Settings2 size={20} />
            </button>
            <div className="language-switch" role="group" aria-label={t.language}>
              <button
                lang="en"
                aria-label="English"
                aria-pressed={language === 'en'}
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
              <button
                lang="de"
                aria-label="Deutsch"
                aria-pressed={language === 'de'}
                onClick={() => setLanguage('de')}
              >
                DE
              </button>
            </div>
          </div>
        </div>
        <nav className="main-nav" aria-label={t.browse}>
          <button
            className={view === 'discover' ? 'active' : ''}
            onClick={() => navigate('discover')}
          >
            {t.discover}
          </button>
          <button className={view === 'all' ? 'active' : ''} onClick={() => navigate('all')}>
            {t.browse}
          </button>
          <button
            className={view === 'library' && libraryTab === 'saved' ? 'active' : ''}
            onClick={() => navigate('library', 'saved')}
          >
            {t.saved}
            {saved.length > 0 && <span>{saved.length}</span>}
          </button>
          <button
            className={view === 'library' && libraryTab === 'recent' ? 'active' : ''}
            onClick={() => navigate('library', 'recent')}
          >
            {t.recent}
          </button>
          <span className="nav-catalog">
            {manifest ? format(manifest.count) : '38,628'} {t.results}
          </span>
        </nav>
      </header>
      <main className="main-content">
        {view === 'settings' ? (
          <Settings
            language={language}
            setLanguage={setLanguage}
            theme={theme}
            setTheme={setTheme}
            preferences={preferences}
            onPreference={onPreference}
            persistent={persistent}
            savedCount={saved.length}
            historyCount={recent.length}
            onExport={exportLibrary}
            onImport={importLibrary}
            onClearHistory={() => {
              setRecent([]);
              setRecords({});
              setLegacyLast(null);
            }}
            onClearSaved={() => setSaved([])}
            onReset={resetSettings}
          />
        ) : (
          <>
            {isHome && lastGame && showContinue && preferences.showContinue && (
              <section className="continue-banner" aria-label={t.continueQuestion}>
                <span className="continue-art">
                  <Thumbnail game={lastGame} />
                </span>
                <div>
                  <h2>{t.continueQuestion}</h2>
                  <p>
                    {lastGame.title}
                    {history[0] && (
                      <>
                        <span>·</span>
                        {timeLabel(history[0])}
                        <span>·</span>
                        {relativeDate(history[0].lastPlayed, language)}
                      </>
                    )}
                  </p>
                </div>
                <button className="primary-button" onClick={() => openGame(lastGame)}>
                  <Play size={15} fill="currentColor" />
                  {t.continue}
                </button>
                <button
                  className="icon-button dismiss-continue"
                  aria-label={t.later}
                  onClick={() => setShowContinue(false)}
                >
                  <X size={17} />
                </button>
              </section>
            )}
            <section className="library-section" id="game-library" ref={library}>
              <div className="library-heading">
                <h1>{isHome ? t.heading : heading}</h1>
                <span className="results-count" aria-live="polite">
                  {busy || query !== deferredQuery
                    ? t.loading
                    : `${format(result.total)} ${result.total === 1 ? t.result : t.results}`}
                </span>
                <button className="surprise-button" onClick={random}>
                  <Shuffle size={16} />
                  <span>{t.surprise}</span>
                </button>
              </div>
              {view === 'library' && (
                <div className="library-tabs">
                  <button
                    className={libraryTab === 'saved' ? 'active' : ''}
                    onClick={() => {
                      setLibraryTab('saved');
                      setPage(1);
                    }}
                  >
                    <Bookmark size={16} />
                    {t.saved}
                    <span>{saved.length}</span>
                  </button>
                  <button
                    className={libraryTab === 'recent' ? 'active' : ''}
                    onClick={() => {
                      setLibraryTab('recent');
                      setPage(1);
                    }}
                  >
                    <Clock3 size={16} />
                    {t.recent}
                    <span>{recent.length}</span>
                  </button>
                  <button className="save-info-button" onClick={() => setInfo('saves')}>
                    <Info size={15} />
                    {t.saveTitle}
                  </button>
                </div>
              )}
              <div className="filter-bar">
                <div className="category-scroll" aria-label={t.allCategories}>
                  {['All games', 'Racing', 'Action', 'Puzzle', 'Adventure', '2 Player', 'Arcade']
                    .filter(
                      (name) =>
                        name === 'All games' || categories.some((item) => item.name === name),
                    )
                    .map((name) => (
                      <button
                        className={category === name ? 'active' : ''}
                        aria-pressed={category === name}
                        key={name}
                        onClick={() => selectCategory(name)}
                      >
                        {categoryName(name, language)}
                      </button>
                    ))}
                </div>
                <button
                  className={`touch-switch ${touchOnly ? 'active' : ''}`}
                  role="switch"
                  aria-checked={touchOnly}
                  title={t.touchHint}
                  onClick={() => {
                    setTouchOnly((value) => !value);
                    setPage(1);
                  }}
                >
                  <Hand size={16} />
                  <span>{t.touch}</span>
                  <span className="switch-track">
                    <i />
                  </span>
                </button>
              </div>
              <div className="filter-options">
                <label>
                  <select
                    aria-label={t.allCategories}
                    value={category}
                    onChange={(event) => selectCategory(event.target.value)}
                  >
                    <option value="All games">{t.allCategories}</option>
                    {categories.map((item) => (
                      <option value={item.name} key={item.name}>
                        {categoryName(item.name, language)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={12} />
                </label>
                <div>
                  <label>
                    <select
                      aria-label={t.source}
                      value={source}
                      onChange={(event) => {
                        setSource(event.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="">{t.allProviders}</option>
                      <option>GameMonetize</option>
                      <option>PlayKovo</option>
                    </select>
                    <ChevronDown size={12} />
                  </label>
                  <label>
                    <select
                      aria-label={t.sort}
                      value={sort}
                      onChange={(event) => {
                        setSort(event.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="discovery">{t.sortPicks}</option>
                      <option value="newest">{t.sortNewest}</option>
                      <option value="az">{t.sortAz}</option>
                    </select>
                    <ChevronDown size={12} />
                  </label>
                </div>
              </div>
              {(error || manifestError) && (
                <div className="error-banner" role="alert">
                  {error === 'game' ? t.gameError : t.loadError}
                  <button className="text-button" onClick={() => window.location.reload()}>
                    {t.retry}
                  </button>
                </div>
              )}
              <div className="portal-game-wall">
                {showPicks &&
                  spotlight.map((game, index) => (
                    <GameCard
                      key={`pick-${game.id}`}
                      game={game}
                      featured={index === 0}
                      onOpen={openGame}
                      saved={saved.includes(game.id)}
                      onSave={toggleSaved}
                    />
                  ))}
                <div className="game-grid" aria-busy={busy}>
                  {result.games
                    .filter((game) => !pickIds.has(game.id))
                    .map((game) => (
                      <GameCard
                        key={game.id}
                        game={game}
                        onOpen={openGame}
                        saved={saved.includes(game.id)}
                        onSave={toggleSaved}
                        record={
                          view === 'library' && libraryTab === 'recent' ? records[game.id] : null
                        }
                      />
                    ))}
                  {busy &&
                    !result.games.length &&
                    Array.from({ length: 12 }, (_, index) => (
                      <div className="skeleton-card" key={index}>
                        <div />
                        <span />
                      </div>
                    ))}
                </div>
              </div>
              {!busy && !result.games.length && !error && (
                <div className="empty-state">
                  {view === 'library' ? (
                    libraryTab === 'saved' ? (
                      <Bookmark size={30} />
                    ) : (
                      <Clock3 size={30} />
                    )
                  ) : (
                    <Search size={30} />
                  )}
                  <h3>
                    {view === 'library'
                      ? libraryTab === 'saved'
                        ? t.noSaved
                        : t.noHistory
                      : t.noResults}
                  </h3>
                  <p>
                    {view === 'library'
                      ? libraryTab === 'saved'
                        ? t.noSavedText
                        : t.noHistoryText
                      : t.noResultsText}
                  </p>
                  <button className="primary-button" onClick={() => navigate('all')}>
                    {t.browse}
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
              {result.pages > 1 && (
                <nav className="pagination" aria-label={t.page}>
                  <span>
                    {t.page} <strong>{format(result.page)}</strong> {t.of} {format(result.pages)}
                  </span>
                  <div>
                    <button
                      className="page-arrow"
                      aria-label={t.previous}
                      disabled={busy || result.page === 1}
                      onClick={() => jump(result.page - 1)}
                    >
                      <ChevronLeft size={19} />
                    </button>
                    {pageNumbers.map((number, index) => (
                      <React.Fragment key={number}>
                        {index > 0 && number - pageNumbers[index - 1] > 1 && <span>…</span>}
                        <button
                          disabled={busy}
                          className={number === result.page ? 'active' : ''}
                          aria-label={`${t.page} ${number}`}
                          aria-current={number === result.page ? 'page' : undefined}
                          onClick={() => jump(number)}
                        >
                          {format(number)}
                        </button>
                      </React.Fragment>
                    ))}
                    <button
                      className="page-arrow"
                      aria-label={t.next}
                      disabled={busy || result.page === result.pages}
                      onClick={() => jump(result.page + 1)}
                    >
                      <ChevronRight size={19} />
                    </button>
                  </div>
                </nav>
              )}
            </section>
          </>
        )}
        {!persistent && (
          <p className="storage-warning" role="status">
            <Info size={16} />
            {t.sessionOnly}
          </p>
        )}
        <footer className="site-footer">
          <span>unblockedgames</span>
          <div className="footer-links">
            <button onClick={() => setInfo('about')}>{t.about}</button>
            <button onClick={() => setInfo('privacy')}>{t.privacy}</button>
            <a href="https://github.com/hxracan/hxracan.github.io" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <button
              aria-label={t.backTop}
              onClick={() => window.scrollTo({ top: 0, behavior: scrollBehavior })}
            >
              <ArrowUp size={17} />
            </button>
          </div>
        </footer>
      </main>
      <nav className="bottom-nav" aria-label={t.browse}>
        {[
          [Compass, t.discover, () => navigate('discover'), view === 'discover'],
          [Grid2X2, t.browse, () => navigate('all'), view === 'all'],
          [
            Bookmark,
            t.saved,
            () => navigate('library', 'saved'),
            view === 'library' && libraryTab === 'saved',
          ],
          [
            Clock3,
            t.recent,
            () => navigate('library', 'recent'),
            view === 'library' && libraryTab === 'recent',
          ],
          [Settings2, t.settings, () => navigate('settings'), view === 'settings'],
        ].map(([Icon, label, action, active]) => (
          <button className={active ? 'active' : ''} key={label} onClick={action}>
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {session && !current && !selection && (
        <aside className="session-dock">
          <Thumbnail game={session.game} />
          <div>
            <span>
              <span className="status-dot" />
              {t.stillOpen}
            </span>
            <strong>{session.game.title}</strong>
          </div>
          <button aria-label={t.returnGame} onClick={() => openGame(session.game)}>
            <Play size={19} fill="currentColor" />
          </button>
        </aside>
      )}
      <Player
        selection={selection}
        session={session}
        preferences={preferences}
        onLaunch={launch}
        onMinimize={minimize}
        onStop={stop}
        saved={Boolean(selection && saved.includes(selection.id))}
        onSave={toggleSaved}
        onSaveInfo={() => setInfo('saves')}
      />
      {info && (
        <InfoDialog
          type={info}
          manifest={manifest}
          persistent={persistent}
          onClose={closeInfo}
          onClear={clearLocal}
        />
      )}
    </LanguageContext.Provider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
