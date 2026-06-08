# Cross-Platform Modal Pattern

## Rule: Always Use React Native `Modal` — Never `Alert.alert()` or `window.confirm()`

`Alert.alert()` does not work reliably on web. `window.confirm()` does not work on native. For all confirmation dialogs, destructive actions, and informational popups, use React Native's built-in `Modal` component with a custom card layout.

This pattern works identically on **iOS, Android, and Web**.

## Required Pattern

```tsx
import { Modal, Pressable, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { AlertTriangle } from "lucide-react-native"; // or appropriate icon

const [showModal, setShowModal] = useState(false);

<Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
  <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
    <Pressable style={styles.modalCard} onPress={() => {}}>
      {/* Icon */}
      <View style={styles.modalIconRow}>
        <View style={styles.modalIconCircle}>
          <AlertTriangle size={24} color="#DC2626" />
        </View>
      </View>
      {/* Title */}
      <Text style={styles.modalTitle}>Confirm Action</Text>
      {/* Message */}
      <Text style={styles.modalSubtitle}>
        Explain what will happen clearly.
      </Text>
      {/* Buttons */}
      <View style={styles.modalButtonRow}>
        <TouchableOpacity style={styles.modalGoBackBtn} onPress={() => setShowModal(false)}>
          <Text style={styles.modalGoBackBtnText}>Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleConfirm}>
          <Text style={styles.modalConfirmBtnText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  </Pressable>
</Modal>
```

## Required Styles

```tsx
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 380,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconRow: { alignItems: "center", marginBottom: 12 },
  modalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  modalButtonRow: { flexDirection: "row", gap: 12 },
  modalGoBackBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  modalGoBackBtnText: { fontSize: 15, fontWeight: "600", color: "#6B7280" },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#DC2626",
  },
  modalConfirmBtnText: { fontSize: 15, fontWeight: "600", color: "#FFF" },
});
```

## Icon Circle Colors by Action Type

| Action Type | Icon | Circle Background | Icon Color |
|-------------|------|-------------------|------------|
| Destructive / Cancel | `AlertTriangle` | `#FEE2E2` | `#DC2626` |
| Success / Complete | `CheckCircle2` | `#D1FAE5` | `#059669` |
| Info / Reopen | `RotateCcw` or `Info` | `#EFF6FF` | `#2563EB` |
| Warning | `AlertTriangle` | `#FEF3C7` | `#D97706` |

## Confirm Button Colors by Action Type

| Action Type | Background |
|-------------|-----------|
| Destructive | `#DC2626` (red) |
| Positive / Complete | `#059669` (green) |
| Neutral / Info | `#2563EB` (blue) |
| Warning | `#D97706` (amber) |

## Rules

1. **NEVER** use `Alert.alert()` — it doesn't work properly on web.
2. **NEVER** use `window.confirm()` or `window.alert()` — they don't work on native.
3. Always use `transparent` + `animationType="fade"` on the Modal.
4. Always allow backdrop dismiss (outer `Pressable` with `onPress` to close).
5. Inner `Pressable` must have `onPress={() => {}}` to prevent event bubbling.
6. Use `onRequestClose` for Android back button support.
7. Keep modal card `maxWidth: 380` for consistency across screen sizes.
8. Bold the entity name in the subtitle when referencing a specific item.
9. "Go Back" is always the secondary/cancel action (left button).
10. The confirm action is always the primary button (right button, colored).

## Reference Implementation

See `_buildon/frontend/components/tradeView/trades/TradeCard.js` for the production "Cancel Trade" modal used across the BuildOn project.
