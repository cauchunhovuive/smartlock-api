import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { useLockStatus } from "@/hooks/useLockStatus";

export default function HomeScreen() {
  const { status, loading, opening, error, triggerOpen } = useLockStatus();

  // Pulse animation khi cửa mở
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status.open) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
      Animated.timing(glowAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      Animated.timing(glowAnim, { toValue: 0, duration: 400, useNativeDriver: false }).start();
    }
  }, [status.open]);

  const bgColor = status.open ? "#0F3D2E" : "#0D1117";
  const accentColor = status.open ? "#00E676" : "#FF4444";
  const accentDim = status.open ? "#00E67622" : "#FF444422";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <StatusBar barStyle="light-content" backgroundColor={bgColor} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Lock</Text>
        <View style={[styles.onlineIndicator, { backgroundColor: error ? "#FF9800" : "#00E676" }]} />
      </View>

      {/* Main status area */}
      <View style={styles.center}>
        {loading ? (
          <ActivityIndicator size="large" color="#ffffff" />
        ) : (
          <>
            {/* Animated lock ring */}
            <Animated.View style={[styles.ringOuter, { transform: [{ scale: pulseAnim }], borderColor: accentColor, backgroundColor: accentDim }]}>
              <View style={[styles.ringInner, { borderColor: accentColor }]}>
                <Text style={styles.lockIcon}>{status.open ? "🔓" : "🔒"}</Text>
              </View>
            </Animated.View>

            {/* Status text */}
            <Text style={[styles.statusText, { color: accentColor }]}>
              {status.open ? "CỬA ĐANG MỞ" : "CỬA ĐÓNG"}
            </Text>

            {status.open && status.triggeredBy && (
              <Text style={styles.triggeredBy}>Mở bởi: {status.triggeredBy}</Text>
            )}

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {/* Open button */}
            <TouchableOpacity
              style={[styles.openButton, status.open && styles.openButtonDisabled]}
              onPress={triggerOpen}
              disabled={opening || status.open}
              activeOpacity={0.8}
            >
              {opening ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.openButtonText}>
                  {status.open ? "Cửa đang mở..." : "Mở Cửa Từ Xa"}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.hint}>
              {status.open ? "Cửa tự đóng sau 5 giây" : "Polling realtime mỗi 2 giây"}
            </Text>
          </>
        )}
      </View>

      {/* Bottom info */}
      <View style={styles.bottomCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Trạng thái kết nối</Text>
          <Text style={[styles.infoValue, { color: error ? "#FF9800" : "#00E676" }]}>
            {error ? "Mất kết nối" : "Online"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Cập nhật</Text>
          <Text style={styles.infoValue}>Mỗi 2 giây</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Backend</Text>
          <Text style={styles.infoValue}>Railway</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  ringOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  ringInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  lockIcon: { fontSize: 56 },
  statusText: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 8,
  },
  triggeredBy: {
    fontSize: 14,
    color: "#8B9197",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: "#FF9800",
    marginBottom: 12,
  },
  openButton: {
    marginTop: 40,
    backgroundColor: "#1565C0",
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 16,
    minWidth: 220,
    alignItems: "center",
  },
  openButtonDisabled: {
    backgroundColor: "#1E2D2A",
  },
  openButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  hint: {
    marginTop: 16,
    fontSize: 12,
    color: "#4A5058",
  },
  bottomCard: {
    margin: 16,
    backgroundColor: "#161B22",
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: { fontSize: 13, color: "#8B9197" },
  infoValue: { fontSize: 13, color: "#C9D1D9", fontWeight: "600" },
});
