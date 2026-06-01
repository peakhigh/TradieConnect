import { useState } from 'react';
import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytesResumable, getDownloadURL, storage } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { featureFlags } from '../utils/featureFlags';

interface UploadResult {
  downloadURL: string;
  name: string;
  type: string;
  size: number;
}

export default function useFileUpload(uploadPath?: string) {
  const [progress, setProgress] = useState(-1);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const uploadFile = async (uri: string, fileName: string, mimeType?: string): Promise<UploadResult> => {
    if (featureFlags.useMocks) {
      return {
        downloadURL: 'https://via.placeholder.com/300',
        name: fileName,
        type: mimeType || 'application/octet-stream',
        size: 100,
      };
    }

    setUploading(true);
    setProgress(0);

    try {
      const path = uploadPath
        ? `${uploadPath}/${user?.id}/${Date.now()}_${fileName}`
        : `uploads/${user?.id}/${Date.now()}_${fileName}`;

      const storageRef = ref(storage, path);
      const response = await fetch(uri);
      const blob = await response.blob();

      const uploadTask = uploadBytesResumable(storageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setProgress(pct);
          },
          (error) => {
            setUploading(false);
            setProgress(-1);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setUploading(false);
            setProgress(-1);
            resolve({
              downloadURL,
              name: fileName,
              type: mimeType || 'application/octet-stream',
              size: blob.size,
            });
          }
        );
      });
    } catch (error) {
      setUploading(false);
      setProgress(-1);
      throw error;
    }
  };

  const pickAndUploadImage = async (): Promise<UploadResult | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return null;

    const asset = result.assets[0];
    return uploadFile(asset.uri, asset.fileName || `image_${Date.now()}.jpg`, 'image/jpeg');
  };

  const pickAndUploadDocument = async (): Promise<UploadResult | null> => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });

    if (result.canceled || !result.assets[0]) return null;

    const asset = result.assets[0];
    return uploadFile(asset.uri, asset.name, asset.mimeType || 'application/octet-stream');
  };

  return { uploadFile, pickAndUploadImage, pickAndUploadDocument, progress, uploading };
}
