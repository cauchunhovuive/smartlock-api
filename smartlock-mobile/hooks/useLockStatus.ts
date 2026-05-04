import { useState, useCallback } from "react";
import { fetchDoorStatus, openDoor, DoorStatus } from "@/services/api";
import { usePolling } from "./usePolling";
import { POLL_INTERVAL } from "@/constants/config";

export function useLockStatus() {
  const [status, setStatus] = useState<DoorStatus>({ open: false });
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const poll = useCallback(async () => {
    try {
      const s = await fetchDoorStatus();
      setStatus(s);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(poll, POLL_INTERVAL);

  const triggerOpen = useCallback(async () => {
    setOpening(true);
    try {
      await openDoor();
      // Ngay sau khi gửi lệnh, poll lại status
      await poll();
    } catch (e: any) {
      setError(e.message ?? "Không mở được");
    } finally {
      setOpening(false);
    }
  }, [poll]);

  return { status, loading, opening, error, triggerOpen, refresh: poll };
}
