import { useCallback, useEffect, useRef } from 'react';

export function useSpinner(callback: () => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timerRef.current = null;
    intervalRef.current = null;
  }, []);

  const start = useCallback(() => {
    callbackRef.current();
    timerRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => callbackRef.current(), 80);
    }, 400);
  }, []);

  useEffect(() => stop, [stop]);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchEnd: stop,
  };
}
