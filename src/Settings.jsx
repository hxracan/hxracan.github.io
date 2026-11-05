import { useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  ChevronDown,
  Gamepad2,
  HardDrive,
  History,
  Monitor,
  RotateCcw,
  Settings2,
  Smartphone,
  Volume2,
} from 'lucide-react';
import { useLanguage } from './UI';

function Toggle({ label, hint, value, onChange, disabled = false }) {
  return (
    <div className={`setting-row ${disabled ? 'disabled' : ''}`}>
      <div>
        <strong>{label}</strong>
        <p>{hint}</p>
      </div>
      <button
        className={`setting-toggle ${value ? 'on' : ''}`}
        role="switch"
        aria-label={label}
        aria-checked={value}
        disabled={disabled}
        onClick={() => onChange(!value)}
      >
        <i />
      </button>
    </div>
  );
}

function Choice({ label, value, onChange, options }) {
  return (
    <div className="setting-row">
      <strong>{label}</strong>
      <label className="setting-select">
        <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} />
      </label>
    </div>
  );
}

export default function Settings({
  language,
  setLanguage,
  theme,
  setTheme,
  preferences,
  onPreference,
  persistent,
  savedCount,
  historyCount,
  onExport,
  onImport,
  onClearHistory,
  onClearSaved,
  onReset,
}) {
  const { t } = useLanguage();
  const input = useRef(null);
  const [pending, setPending] = useState(''),
    [status, setStatus] = useState('');
  const confirm = () => {
    ({ history: onClearHistory, saved: onClearSaved, reset: onReset })[pending]?.();
    setPending('');
    setStatus(t.dataCleared);
  };
  const importFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error();
      const data = JSON.parse(await file.text());
      onImport(data);
      setStatus(t.imported);
    } catch {
      setStatus(t.importError);
    }
    event.target.value = '';
  };
  return (
    <section className="settings-page">
      <div className="settings-intro">
        <span className="eyebrow">
          <Settings2 size={14} />
          {t.settings}
        </span>
        <h1>{t.settingsTitle}</h1>
        <p>{t.settingsSubtitle}</p>
      </div>
      <div className="settings-layout">
        <div>
          <section className="settings-group">
            <header>
              <Monitor size={21} />
              <div>
                <h2>{t.appearance}</h2>
                <p>{t.appearanceHint}</p>
              </div>
            </header>
            <Choice
              label={t.languageSetting}
              value={language}
              onChange={setLanguage}
              options={[
                ['en', 'English'],
                ['de', 'Deutsch'],
              ]}
            />
            <Choice
              label={t.themeSetting}
              value={theme}
              onChange={setTheme}
              options={[
                ['dark', t.darkOption],
                ['light', t.lightOption],
              ]}
            />
            <Choice
              label={t.textSize}
              value={preferences.textSize}
              onChange={(value) => onPreference('textSize', value)}
              options={[
                ['normal', t.normalText],
                ['large', t.largeText],
              ]}
            />
            <Choice
              label={t.density}
              value={preferences.density}
              onChange={(value) => onPreference('density', value)}
              options={[
                ['comfortable', t.comfortable],
                ['compact', t.compact],
              ]}
            />
            <Toggle
              label={t.reduceMotion}
              hint={t.reduceMotionHint}
              value={preferences.reducedMotion}
              onChange={(value) => onPreference('reducedMotion', value)}
            />
          </section>
          <section className="settings-group">
            <header>
              <Gamepad2 size={21} />
              <div>
                <h2>{t.playerSettings}</h2>
                <p>{t.playerHint}</p>
              </div>
            </header>
            <Toggle
              label={t.keepOpen}
              hint={t.keepOpenHint}
              value={preferences.keepGameOpen}
              onChange={(value) => onPreference('keepGameOpen', value)}
            />
            <Toggle
              label={t.closeWarnings}
              hint={t.closeWarningsHint}
              value={preferences.confirmClose}
              onChange={(value) => onPreference('confirmClose', value)}
            />
            <Toggle
              label={t.expandedDefault}
              hint={t.expandedDefaultHint}
              value={preferences.expandedPlayer}
              onChange={(value) => onPreference('expandedPlayer', value)}
            />
            <div className="setting-note">
              <Volume2 size={18} />
              <div>
                <strong>{t.soundSetting}</strong>
                <p>{t.soundHint}</p>
              </div>
            </div>
          </section>
          <section className="settings-group">
            <header>
              <HardDrive size={21} />
              <div>
                <h2>{t.localData}</h2>
                <p>{t.localDataHint}</p>
              </div>
            </header>
            <div className="data-summary">
              <span>
                <strong>{savedCount}</strong>
                {t.saved}
              </span>
              <span>
                <strong>{historyCount}</strong>
                {t.recent}
              </span>
              <span className="data-status">
                <span className={`status-dot ${persistent ? '' : 'warn'}`} />
                {persistent ? t.historySaved : t.sessionOnly}
              </span>
            </div>
            <p className="backup-hint">{t.backupHint}</p>
            <div className="backup-buttons">
              <button
                className="secondary-button"
                onClick={() => {
                  onExport();
                  setStatus(t.exportReady);
                }}
              >
                <ArrowDownToLine size={17} />
                {t.exportLibrary}
              </button>
              <button className="secondary-button" onClick={() => input.current.click()}>
                <ArrowUpFromLine size={17} />
                {t.importLibrary}
              </button>
              <input
                ref={input}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={importFile}
                aria-label={t.importLibrary}
              />
            </div>
            <div className="data-actions">
              <button onClick={() => setPending('history')}>{t.clearHistory}</button>
              <button onClick={() => setPending('saved')}>{t.clearBookmarks}</button>
            </div>
            {pending && (
              <div className="settings-confirm">
                <strong>{t.confirmDelete}</strong>
                <p>{pending === 'reset' ? t.resetHint : t.clearConfirm}</p>
                <div>
                  <button className="danger-button" onClick={confirm}>
                    {t.confirm}
                  </button>
                  <button className="secondary-button" onClick={() => setPending('')}>
                    {t.cancel}
                  </button>
                </div>
              </div>
            )}
            {status && (
              <p className="settings-status" role="status">
                <Check size={16} />
                {status}
              </p>
            )}
          </section>
        </div>
        <div>
          <section className="settings-group">
            <header>
              <Settings2 size={21} />
              <div>
                <h2>{t.browsing}</h2>
                <p>{t.browsingHint}</p>
              </div>
            </header>
            <Toggle
              label={t.touchDefault}
              hint={t.touchDefaultHint}
              value={preferences.touchDefault}
              onChange={(value) => onPreference('touchDefault', value)}
            />
            <Choice
              label={t.pageSize}
              value={preferences.pageSize}
              onChange={(value) => onPreference('pageSize', Number(value))}
              options={[
                [24, '24'],
                [36, '36'],
                [48, '48'],
              ]}
            />
          </section>
          <section className="settings-group">
            <header>
              <History size={21} />
              <div>
                <h2>{t.historySettings}</h2>
                <p>{t.historyHint}</p>
              </div>
            </header>
            <Toggle
              label={t.rememberHistory}
              hint={t.historyHintSetting}
              value={preferences.rememberHistory}
              onChange={(value) => onPreference('rememberHistory', value)}
            />
            <Toggle
              label={t.rememberTime}
              hint={t.rememberTimeHint}
              value={preferences.rememberTime}
              disabled={!preferences.rememberHistory}
              onChange={(value) => onPreference('rememberTime', value)}
            />
            <Toggle
              label={t.resumePrompt}
              hint={t.resumePromptHint}
              value={preferences.showContinue}
              onChange={(value) => onPreference('showContinue', value)}
            />
            <div className="setting-note">
              <HardDrive size={18} />
              <p>{t.gameSaveNotice}</p>
            </div>
          </section>
          <section className="ipad-tip">
            <Smartphone size={26} />
            <h2>{t.ipadTip}</h2>
            <p>{t.ipadTipText}</p>
          </section>
          <button
            className="reset-settings"
            onClick={() => {
              setPending('reset');
              document
                .querySelector('.settings-group .data-actions')
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          >
            <RotateCcw size={16} />
            {t.resetSettings}
          </button>
        </div>
      </div>
    </section>
  );
}
