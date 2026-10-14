import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, shadows } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCamera: () => void;
  onLibrary: () => void;
  onManual: () => void;
};

export function CaptureModal({ visible, onClose, onCamera, onLibrary, onManual }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>添加一餐</Text>
          <Text style={styles.subtitle}>可以拍照、选择已有照片，也可以直接手动记录。</Text>

          <View style={styles.actions}>
            <Pressable style={({ pressed }) => [styles.action, pressed && styles.pressed]} onPress={onCamera}>
              <View style={[styles.actionIcon, styles.cameraIcon]}>
                <Text style={styles.actionGlyph}>◎</Text>
              </View>
              <Text style={styles.actionTitle}>拍照</Text>
              <Text style={styles.actionCaption}>使用手机相机</Text>
            </Pressable>

            <Pressable style={({ pressed }) => [styles.action, pressed && styles.pressed]} onPress={onLibrary}>
              <View style={[styles.actionIcon, styles.libraryIcon]}>
                <Text style={styles.actionGlyph}>▧</Text>
              </View>
              <Text style={styles.actionTitle}>从相册选择</Text>
              <Text style={styles.actionCaption}>使用已有照片</Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [styles.manualAction, pressed && styles.pressed]}
            onPress={onManual}
          >
            <View style={styles.manualIcon}>
              <Text style={styles.manualIconText}>＋</Text>
            </View>
            <View style={styles.manualCopy}>
              <Text style={styles.actionTitle}>无照片记录</Text>
              <Text style={styles.actionCaption}>忘记拍照时，直接添加食物和份量</Text>
            </View>
            <Text style={styles.manualArrow}>›</Text>
          </Pressable>

          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>取消</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    paddingTop: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handle: {
    width: 38,
    height: 4,
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 2,
    backgroundColor: '#C7CEC6',
  },
  title: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 7,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  action: {
    flex: 1,
    minHeight: 148,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  actionIcon: {
    width: 46,
    height: 46,
    marginBottom: 16,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    backgroundColor: colors.primarySoft,
  },
  libraryIcon: {
    backgroundColor: '#F7E9CB',
  },
  actionGlyph: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: '600',
  },
  actionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  actionCaption: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 12,
  },
  manualAction: {
    minHeight: 70,
    marginTop: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  manualIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
  },
  manualIconText: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '300',
  },
  manualCopy: {
    flex: 1,
    marginLeft: 12,
  },
  manualArrow: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '300',
  },
  cancel: {
    height: 50,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
  },
});
