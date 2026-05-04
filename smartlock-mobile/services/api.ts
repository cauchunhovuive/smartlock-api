import { BASE_URL } from "@/constants/config";

export type AccessStatus = "Access" | "Denied";

// Khớp với bảng `logs` trong DB Railway (cột `time` không phải `timestamp`)
export interface LogEntry {
  id: number;
  uid: string;
  status: AccessStatus;
  time: string;
}

export interface DoorStatus {
  open: boolean;
  triggeredBy?: string;
}

// ── Door ──────────────────────────────────────────────────────────────────────

/**
 * Poll trạng thái cửa — GET /check_open.php
 * Response: "OPEN:<name>" hoặc "NONE"
 * Lưu ý: pendingCommand xóa ngay sau khi đọc (in-memory trên server)
 * Nên chỉ dùng để trigger, không dùng để hiển thị trạng thái liên tục
 */
export async function fetchDoorStatus(): Promise<DoorStatus> {
  const res = await fetch(`${BASE_URL}/api/door-status`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return {
    open: data.open,
    triggeredBy: data.triggeredBy ?? undefined,
  };
}

/**
 * Mở cửa từ xa — POST /open_door
 * Server set pendingCommand = "OPEN:remote"
 * ESP32 poll check_open.php sẽ đọc và mở servo
 */
export async function openDoor(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/open_door`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json(); // { success: true, message: "Door opening..." }
}

// ── Access Log ────────────────────────────────────────────────────────────────

/**
 * Lấy lịch sử access log — GET /api/logs
 * Trả về 50 bản ghi mới nhất (ORDER BY time DESC)
 */
export async function fetchAccessLog(): Promise<LogEntry[]> {
  const res = await fetch(`${BASE_URL}/api/logs`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Ghi log — GET /insert.php?uid=XX&status=Access
 * Dùng khi app trigger open thủ công để ghi vào DB
 */
export async function insertLog(uid: string, status: AccessStatus): Promise<void> {
  const encodedUid = encodeURIComponent(uid);
  const encodedStatus = encodeURIComponent(status);
  await fetch(`${BASE_URL}/insert.php?uid=${encodedUid}&status=${encodedStatus}`);
}

// ── UID Management ────────────────────────────────────────────────────────────
// Hiện server.js chưa có endpoint quản lý UID (UID hardcode trong ESP32)
// Các hàm dưới đây gọi endpoint cần thêm vào server.js

export interface UIDEntry {
  id: number;
  uid: string;
  label: string;
  createdAt: string;
}

/** GET /api/uids */
export async function fetchUIDs(): Promise<UIDEntry[]> {
  const res = await fetch(`${BASE_URL}/api/uids`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** POST /api/uids  { uid, label } */
export async function addUID(uid: string, label: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/uids`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, label }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

/** DELETE /api/uids/:id */
export async function deleteUID(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/uids/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
