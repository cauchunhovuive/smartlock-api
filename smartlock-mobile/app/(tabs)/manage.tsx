import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useUIDs } from "@/hooks/useUIDs";
import { UIDEntry } from "@/services/api";

function UIDCard({ item, onDelete }: { item: UIDEntry; onDelete: (id: number) => void }) {
  const confirmDelete = () => {
    Alert.alert("Xóa thẻ", `Xóa "${item.label}" (${item.uid})?`, [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa", style: "destructive", onPress: () => onDelete(item.id) },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.cardIcon}>
          <Text style={styles.cardIconText}>🔷</Text>
        </View>
        <View>
          <Text style={styles.cardLabel}>{item.label}</Text>
          <Text style={styles.cardUID}>{item.uid}</Text>
          <Text style={styles.cardDate}>{item.createdAt}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ManageScreen() {
  const { uids, loading, saving, error, refresh, add, remove } = useUIDs();
  const [modalVisible, setModalVisible] = useState(false);
  const [newUID, setNewUID] = useState("");
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    refresh();
  }, []);

  const handleAdd = async () => {
    if (!newUID.trim() || !newLabel.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ UID và tên thẻ");
      return;
    }

    // Validate UID format (hex bytes cách nhau bởi space, VD: "1 2 3 4")
    const cleanUID = newUID.trim().toUpperCase();

    try {
      await add(cleanUID, newLabel.trim());
      setNewUID("");
      setNewLabel("");
      setModalVisible(false);
    } catch {
      Alert.alert("Lỗi", "Không thêm được thẻ. Kiểm tra kết nối.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1117" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Manage UID</Text>
          <Text style={styles.subtitle}>{uids.length} thẻ đã đăng ký</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* List */}
      {loading && uids.length === 0 ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color="#ffffff" />
        </View>
      ) : (
        <FlatList
          data={uids}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <UIDCard item={item} onDelete={remove} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Chưa có thẻ nào</Text>
              <Text style={styles.emptyHint}>Nhấn "+ Thêm" để đăng ký thẻ RFID mới</Text>
            </View>
          }
        />
      )}

      {/* Add Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Thêm thẻ RFID</Text>

            <Text style={styles.inputLabel}>UID (VD: AA BB CC DD)</Text>
            <TextInput
              style={styles.input}
              value={newUID}
              onChangeText={setNewUID}
              placeholder="AA BB CC DD"
              placeholderTextColor="#4A5058"
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <Text style={styles.inputLabel}>Tên thẻ / Người dùng</Text>
            <TextInput
              style={styles.input}
              value={newLabel}
              onChangeText={setNewLabel}
              placeholder="Nguyễn Văn A"
              placeholderTextColor="#4A5058"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleAdd}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Thêm thẻ</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0D1117" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
  subtitle: { fontSize: 13, color: "#8B9197", marginTop: 2 },
  addBtn: {
    backgroundColor: "#1565C0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 4,
  },
  addBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  errorBox: {
    margin: 16,
    backgroundColor: "#3D1A1A",
    borderRadius: 10,
    padding: 12,
  },
  errorText: { color: "#FF7070", fontSize: 13 },
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    backgroundColor: "#161B22",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  cardIcon: {
    width: 44,
    height: 44,
    backgroundColor: "#0D2137",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardIconText: { fontSize: 20 },
  cardLabel: { fontSize: 15, fontWeight: "700", color: "#C9D1D9", marginBottom: 2 },
  cardUID: { fontSize: 12, color: "#64B5F6", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  cardDate: { fontSize: 11, color: "#4A5058", marginTop: 2 },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#3D1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: { color: "#FF4444", fontSize: 13, fontWeight: "700" },
  empty: { paddingTop: 80, alignItems: "center", gap: 8 },
  emptyText: { color: "#4A5058", fontSize: 16, fontWeight: "600" },
  emptyHint: { color: "#30363D", fontSize: 13 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#161B22",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  inputLabel: { fontSize: 12, color: "#8B9197", marginBottom: -4 },
  input: {
    backgroundColor: "#0D1117",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: "#C9D1D9",
    borderWidth: 1,
    borderColor: "#30363D",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#0D1117",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#30363D",
  },
  cancelBtnText: { color: "#8B9197", fontWeight: "600", fontSize: 15 },
  confirmBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#1565C0",
    alignItems: "center",
  },
  confirmBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});
