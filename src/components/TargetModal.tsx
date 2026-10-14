import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

type Props = {
  visible: boolean;
  initialValue: number;
  onClose: () => void;
  onSave: (value: number) => void;
};

export function TargetModal({ visible, initialValue, onClose, onSave }: Props) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [initialValue, visible]);

  function changeValue(amount: number) {
    setValue((current) => Math.min(300, Math.max(20, current + amount)));
  }

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.eyebrow}>每日目标</Text>
          <Text style={styles.title}>设定蛋白质目标</Text>
          <Text style={styles.note}>这是一个记录目标，不构成个人营养或医疗建议。</Text>

          <View style={styles.stepper}>
            <Pressable accessibilityLabel="减少五克" style={styles.stepButton} onPress={() => changeValue(-5)}>
              <Text style={styles.stepGlyph}>−</Text>
            </Pressable>
            <View style={styles.valueWrap}>
              <Text style={styles.value}>{value}</Text>
              <Text style={styles.unit}>克 / 天</Text>
            </View>
            <Pressable accessibilityLabel="增加五克" style={styles.stepButton} onPress={() => changeValue(5)}>
              <Text style={styles.stepGlyph}>＋</Text>
            </Pressable>
          </View>

          <Pressable style={styles.saveButton} onPress={() => onSave(value)}>
            <Text style={styles.saveText}>保存目标</Text>
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={onClose}>
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
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    padding: 24,
    borderRadius: 26,
    backgroundColor: colors.surface,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    marginTop: 7,
    color: colors.ink,
    fontSize: 23,
    fontWeight: '800',
  },
  note: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  stepper: {
    marginVertical: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.primaryPale,
  },
  stepGlyph: {
    color: colors.primary,
    fontSize: 26,
    lineHeight: 29,
  },
  valueWrap: {
    minWidth: 112,
    alignItems: 'center',
  },
  value: {
    color: colors.ink,
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  unit: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  saveButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: colors.primary,
  },
  saveText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  cancelText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
});
