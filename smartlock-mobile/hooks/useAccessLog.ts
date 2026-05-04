import { useState, useCallback } from "react";
import { fetchAccessLog, LogEntry, AccessStatus } from "@/services/api";

export type FilterType = "All" | AccessStatus;

export function useAccessLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("All");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAccessLog();
      // Mới nhất lên trước
      setLogs(data.sort((a, b) => b.id - a.id));
      setError(null);
    } catch (e: any) {
      setError(e.message ?? "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }, []);

  const filtered = filter === "All" ? logs : logs.filter((l) => l.status === filter);

  return { logs: filtered, total: logs.length, loading, error, filter, setFilter, refresh };
}
