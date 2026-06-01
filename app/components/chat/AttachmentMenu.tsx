import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { Camera, Image as ImageIcon, FileText, X } from 'lucide-react-native';
import { theme } from '../../theme/theme';

interface AttachmentMenuProps {
  visible: boolean;
  onClose: () => void;
  onPickImage: () => void;
  onTakePhoto: () => void;
  onPickDocument: () => void;
}

export default function AttachmentMenu({
  visible,
  onClose,
  onPickImage,
  onTakePhoto,
  onPickDocument,
}: AttachmentMenuProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.menu} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Attach</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.options}>
            <TouchableOpacity style={styles.option} onPress={() => { onTakePhoto(); onClose(); }}>
              <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
                <Camera size={22} color="#2563EB" />
              </View>
              <Text style={styles.optionText}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={() => { onPickImage(); onClose(); }}>
              <View style={[styles.iconCircle, { backgroundColor: '#D1FAE5' }]}>
                <ImageIcon size={22} color="#059669" />
              </View>
              <Text style={styles.optionText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={() => { onPickDocument(); onClose(); }}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                <FileText size={22} color="#D97706" />
              </View>
              <Text style={styles.optionText}>Document</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  menu: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  option: {
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
});
