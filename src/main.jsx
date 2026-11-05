import React, { useEffect, useRef, useState, useDeferredValue } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  Heart,
  Clock3,
  Compass,
  Grid2X2,
  Sparkles,
  Shuffle,
  Gamepad2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  RotateCcw,
  Menu,
  Zap,
  Car,
  Puzzle,
  Target,
  Trophy,
  Users,
  Check,
  ExternalLink,
  LoaderCircle,
  Flower2,
} from 'lucide-react';
import { HeroArt } from './Artwork';
import { queryCatalog, getGame } from './catalog-client';
import './styles.css';

const format = (n) => Number(n || 0).toLocaleString('en-US');
const icons = {
  Racing: Car,
  Puzzle: Puzzle,
  Action: Zap,
  Shooting: Target,
  Sports: Trophy,
  '2 Player': Users,
  Multiplayer: Users,
  Arcade: Gamepad2,
};
const navigation = [
  ['discover', 'Discover', Compass],
  ['all', 'All games', Grid2X2],
  ['new', 'New arrivals', Sparkles],
  ['favorites', 'Favorites', Heart],
  ['recent', 'Recently played', Clock3],
];
function useStored(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      return Array.isArray(saved) ? saved : fallback;
    } catch {
      return fallback;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue];
}
function Mark({ small = false }) {
  return (
    <span className={`brand-mark ${small ? 'small' : ''}`}>
      <Flower2 size={small ? 22 : 29} strokeWidth={2.7} />
    </span>
  );
}
function Thumbnail({ game, className = '' }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className={`thumbnail-fallback ${className}`}>
      <Gamepad2 size={50} />
      <span>{game.title}</span>
    </div>
  ) : (
    <img
      className={className}
      src={game.thumbnail}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
function GameCard({ game, onOpen, favorite, onFavorite, index }) {
  return (
    <article className="game-card" style={{ '--delay': `${Math.min(index, 7) * 35}ms` }}>
      <button className="card-open" onClick={() => onOpen(game)} aria-label={`Play ${game.title}`}>
        <div className="card-image">
          <Thumbnail game={game} />
          <span className="hover-play">
            <Gamepad2 size={17} /> Let’s play <ArrowUpRight size={18} />
          </span>
          {game.category === 'Multiplayer' && (
            <span className="card-badge">
              <Users size={11} /> MULTIPLAYER
            </span>
          )}
        </div>
        <div className="card-copy">
          <h3>{game.title}</h3>
          <span>
            {game.category}
            <span className="meta-dot">·</span>
            {game.provider}
          </span>
        </div>
      </button>
      <button
        className={`favorite ${favorite ? 'is-favorite' : ''}`}
        onClick={() => onFavorite(game.id)}
        aria-label={`${favorite ? 'Remove' : 'Save'} ${game.title} ${favorite ? 'from' : 'to'} favorites`}
        aria-pressed={favorite}
      >
        <Heart size={17} fill={favorite ? 'currentColor' : 'none'} />
      </button>
    </article>
  );
}

function Dialog({ title, onClose, children, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Tab') {
        const focusable = [
          ...ref.current.querySelectorAll('button,a[href],input,select,iframe,[tabindex="0"]'),
        ].filter((el) => !el.disabled);
        const first = focusable[0],
          last = focusable.at(-1);
        if (
          e.shiftKey &&
          (document.activeElement === first || document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={ref}
        className={`dialog ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        {children}
      </section>
    </div>
  );
}
function Player({ selection, onClose, favorites, onFavorite, onPlayed }) {
  const [game, setGame] = useState(null),
    [error, setError] = useState(''),
    [started, setStarted] = useState(false),
    [loaded, setLoaded] = useState(false),
    [restart, setRestart] = useState(0);
  const stage = useRef(null);
  useEffect(() => {
    let active = true;
    getGame(selection.id)
      .then((g) => {
        if (active) setGame(g);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [selection.id]);
  const start = () => {
    setStarted(true);
    setLoaded(false);
    onPlayed(selection.id);
  };
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stage.current.requestFullscreen();
    } catch {
      setError('Fullscreen isn’t supported in this browser. You can still play here.');
    }
  };
  return (
    <Dialog title={selection.title} onClose={onClose} className="player-dialog">
      <div className="player-top">
        <div>
          <span className="eyebrow">READY, SET, PLAY</span>
          <h2>{selection.title}</h2>
        </div>
        <button className="icon-button" aria-label="Close game" onClick={onClose}>
          <X />
        </button>
      </div>
      <div ref={stage} className={`player-stage ${started ? 'started' : ''}`}>
        {started && game ? (
          <>
            <iframe
              key={restart}
              title={`${game.title} — ${game.provider}`}
              src={game.embedUrl}
              allow="fullscreen; autoplay; gamepad; pointer-lock"
              allowFullScreen
              onLoad={() => setLoaded(true)}
            />
            {!loaded && (
              <div className="player-loading" aria-live="polite">
                <LoaderCircle className="spin" /> Loading from {game.provider}…
              </div>
            )}
          </>
        ) : (
          <div className="player-cover">
            <Thumbnail game={selection} />
            <div className="launch-copy">
              <span className="launch-gamepad">
                <Gamepad2 size={34} />
              </span>
              <h3>Your next little escape.</h3>
              <p>
                {game
                  ? `Play ${game.title}, served by ${game.provider}.`
                  : 'Getting your game ready…'}
              </p>
              <button className="primary-button" onClick={start} disabled={!game}>
                {!game ? <LoaderCircle size={19} className="spin" /> : <Gamepad2 size={19} />} Play
                now <ArrowUpRight size={19} />
              </button>
              <small>Free to play · Games may contain ads</small>
            </div>
          </div>
        )}
      </div>
      <div className="player-toolbar">
        <span className="provider-credit">
          Via{' '}
          <a
            href={game?.providerUrl || 'https://gamemonetize.com'}
            target="_blank"
            rel="noreferrer"
          >
            {game?.provider || selection.provider} <ExternalLink size={12} />
          </a>
        </span>
        <div>
          <button
            onClick={() => onFavorite(selection.id)}
            aria-pressed={favorites.includes(selection.id)}
          >
            <Heart size={17} fill={favorites.includes(selection.id) ? 'currentColor' : 'none'} />
            {favorites.includes(selection.id) ? 'Saved' : 'Save'}
          </button>
          <button
            onClick={() => {
              setRestart((v) => v + 1);
              setLoaded(false);
            }}
            disabled={!started}
            aria-label="Restart game"
          >
            <RotateCcw size={17} />
            <span>Restart</span>
          </button>
          <button onClick={fullscreen}>
            <Maximize2 size={17} />
            <span>Fullscreen</span>
          </button>
        </div>
      </div>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      <div className="game-details">
        <section>
          <h3>A little about the game</h3>
          <p>{game?.description || 'Loading game details…'}</p>
        </section>
        <section>
          <h3>How to play</h3>
          <p>{game?.controls || 'Use the instructions shown inside the game.'}</p>
          <span className="category-label">{selection.category}</span>
        </section>
      </div>
      {started && (
        <p className="player-help">
          Game not loading? Your browser or network may block the provider.{' '}
          <a href={game.embedUrl} target="_blank" rel="noreferrer">
            Open at source <ExternalLink size={12} />
          </a>
        </p>
      )}
    </Dialog>
  );
}

function App() {
  const [manifest, setManifest] = useState(null),
    [manifestError, setManifestError] = useState(false),
    [nav, setNav] = useState('discover'),
    [category, setCategory] = useState('All games'),
    [q, setQ] = useState(''),
    [sort, setSort] = useState('newest'),
    [page, setPage] = useState(1),
    [source, setSource] = useState('');
  const [result, setResult] = useState({ games: [], total: 0, page: 1, pages: 1 }),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(''),
    [selected, setSelected] = useState(null),
    [info, setInfo] = useState(''),
    [mobileMenu, setMobileMenu] = useState(false),
    [moreCategories, setMoreCategories] = useState(false);
  const [favorites, setFavorites] = useStored('unblockedgames.favorites', []),
    [recent, setRecent] = useStored('unblockedgames.recent', []);
  const search = useRef(null),
    library = useRef(null),
    deferredQ = useDeferredValue(q);
  const navigate = (next, cat = 'All games') => {
    setNav(next);
    setCategory(cat);
    setQ('');
    setPage(1);
    setSort('newest');
    setSource('');
    setMobileMenu(false);
  };
  const closePlayer = React.useCallback(() => {
    setSelected(null);
    const url = new URL(window.location);
    url.searchParams.delete('game');
    window.history.replaceState({}, '', url);
  }, []);
  const toggleFavorite = (id) =>
    setFavorites((items) =>
      items.includes(id) ? items.filter((x) => x !== id) : [id, ...items].slice(0, 500),
    );
  const markPlayed = (id) =>
    setRecent((items) => [id, ...items.filter((x) => x !== id)].slice(0, 100));
  const openGame = (game) => {
    setSelected(game);
    const url = new URL(window.location);
    url.searchParams.set('game', game.id);
    window.history.replaceState({}, '', url);
  };
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}catalog/manifest.json`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setManifest(data);
        setResult((old) =>
          old.games.length ? old : { ...old, games: data.featured, total: data.count },
        );
      })
      .catch(() => setManifestError(true));
    const game = new URLSearchParams(window.location.search).get('game');
    if (game)
      getGame(game)
        .then((g) => setSelected(g))
        .catch(() => setError('That game is no longer available. Try another one below.'));
    const onKey = (e) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) &&
        !document.querySelector('[role="dialog"]')
      ) {
        e.preventDefault();
        search.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError('');
    queryCatalog({
      q: deferredQ,
      category,
      sort: nav === 'discover' && sort === 'newest' ? 'discovery' : sort,
      page,
      source,
      ids: nav === 'favorites' ? favorites : nav === 'recent' ? recent : null,
    })
      .then((data) => {
        if (active) {
          setResult(data);
          setBusy(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setBusy(false);
        }
      });
    return () => {
      active = false;
    };
  }, [deferredQ, category, sort, page, nav, source, favorites, recent]);
  const jumpPage = (next) => {
    setPage(next);
    library.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const random = async () => {
    setError('');
    try {
      const { game } = await queryCatalog({ sort: 'random', category });
      if (game) openGame(game);
    } catch (e) {
      setError(e.message);
    }
  };
  const categories = manifest?.categories || [];
  const title = q
    ? `Results for “${q}”`
    : nav === 'favorites'
      ? 'Your kind of fun.'
      : nav === 'recent'
        ? 'Back for another round.'
        : category !== 'All games'
          ? `${category}. All day.`
          : nav === 'new'
            ? 'Fresh out of the arcade.'
            : nav === 'all'
              ? 'The whole playground.'
              : 'Find your next obsession.';
  const isHome = nav === 'discover' && category === 'All games' && !q && !source;
  const currentPage = result.page || 1;
  const pageNumbers = [...new Set([1, currentPage - 1, currentPage, currentPage + 1, result.pages])]
    .filter((p) => p >= 1 && p <= result.pages)
    .sort((a, b) => a - b);
  return (
    <>
      <a className="skip-link" href="#library">
        Skip to games
      </a>
      {mobileMenu && (
        <button
          className="sidebar-scrim"
          onClick={() => setMobileMenu(false)}
          aria-label="Close menu"
        />
      )}
      <aside className={`sidebar ${mobileMenu ? 'open' : ''}`}>
        <button
          className="brand"
          onClick={() => navigate('discover')}
          aria-label="unblockedgames home"
        >
          <Mark />
          <span>
            unblocked<span>games</span>
            <i />
          </span>
        </button>
        <span className="sidebar-caption">YOUR DAILY DOSE OF FUN</span>
        <nav aria-label="Main navigation">
          {navigation.map(([id, label, Icon]) => (
            <button
              key={id}
              className={nav === id && category === 'All games' ? 'active' : ''}
              onClick={() => navigate(id)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {id === 'favorites' && favorites.length > 0 ? (
                <span className="nav-count">{favorites.length}</span>
              ) : id === 'new' ? (
                <span className="new-dot" />
              ) : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <span className="sidebar-label">FIND YOUR THING</span>
        <nav className="category-nav" aria-label="Game categories">
          {categories.slice(0, moreCategories ? categories.length : 8).map((cat) => {
            const Icon = icons[cat.name] || Gamepad2;
            return (
              <button
                key={cat.name}
                onClick={() => navigate('all', cat.name)}
                className={category === cat.name ? 'active' : ''}
              >
                <Icon size={18} />
                <span>{cat.name}</span>
              </button>
            );
          })}
          <button className="more-categories" onClick={() => setMoreCategories((v) => !v)}>
            <Grid2X2 size={17} />
            {moreCategories ? 'Fewer categories' : 'All categories'}
            <ChevronDown size={13} className={moreCategories ? 'rotate' : ''} />
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <div className="mini-flower">✳</div>
            <h3>
              A little escape.
              <br />A lot of fun.
            </h3>
            <p>
              No downloads. No sign-ups.
              <br />
              Just good games.
            </p>
            <span className="free-sticker">
              ALWAYS FREE <ArrowUpRight size={13} />
            </span>
          </div>
          <button className="about-link" onClick={() => setInfo('about')}>
            Made for your downtime <ArrowUpRight size={13} />
          </button>
        </div>
      </aside>
      <div className="site-shell">
        <header className="topbar">
          <div className="topbar-greeting">
            <button
              className="mobile-menu icon-button"
              onClick={() => setMobileMenu(true)}
              aria-label="Open menu"
            >
              <Menu />
            </button>
            <span>
              Less scrolling. <strong>More playing.</strong>
              <span className="greeting-spark">✳</span>
            </span>
          </div>
          <div className="header-actions">
            <label className="search">
              <Search size={18} />
              <input
                ref={search}
                aria-label="Search games"
                placeholder="Find your next favorite…"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                  if (e.target.value) {
                    setNav('all');
                    setCategory('All games');
                  }
                }}
              />
              {q ? (
                <button aria-label="Clear search" onClick={() => setQ('')}>
                  <X size={15} />
                </button>
              ) : (
                <kbd>/</kbd>
              )}
            </label>
            <button className="random-button" onClick={random}>
              <Shuffle size={17} />
              <span>Surprise me</span>
              <ArrowUpRight size={16} />
            </button>
          </div>
        </header>
        <main>
          <div className="page-intro">
            <div>
              <span className="eyebrow">
                <span className="live-dot" /> YOUR NEXT GOOD TIME STARTS HERE
              </span>
              <h1>
                Find your fun<span className="lime-period">.</span>
              </h1>
            </div>
            <div className="intro-note">
              <span className="game-count">
                {manifest ? format(manifest.count) : 'Thousands of'} games
              </span>
              <span>Zero downloads. Endless possibilities.</span>
            </div>
          </div>
          {isHome && (
            <div className="hero-grid">
              <section className="hero-feature">
                <HeroArt />
                <div className="hero-content">
                  <span className="hero-kicker">
                    <span className="kicker-dot" /> THE SPOTLIGHT <ArrowUpRight size={13} />
                  </span>
                  <h2>
                    ALL GAS.
                    <br />
                    ALL GOOD.
                  </h2>
                  <p>
                    A new track. A fresh challenge.
                    <br />
                    Your next favorite racing game.
                  </p>
                  <button
                    className="hero-play"
                    onClick={() => manifest?.featured?.[0] && openGame(manifest.featured[0])}
                    disabled={!manifest?.featured?.length}
                  >
                    <Gamepad2 size={19} />
                    Play Buggy Blast
                    <ArrowUpRight size={18} />
                  </button>
                  <span className="hero-footnote">
                    RACING <span>·</span> FREE TO PLAY
                  </span>
                </div>
                <div className="hero-number">THE FEATURED PICK</div>
                <div className="hero-decoration">
                  PLAY
                  <br />
                  IT YOUR
                  <br />
                  WAY.
                </div>
              </section>
              <section className="hero-side">
                <div className="side-top">
                  <span>
                    <Sparkles size={14} /> FIND A NEW FAVORITE
                  </span>
                  <ArrowUpRight size={21} />
                </div>
                <h2>
                  Small break.
                  <br />
                  <span>Big energy.</span>
                </h2>
                <p>
                  Your five-minute escape
                  <br />
                  might last a little longer.
                </p>
                <div className="abstract-art" aria-hidden="true">
                  <div className="art-ring" />
                  <div className="art-sphere" />
                  <div className="art-star">✳</div>
                  <div className="art-spark">✧</div>
                </div>
                <button onClick={random} className="side-play">
                  Roll the dice <Shuffle size={18} />
                </button>
                <div className="side-bottom">
                  <span className="live-dot" /> INSTANT FUN. EVERY TIME.
                </div>
              </section>
            </div>
          )}
          <div className="category-strip" aria-label="Browse categories">
            {[
              'All games',
              'Action',
              'Adventure',
              'Racing',
              'Puzzle',
              'Arcade',
              'Shooting',
              '2 Player',
            ]
              .filter((name) => name === 'All games' || categories.some((c) => c.name === name))
              .map((name) => {
                const Icon = icons[name] || (name === 'All games' ? Grid2X2 : Compass);
                return (
                  <button
                    key={name}
                    className={category === name ? 'selected' : ''}
                    onClick={() => {
                      setCategory(name);
                      setPage(1);
                    }}
                  >
                    <Icon size={16} />
                    {name}
                  </button>
                );
              })}
            <label className="category-select">
              <span className="sr-only">More categories</span>
              <select
                value={categories.some((c) => c.name === category) ? category : ''}
                onChange={(e) => {
                  setCategory(e.target.value || 'All games');
                  setPage(1);
                }}
              >
                <option value="">More categories</option>
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({format(c.count)})
                  </option>
                ))}
              </select>
              <ChevronDown size={15} />
            </label>
          </div>
          <section id="library" className="library" ref={library}>
            <div className="section-heading">
              <div>
                <div className="section-kicker">
                  {nav === 'favorites'
                    ? 'THE KEEPERS'
                    : nav === 'recent'
                      ? 'PICK UP WHERE YOU LEFT OFF'
                      : nav === 'new'
                        ? 'NEW ARRIVALS'
                        : 'GOOD GAMES. GOOD TIMES.'}
                </div>
                <h2>{title}</h2>
                <p className="results-count" aria-live="polite">
                  {busy
                    ? 'Finding your games…'
                    : `${format(result.total)} ${result.total === 1 ? 'game' : 'games'}${category !== 'All games' ? ` in ${category}` : ' to explore'}`}
                </p>
              </div>
              <div className="library-filters">
                <label>
                  <span className="sr-only">Game provider</span>
                  <select
                    aria-label="Game provider"
                    value={source}
                    onChange={(e) => {
                      setSource(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">All providers</option>
                    <option>GameMonetize</option>
                    <option>PlayKovo</option>
                  </select>
                  <ChevronDown size={13} />
                </label>
                <label>
                  <span className="sr-only">Sort games</span>
                  <select
                    aria-label="Sort games"
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="newest">
                      {nav === 'discover' ? 'Our picks' : 'Newest first'}
                    </option>
                    <option value="az">A → Z</option>
                    <option value="discovery">Discover picks</option>
                  </select>
                  <ChevronDown size={13} />
                </label>
              </div>
            </div>
            {(error || manifestError) && (
              <div className="error-banner" role="alert">
                {error || 'Could not load the catalog. Please refresh and try again.'}
                <button onClick={() => window.location.reload()}>
                  Try again <RotateCcw size={14} />
                </button>
              </div>
            )}
            <div
              className={`game-grid ${busy && result.games.length ? 'updating' : ''}`}
              aria-busy={busy}
            >
              {result.games.map((game, index) => (
                <GameCard
                  key={game.id}
                  game={game}
                  index={index}
                  onOpen={openGame}
                  favorite={favorites.includes(game.id)}
                  onFavorite={toggleFavorite}
                />
              ))}
              {busy &&
                !result.games.length &&
                Array.from({ length: 12 }, (_, i) => (
                  <div className="skeleton-card" key={i}>
                    <div />
                    <span />
                    <small />
                  </div>
                ))}
            </div>
            {!busy && !result.games.length && !error && (
              <div className="empty-state">
                {nav === 'favorites' ? (
                  <Heart size={40} />
                ) : nav === 'recent' ? (
                  <Clock3 size={40} />
                ) : (
                  <Search size={40} />
                )}
                <h3>
                  {nav === 'favorites'
                    ? 'Good games are worth keeping.'
                    : nav === 'recent'
                      ? 'Your next adventure starts here.'
                      : 'No games found. Yet.'}
                </h3>
                <p>
                  {nav === 'favorites'
                    ? 'Tap the heart on any game to add it to your collection.'
                    : nav === 'recent'
                      ? 'Play a game and it will be waiting for you here.'
                      : 'Try a different search, category, or provider.'}
                </p>
                <button className="primary-button" onClick={() => navigate('all')}>
                  Explore all games <ArrowRight size={17} />
                </button>
              </div>
            )}
            {result.pages > 1 && (
              <nav className="pagination" aria-label="Game pages">
                <span>
                  Page {format(currentPage)} of {format(result.pages)}
                </span>
                <div>
                  <button
                    aria-label="Previous page"
                    disabled={currentPage === 1 || busy}
                    onClick={() => jumpPage(currentPage - 1)}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {pageNumbers.map((p, i) => (
                    <React.Fragment key={p}>
                      {i > 0 && p - pageNumbers[i - 1] > 1 && (
                        <span className="page-ellipsis">…</span>
                      )}
                      <button
                        className={p === currentPage ? 'current' : ''}
                        aria-current={p === currentPage ? 'page' : undefined}
                        aria-label={`Page ${p}`}
                        disabled={busy}
                        onClick={() => jumpPage(p)}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
                  <button
                    aria-label="Next page"
                    disabled={currentPage === result.pages || busy}
                    onClick={() => jumpPage(currentPage + 1)}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </nav>
            )}
          </section>
          {isHome && (
            <section className="collection-banner">
              <div className="banner-symbol" aria-hidden="true">
                ✳
              </div>
              <div>
                <span className="eyebrow">BETTER TOGETHER</span>
                <h2>Good games. Great company.</h2>
                <p>Grab a friend. A little friendly competition never hurt.</p>
              </div>
              <button onClick={() => navigate('all', '2 Player')}>
                Explore 2 player <ArrowUpRight size={18} />
              </button>
            </section>
          )}
          <div className="value-strip">
            <span>
              <Gamepad2 size={18} /> Thousands of ways to play
            </span>
            <span>
              <Zap size={18} /> No downloads, ever
            </span>
            <span>
              <Heart size={18} /> A little fun for everyone
            </span>
          </div>
          <footer>
            <button className="footer-brand" onClick={() => navigate('discover')}>
              <Mark small />
              <strong>
                unblockedgames<span>.</span>
              </strong>
            </button>
            <p>Your downtime. Upgraded.</p>
            <div>
              <button onClick={() => setInfo('about')}>About the games</button>
              <button onClick={() => setInfo('privacy')}>Privacy</button>
              <a
                href="https://github.com/hxracan/hxracan.github.io"
                target="_blank"
                rel="noreferrer"
              >
                GitHub <ArrowUpRight size={12} />
              </a>
            </div>
          </footer>
        </main>
      </div>
      {selected && (
        <Player
          key={selected.id}
          selection={selected}
          onClose={closePlayer}
          favorites={favorites}
          onFavorite={toggleFavorite}
          onPlayed={markPlayed}
        />
      )}
      {info && (
        <Dialog
          title={info === 'about' ? 'About the games' : 'Privacy'}
          onClose={() => setInfo('')}
          className="info-dialog"
        >
          <button className="icon-button info-close" onClick={() => setInfo('')} aria-label="Close">
            <X />
          </button>
          <Mark />
          <h2>{info === 'about' ? 'A whole lot of play.' : 'Your browser. Your collection.'}</h2>
          {info === 'about' ? (
            <>
              <p>
                unblockedgames brings together {format(manifest?.count)} games from publisher
                distribution feeds. Games, icons, names, and other assets belong to their respective
                developers and rights holders.
              </p>
              <p>
                Games run directly from{' '}
                <a href="https://gamemonetize.com/faq" target="_blank" rel="noreferrer">
                  GameMonetize
                </a>{' '}
                and{' '}
                <a href="https://playkovo.com/partners/terms" target="_blank" rel="noreferrer">
                  PlayKovo
                </a>
                . Their branding, advertising, and credits are preserved. This site isn’t affiliated
                with Poki or Playvio.
              </p>
              <p>
                The catalog includes every valid game returned by these feeds at the latest sync.
                Provider availability, device support, and network restrictions can affect
                individual games.
              </p>
              <p className="info-meta">
                Catalog updated:{' '}
                {manifest ? new Date(manifest.updatedAt).toLocaleDateString('en-GB') : 'Loading…'}
              </p>
            </>
          ) : (
            <>
              <p>
                Favorites and recently played games are saved in this browser’s local storage. This
                site has no account system and adds no analytics or advertising scripts of its own.
              </p>
              <p>
                Game thumbnail requests go to the image providers. Opening a game loads a
                third-party embed that may use cookies, ads, and analytics under the provider’s own
                policy. GitHub Pages handles hosting requests. Google Fonts serves the interface
                font.
              </p>
              <p>
                <a href="https://gamemonetize.com/privacy-policy" target="_blank" rel="noreferrer">
                  GameMonetize privacy
                </a>{' '}
                ·{' '}
                <a href="https://playkovo.com/privacy" target="_blank" rel="noreferrer">
                  PlayKovo privacy
                </a>{' '}
                ·{' '}
                <a
                  href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub privacy
                </a>
              </p>
              <button
                className="clear-data"
                onClick={() => {
                  setFavorites([]);
                  setRecent([]);
                  setInfo('cleared');
                }}
              >
                Clear saved games on this device
              </button>
              {info === 'cleared' && (
                <p role="status">
                  <Check size={16} /> Your saved games have been cleared.
                </p>
              )}
            </>
          )}
        </Dialog>
      )}
    </>
  );
}
createRoot(document.getElementById('root')).render(<App />);
