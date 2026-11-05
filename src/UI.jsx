import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Gamepad2, Bookmark, Hand, ArrowUpRight, Clock3, X } from 'lucide-react';
import { messages, categoryName } from './i18n';

export const LanguageContext = createContext({ language: 'en', t: messages.en });
export const useLanguage = () => useContext(LanguageContext);

export function Brand() {
  return (
    <span className="brand-content">
      <span>
        unblocked<span className="brand-soft">games</span>
      </span>
    </span>
  );
}

export function Thumbnail({ game, cover = false, eager = false, className = '' }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className={`thumbnail-fallback ${className}`}>
      <Gamepad2 size={40} />
      <span>{game.title}</span>
    </div>
  ) : (
    <img
      src={cover ? game.cover || game.thumbnail : game.thumbnail}
      alt=""
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

export function GameCard({ game, onOpen, saved, onSave, record, featured = false }) {
  const { language, t } = useLanguage();
  return (
    <article className={`game-card ${featured ? 'featured-game' : ''}`}>
      <button
        className="game-card-open"
        onClick={() => onOpen(game)}
        aria-label={`${t.openGame}: ${game.title}`}
      >
        <div className="game-card-image">
          <Thumbnail game={game} cover={featured} eager={featured} />
          {record && (
            <span className="card-time">
              <Clock3 size={12} />
              {Math.max(1, Math.round(record.seconds / 60))} min
            </span>
          )}
        </div>
        <div className="game-card-meta">
          <h3>{game.title}</h3>
          <span>
            {categoryName(game.category, language)}
            {game.touch && (
              <>
                <span className="meta-separator">/</span>
                <Hand size={12} />
              </>
            )}
          </span>
        </div>
      </button>
      <button
        className={`card-bookmark ${saved ? 'is-saved' : ''}`}
        onClick={() => onSave(game.id)}
        aria-pressed={saved}
        aria-label={`${saved ? t.unsave : t.save}: ${game.title}`}
      >
        <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
      </button>
    </article>
  );
}

export function Dialog({ open = true, title, onClose, children, className = '' }) {
  const root = useRef(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    root.current?.focus();
    const keydown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key !== 'Tab') return;
      const items = [
        ...root.current.querySelectorAll('button,a[href],input,select,iframe,[tabindex="0"]'),
      ].filter((el) => !el.disabled && el.getClientRects().length);
      const first = items[0],
        last = items.at(-1);
      if (
        e.shiftKey &&
        (document.activeElement === first || document.activeElement === root.current)
      ) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', keydown);
      if (previous?.isConnected) previous.focus();
    };
  }, [open, onClose]);
  return (
    <div
      className={`dialog-backdrop ${className}`}
      hidden={!open}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={root}
        className="dialog"
        role="dialog"
        aria-modal={open ? 'true' : undefined}
        aria-label={title}
        tabIndex={-1}
      >
        {children}
      </section>
    </div>
  );
}

export function InfoDialog({ type, onClose, manifest, persistent, onClear }) {
  const { language, t } = useLanguage();
  const [confirmClear, setConfirmClear] = useState(false),
    [cleared, setCleared] = useState(false);
  return (
    <Dialog
      title={t[type === 'about' ? 'about' : type === 'privacy' ? 'privacy' : 'saveTitle']}
      onClose={onClose}
      className="info-modal"
    >
      <header className="info-header">
        <span className="eyebrow">UNBLOCKEDGAMES</span>
        <button className="icon-button" aria-label={t.close} onClick={onClose}>
          <X size={21} />
        </button>
      </header>
      <h2>
        {t[type === 'about' ? 'aboutTitle' : type === 'privacy' ? 'privacyTitle' : 'saveTitle']}
      </h2>
      {type === 'saves' ? (
        <>
          <p>{t.saveText}</p>
          <div className="storage-line">
            <span className={`status-dot ${persistent ? '' : 'warn'}`} />
            {persistent ? t.historySaved : t.sessionOnly}
          </div>
        </>
      ) : type === 'about' ? (
        <>
          <p>{t.aboutText}</p>
          <p>{t.aboutAvailability}</p>
          <div className="provider-links">
            <a href="https://gamemonetize.com/faq" target="_blank" rel="noreferrer">
              GameMonetize
              <ArrowUpRight size={15} />
            </a>
            <a href="https://playkovo.com/partners/terms" target="_blank" rel="noreferrer">
              PlayKovo
              <ArrowUpRight size={15} />
            </a>
          </div>
          <p className="muted">
            {t.updated}:{' '}
            {manifest &&
              new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-GB').format(
                new Date(manifest.updatedAt),
              )}
          </p>
        </>
      ) : (
        <>
          <p>{t.privacyText}</p>
          <div className="provider-links">
            <a href="https://gamemonetize.com/privacy-policy" target="_blank" rel="noreferrer">
              GameMonetize
              <ArrowUpRight size={15} />
            </a>
            <a href="https://playkovo.com/privacy" target="_blank" rel="noreferrer">
              PlayKovo
              <ArrowUpRight size={15} />
            </a>
          </div>
          {confirmClear ? (
            <div className="clear-confirm">
              <p>{t.clearConfirm}</p>
              <button
                className="danger-button"
                onClick={() => {
                  onClear();
                  setConfirmClear(false);
                  setCleared(true);
                }}
              >
                {t.clearData}
              </button>
              <button className="text-button" onClick={() => setConfirmClear(false)}>
                {t.later}
              </button>
            </div>
          ) : (
            <button
              className="secondary-button clear-library"
              onClick={() => setConfirmClear(true)}
            >
              {t.clearData}
            </button>
          )}
          {cleared && <p role="status">{t.cleared}</p>}
        </>
      )}
    </Dialog>
  );
}
