import { useState, useEffect, useCallback, useRef } from 'react';
import { readStorage, writeStorage } from './storage';
export function useLocalState(key, fallback, validate) {
  const [value, setValue] = useState(() => readStorage(key, fallback, validate));
  const [persistent, setPersistent] = useState(true);
  const current = useRef(value);
  useEffect(() => setPersistent(writeStorage(key, current.current)), [key]);
  const update = useCallback(
    (next) => {
      const resolved = typeof next === 'function' ? next(current.current) : next;
      current.current = resolved;
      const saved = writeStorage(key, resolved);
      setPersistent(saved);
      setValue(resolved);
    },
    [key],
  );
  return [value, update, persistent];
}
export function usePlayClock(session, visible, onTime) {
  const callback = useRef(onTime);
  callback.current = onTime;
  useEffect(() => {
    if (!session) return;
    let last = performance.now();
    let running = visible && document.visibilityState === 'visible';
    const flush = () => {
      const now = performance.now();
      if (running) callback.current(session.game.id, Math.min((now - last) / 1000, 30));
      last = now;
    };
    const visibility = () => {
      flush();
      running = visible && document.visibilityState === 'visible';
    };
    const interval = setInterval(flush, 10000);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', flush);
    return () => {
      flush();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', flush);
    };
  }, [session, visible]);
}
export function useStableEvent(fn) {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback((...args) => ref.current(...args), []);
}
