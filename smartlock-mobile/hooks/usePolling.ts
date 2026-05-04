import { useEffect, useRef, useCallback } from "react";

/**
 * Gọi callback theo interval. Dừng khi unmount.
 * @param callback  hàm async cần gọi lặp lại
 * @param interval  milliseconds (default 2000, sync với ESP32)
 * @param enabled   bật/tắt polling
 */
export function usePolling(
  callback: () => Promise<void> | void,
  interval: number = 2000,
  enabled: boolean = true
) {
  const savedCallback = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }

    // Gọi ngay lần đầu
    savedCallback.current();

    timerRef.current = setInterval(() => {
      savedCallback.current();
    }, interval);

    return stop;
  }, [interval, enabled, stop]);
}
