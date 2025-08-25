import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Camera, Image as ImageIcon, FileText, Upload } from 'lucide-react-native';

interface FileUploadProps {
  onTakePhoto: () => void;
  onPickImage: () => void;
  onPickDocument: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onTakePhoto,
  onPickImage,
  onPickDocument,
}) => {
  if (Platform.OS === 'web') {
    return (
      <TouchableOpacity style={styles.webUploadButton} onPress={onPickImage}>
        <Upload size={20} color="#3b82f6" />
        <Text style={styles.webUploadText}>Upload Photos/Files</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.mobileButtons}>
      <TouchableOpacity style={styles.fileButton} onPress={onTakePhoto}>
        <Camera size={20} color="#3b82f6" />
        <Text style={styles.fileButtonText}>Camera</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.fileButton} onPress={onPickImage}>
        <ImageIcon size={20} color="#3b82f6" />
        <Text style={styles.fileButtonText}>Gallery</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.fileButton} onPress={onPickDocument}>
        <FileText size={20} color="#3b82f6" />
        <Text style={styles.fileButtonText}>Files</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  webUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    backgroundColor: '#ffffff',
  },
  webUploadText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  mobileButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    backgroundColor: '#ffffff',
  },
  fileButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
});