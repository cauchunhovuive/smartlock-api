import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useAccessLog, FilterType } from "@/hooks/useAccessLog";
import { LogEntry } from "@/services/api";

const FILTERS: FilterType[] = ["All", "Access", "Denied"];

function LogItem({ item }: { item: LogEntry }) {
  const isAccess = item.status === "Access";
  const isFaceID = item.uid.startsWith("FaceID_");

  return (
    <View style={styles.logItem}>
      <View style={[styles.statusDot, { backgroundColor: isAccess ? "#00E676" : "#FF4444" }]} />
      <View style={styles.logContent}>
        <Text style={styles.logUID} numberOfLines={1}>
          {isFaceID ? `👤 ${item.uid.replace("FaceID_", "")}` : `🔷 ${item.uid}`}
        </Text>
        <Text style={styles.logTime}>{item.time}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: isAccess ? "#0F3D2E" : "#3D0F0F" }]}>
        <Text style={[styles.badgeText, { color: isAccess ? "#00E676" : "#FF4444" }]}>
          {item.status}
        </Text>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const { logs, total, loading, error, filter, setFilter, refresh } = useAccessLog();

  useEffect(() => {
    refresh();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1117" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Access Log</Text>
        <Text style={styles.count}>{total} bản ghi</Text>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={logs}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <LogItem item={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#ffffff" />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Không có dữ liệu</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0D1117" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
  count: { fontSize: 13, color: "#8B9197" },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#161B22",
    borderWidth: 1,
    borderColor: "#30363D",
  },
  filterBtnActive: {
    backgroundColor: "#1565C0",
    borderColor: "#1565C0",
  },
  filterText: { fontSize: 13, color: "#8B9197", fontWeight: "600" },
  filterTextActive: { color: "#FFFFFF" },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  logItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161B22",
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  logContent: { flex: 1 },
  logUID: { fontSize: 14, color: "#C9D1D9", fontWeight: "600", marginBottom: 3 },
  logTime: { fontSize: 12, color: "#8B9197" },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  separator: { height: 8 },
  errorBox: {
    margin: 16,
    backgroundColor: "#3D1A1A",
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: { color: "#FF7070", fontSize: 13 },
  retryText: { color: "#64B5F6", fontSize: 13, fontWeight: "600" },
  empty: { paddingTop: 80, alignItems: "center" },
  emptyText: { color: "#4A5058", fontSize: 15 },
});
