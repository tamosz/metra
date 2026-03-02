import { useCallback, useRef } from 'react';

export function useSpinner(callback: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timerRef.current = null;
    intervalRef.current = null;
  }, []);

  const start = useCallback(() => {
    callback();
    timerRef.current = setTimeout(() => {
      intervalRef.current = setInterval(callback, 80);
    }, 400);
  }, [callback]);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchEnd: stop,
  };
}
