import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  ExternalLink,
  Gamepad2,
  Info,
  LoaderCircle,
  Maximize2,
  Minimize2,
  Play,
  X,
} from 'lucide-react';
import { getGame } from './catalog-client';
import { Dialog, Thumbnail, useLanguage } from './UI';
import { categoryName } from './i18n';
import { useStableEvent } from './hooks';

export default function Player({
  selection,
  session,
  preferences,
  onLaunch,
  onMinimize,
  onStop,
  saved,
  onSave,
  onSaveInfo,
}) {
  const { language, t } = useLanguage();
  const [game, setGame] = useState(null),
    [failed, setFailed] = useState(false),
    [loaded, setLoaded] = useState(null),
    [expanded, setExpanded] = useState(false),
    [confirmation, setConfirmation] = useState('');
  const isCurrent = Boolean(selection && session && selection.id === session.game.id);
  useEffect(() => {
    if (selection) setExpanded(preferences.expandedPlayer);
  }, [selection?.id, preferences.expandedPlayer]);
  useEffect(() => {
    if (!selection) return;
    let active = true;
    setFailed(false);
    setConfirmation('');
    if (session?.game.id === selection.id) {
      setGame(session.game);
      return;
    }
    setGame(null);
    getGame(selection.id)
      .then((value) => {
        if (active) setGame(value);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [selection?.id, session]);
  const hide = useStableEvent(() => {
    setExpanded(false);
    setConfirmation('');
    onMinimize();
  });
  const minimize = useStableEvent(() => {
    if (isCurrent && !preferences.keepGameOpen && preferences.confirmClose) {
      setConfirmation('stop');
      return;
    }
    hide();
  });
  const close = () => {
    if (isCurrent && preferences.confirmClose) setConfirmation('stop');
    else {
      if (isCurrent) onStop();
      hide();
    }
  };
  const launch = () => {
    if (session && !isCurrent && preferences.confirmClose) {
      setConfirmation('switch');
      return;
    }
    if (game) onLaunch(game);
  };
  const confirm = () => {
    if (confirmation === 'stop') {
      onStop();
      hide();
    } else if (game) {
      onLaunch(game);
    }
    setConfirmation('');
  };
  return (
    <Dialog
      open={Boolean(selection)}
      title={selection?.title || ''}
      onClose={minimize}
      className={`player-modal ${expanded ? 'expanded' : ''}`}
    >
      <header className="player-header">
        <button className="back-button" onClick={minimize}>
          <ArrowLeft size={19} />
          <span>{t.back}</span>
        </button>
        <div className="player-title">
          <span>{selection?.title}</span>
          {isCurrent && (
            <small>
              <span className="status-dot" />
              {t.sessionOpen}
            </small>
          )}
        </div>
        <button className="icon-button" aria-label={t.closeGame} onClick={close}>
          <X size={22} />
        </button>
      </header>
      <div className={`player-stage ${game?.orientation === 'portrait' ? 'portrait-game' : ''}`}>
        {session && (
          <iframe
            key={session.token}
            hidden={!isCurrent}
            title={`${session.game.title} / ${session.game.provider}`}
            src={session.game.embedUrl}
            allow="fullscreen; autoplay; gamepad; pointer-lock"
            allowFullScreen
            onLoad={() => setLoaded(session.token)}
          />
        )}
        {!isCurrent && selection && (
          <div className="launch-screen">
            <Thumbnail game={game || selection} cover />
            <div className="launch-scrim" />
            <div className="launch-content">
              <span className="eyebrow">
                {categoryName(selection.category, language)}
                <span>/</span>
                {selection.provider}
              </span>
              <h2>{selection.title}</h2>
              <button className="primary-button" onClick={launch} disabled={!game}>
                {!game && !failed ? (
                  <LoaderCircle className="spin" size={20} />
                ) : (
                  <Play size={19} fill="currentColor" />
                )}
                {t.play}
                <ArrowUpRight size={20} />
              </button>
              <p>{failed ? t.gameError : game ? t.ads : t.prepare}</p>
            </div>
          </div>
        )}
        {isCurrent && loaded !== session.token && (
          <div className="frame-loading" role="status">
            <LoaderCircle size={16} className="spin" />
            {t.loading}
          </div>
        )}
        {confirmation && (
          <div className="player-confirm">
            <div>
              <span className="confirm-icon">
                <Gamepad2 size={28} />
              </span>
              <h2>{confirmation === 'switch' ? t.switchTitle : t.stopTitle}</h2>
              <p>{confirmation === 'switch' ? t.switchText : t.stopText}</p>
              <button className="primary-button" onClick={confirm}>
                {confirmation === 'switch' ? t.switchConfirm : t.stopConfirm}
                <ArrowUpRight size={18} />
              </button>
              <button className="secondary-button" onClick={() => setConfirmation('')}>
                {confirmation === 'switch' ? t.keepPlaying : t.minimize}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="player-toolbar">
        <a
          className="provider-link"
          href={game?.providerUrl || 'https://gamemonetize.com'}
          target="_blank"
          rel="noreferrer"
        >
          {t.provider} <strong>{game?.provider || selection?.provider}</strong>
          <ExternalLink size={13} />
        </a>
        <div>
          <button
            className={saved ? 'saved-button' : ''}
            onClick={() => selection && onSave(selection.id)}
            aria-pressed={saved}
          >
            <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
            <span>{saved ? t.savedShort : t.save}</span>
          </button>
          <button
            onClick={() => setExpanded((value) => !value)}
            aria-label={expanded ? t.shrink : t.expand}
          >
            {expanded ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
            <span>{expanded ? t.shrink : t.expand}</span>
          </button>
        </div>
      </div>
      <div className="player-lower">
        <div className="player-session-note">
          <Info size={17} />
          <p>{t.sessionNote}</p>
          <button className="text-button" onClick={onSaveInfo}>
            {t.saveTitle}
            <ArrowUpRight size={13} />
          </button>
        </div>
        <div className="player-details">
          <section>
            <h3>{t.controls}</h3>
            <p>{game?.controls || t.prepare}</p>
            {game?.embedUrl && (
              <a href={game.embedUrl} target="_blank" rel="noreferrer">
                {t.openSource}
                <ExternalLink size={13} />
              </a>
            )}
          </section>
          <section>
            <h3>{t.aboutGame}</h3>
            <p>{game?.description || t.prepare}</p>
            <small>{t.providerText}</small>
          </section>
        </div>
      </div>
    </Dialog>
  );
}
