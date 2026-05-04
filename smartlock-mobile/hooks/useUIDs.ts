import { useState, useCallback } from "react";
import { fetchUIDs, addUID, deleteUID, UIDEntry } from "@/services/api";

export function useUIDs() {
  const [uids, setUids] = useState<UIDEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUIDs();
      setUids(data);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (uid: string, label: string) => {
    setSaving(true);
    try {
      await addUID(uid, label);
      await refresh();
    } catch (e: any) {
      setError(e.message ?? "Không thêm được");
      throw e;
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const remove = useCallback(async (id: number) => {
    try {
      await deleteUID(id);
      setUids((prev) => prev.filter((u) => u.id !== id));
    } catch (e: any) {
      setError(e.message ?? "Không xóa được");
      throw e;
    }
  }, []);

  return { uids, loading, saving, error, refresh, add, remove };
}
