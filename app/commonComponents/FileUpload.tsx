/**
 * FileUpload — Cross-platform file upload component.
 *
 * Supports two modes:
 * 1. Immediate upload (default): Files upload to Firebase Storage on pick.
 * 2. Deferred upload (deferUpload=true): Files are staged locally, uploaded
 *    later via the returned `uploadStagedFiles()` function.
 *
 * Features:
 * - Camera capture (mobile only)
 * - Gallery picker (mobile) / file input (web)
 * - Document picker (all platforms)
 * - Configurable file type restrictions
 * - File size validation (default 10MB)
 * - Max file count enforcement
 * - Upload progress feedback
 * - Multiple file support
 * - Render-prop pattern for custom UI
 * - Mock mode support via featureFlags
 *
 * Works on iOS, Android, and Web.
 */
import React, { useState, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, FileText, Upload, X } from 'lucide-react-native';
import { ref, uploadBytesResumable, getDownloadURL, storage } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { featureFlags } from '../utils/featureFlags';
import { theme } from '../theme/theme';

// --- Types ---

export interface UploadedFile {
  downloadURL: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
}

/** A file that has been picked but not yet uploaded */
export interface StagedFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

export interface FileUploadHandle {
  /** Upload all staged files to Firebase Storage. Returns uploaded file metadata. */
  uploadStagedFiles: (progressCallback?: (pct: number) => void) => Promise<UploadedFile[]>;
}

export interface FileUploadProps {
  /** Called after each file is successfully uploaded (immediate mode only) */
  onUpload?: (file: UploadedFile) => void;
  /** Called when a file is staged locally (deferred mode) or uploaded (immediate mode) */
  onFilesChange?: (files: StagedFile[]) => void;
  /** Called when upload or pick fails */
  onError?: (error: Error) => void;
  /** Defer uploads until parent calls uploadStagedFiles(). Default: false */
  deferUpload?: boolean;
  /** Allowed MIME types for document picker. Default: images + common docs */
  type?: string[];
  /** Max file size in bytes. Default: 10MB */
  maxFileSize?: number;
  /** Max number of files allowed. Default: 5 */
  maxFiles?: number;
  /** Current number of files already added (for enforcing maxFiles externally) */
  currentFileCount?: number;
  /** Firebase Storage path prefix. Default: 'uploads' */
  uploadPath?: string;
  /** Allow multiple file selection. Default: true */
  multiple?: boolean;
  /** Show camera button on mobile. Default: true */
  showCamera?: boolean;
  /** Show gallery button. Default: true */
  showGallery?: boolean;
  /** Show document picker button. Default: true */
  showDocuments?: boolean;
  /** Disable all interactions */
  isDisabled?: boolean;
  /** External uploading state setter (parent can track) */
  setIsUploading?: (uploading: boolean) => void;
  /** Custom button text. Default: 'Upload' */
  text?: string;
  /** Custom style for the container */
  style?: object;
  /** Test ID for testing */
  testID?: string;
  /** Render-prop pattern: children({ pickFile, pickImage, takePhoto, loading, progress }) */
  children?: (props: RenderProps) => React.ReactNode;
}

interface RenderProps {
  pickFile: () => Promise<void>;
  pickImage: () => Promise<void>;
  takePhoto: () => Promise<void>;
  loading: boolean;
  progress: number;
}

// --- Constants ---

const DEFAULT_TYPES = ['application/pdf', 'image/*', '.docx', '.doc', '.xls', '.xlsx'];
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_MAX_FILES = 5;

// --- Component ---

export const FileUpload = forwardRef<FileUploadHandle, FileUploadProps>(({
  onUpload,
  onFilesChange,
  onError,
  deferUpload = false,
  type = DEFAULT_TYPES,
  maxFileSize = DEFAULT_MAX_SIZE,
  maxFiles = DEFAULT_MAX_FILES,
  currentFileCount = 0,
  uploadPath = 'uploads',
  multiple = true,
  showCamera = true,
  showGallery = true,
  showDocuments = true,
  isDisabled = false,
  setIsUploading,
  text = 'Upload',
  style,
  testID,
  children,
}, forwardedRef) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(-1);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const { user } = useAuth();

  const remainingSlots = maxFiles - currentFileCount;
  const isAtLimit = remainingSlots <= 0;

  // --- Upload Logic (for immediate mode and deferred batch upload) ---

  const uploadSingleFile = async (
    uri: string,
    fileName: string,
    mimeType: string,
    fileSize: number,
    progressCb?: (pct: number) => void
  ): Promise<UploadedFile> => {
    // Auth check
    if (!user?.id) {
      throw new Error('You must be logged in to upload files');
    }

    // Mock mode
    if (featureFlags.useMocks) {
      const isImage = mimeType.startsWith('image/');
      return {
        downloadURL: isImage
          ? 'https://via.placeholder.com/400x300?text=Mock+Photo'
          : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        name: fileName,
        type: mimeType,
        size: fileSize || 100,
        uploadedAt: new Date().toISOString(),
      };
    }

    // Real upload
    const path = `${uploadPath}/${user.id}/${Date.now()}_${fileName}`;
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
          progressCb?.(pct);
        },
        (error) => reject(error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            downloadURL,
            name: fileName,
            type: mimeType,
            size: blob.size,
            uploadedAt: new Date().toISOString(),
          });
        }
      );
    });
  };

  // Exposed via ref for deferred mode — parent calls this on submit
  const uploadStagedFiles = async (progressCallback?: (pct: number) => void): Promise<UploadedFile[]> => {
    const results: UploadedFile[] = [];
    const totalFiles = stagedFiles.length;

    for (let i = 0; i < stagedFiles.length; i++) {
      const file = stagedFiles[i];
      const fileProgress = (pct: number) => {
        // Overall progress: (files completed + current file progress) / total
        const overallPct = Math.round(((i + pct / 100) / totalFiles) * 100);
        progressCallback?.(overallPct);
      };

      try {
        const result = await uploadSingleFile(file.uri, file.name, file.type, file.size, fileProgress);
        results.push(result);
      } catch (error: any) {
        console.error(`Failed to upload ${file.name}:`, error);
        onError?.(error instanceof Error ? error : new Error(`Failed to upload ${file.name}`));
      }
    }

    return results;
  };

  useImperativeHandle(forwardedRef, () => ({
    uploadStagedFiles,
  }));

  // --- Validation ---

  const validateFile = (fileName: string, mimeType: string, fileSize?: number): string | null => {
    if (fileSize && fileSize > maxFileSize) {
      const maxMB = Math.round(maxFileSize / (1024 * 1024));
      return `"${fileName}" exceeds the ${maxMB}MB size limit`;
    }
    return null;
  };

  // --- Stage or Upload a file ---

  const processFile = async (uri: string, fileName: string, mimeType: string, fileSize?: number) => {
    // Validate size
    const validationError = validateFile(fileName, mimeType, fileSize);
    if (validationError) {
      onError?.(new Error(validationError));
      return;
    }

    if (deferUpload) {
      // Deferred mode: just stage the file locally
      const staged: StagedFile = { uri, name: fileName, type: mimeType, size: fileSize || 0 };
      setStagedFiles(prev => {
        const updated = [...prev, staged];
        onFilesChange?.(updated);
        return updated;
      });
    } else {
      // Immediate mode: upload now
      setLoading(true);
      setIsUploading?.(true);
      setProgress(0);
      try {
        const result = await uploadSingleFile(uri, fileName, mimeType, fileSize || 0);
        onUpload?.(result);
      } catch (error: any) {
        console.error('FileUpload error:', error);
        onError?.(error instanceof Error ? error : new Error(error?.message || 'Upload failed'));
      } finally {
        setLoading(false);
        setProgress(-1);
        setIsUploading?.(false);
      }
    }
  };

  // --- Picker Actions ---

  const takePhoto = async () => {
    if (Platform.OS === 'web') return;
    if (isAtLimit) {
      onError?.(new Error(`Maximum ${maxFiles} files allowed`));
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      onError?.(new Error('Camera permission is required to take photos'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const fileName = asset.fileName || `photo_${Date.now()}.jpg`;
    await processFile(asset.uri, fileName, 'image/jpeg', asset.fileSize);
  };

  const pickImage = async () => {
    if (isAtLimit) {
      onError?.(new Error(`Maximum ${maxFiles} files allowed`));
      return;
    }

    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = type.join(',');
      input.multiple = multiple && remainingSlots > 1;
      input.style.display = 'none';

      input.onchange = async (e: any) => {
        let files = Array.from(e.target.files || []) as File[];
        // Enforce max files
        if (files.length > remainingSlots) {
          files = files.slice(0, remainingSlots);
          onError?.(new Error(`Only ${remainingSlots} more file${remainingSlots === 1 ? '' : 's'} allowed. Extra files were ignored.`));
        }

        if (!deferUpload) {
          setLoading(true);
          setIsUploading?.(true);
        }
        for (const file of files) {
          const uri = URL.createObjectURL(file);
          try {
            await processFile(uri, file.name, file.type || 'application/octet-stream', file.size);
          } finally {
            if (!deferUpload) URL.revokeObjectURL(uri);
          }
        }
        if (!deferUpload) {
          setLoading(false);
          setProgress(-1);
          setIsUploading?.(false);
        }
        document.body.removeChild(input);
      };

      input.addEventListener('cancel', () => {
        document.body.removeChild(input);
      });

      document.body.appendChild(input);
      input.click();
      return;
    }

    // Mobile: gallery picker
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      onError?.(new Error('Media library permission is required'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: multiple && remainingSlots > 1,
      quality: 0.8,
    });

    if (result.canceled || !result.assets.length) return;

    let assets = result.assets;
    if (assets.length > remainingSlots) {
      assets = assets.slice(0, remainingSlots);
      onError?.(new Error(`Only ${remainingSlots} more file${remainingSlots === 1 ? '' : 's'} allowed. Extra files were ignored.`));
    }

    if (!deferUpload) {
      setLoading(true);
      setIsUploading?.(true);
    }
    for (const asset of assets) {
      const fileName = asset.fileName || `image_${Date.now()}.jpg`;
      await processFile(asset.uri, fileName, 'image/jpeg', asset.fileSize);
    }
    if (!deferUpload) {
      setLoading(false);
      setProgress(-1);
      setIsUploading?.(false);
    }
  };

  const pickFile = async () => {
    if (isAtLimit) {
      onError?.(new Error(`Maximum ${maxFiles} files allowed`));
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type,
        multiple: multiple && remainingSlots > 1,
      });

      if (result.canceled || !result.assets?.length) return;

      let assets = result.assets;
      if (assets.length > remainingSlots) {
        assets = assets.slice(0, remainingSlots);
        onError?.(new Error(`Only ${remainingSlots} more file${remainingSlots === 1 ? '' : 's'} allowed. Extra files were ignored.`));
      }

      if (!deferUpload) {
        setLoading(true);
        setIsUploading?.(true);
      }
      for (const asset of assets) {
        await processFile(
          asset.uri,
          asset.name,
          asset.mimeType || 'application/octet-stream',
          asset.size
        );
      }
      if (!deferUpload) {
        setLoading(false);
        setProgress(-1);
        setIsUploading?.(false);
      }
    } catch (error: any) {
      console.error('Document picker error:', error);
      onError?.(error instanceof Error ? error : new Error('Failed to pick document'));
    }
  };

  /** Remove a staged file (deferred mode) */
  const removeStagedFile = (index: number) => {
    setStagedFiles(prev => {
      const updated = prev.filter((_, i) => i !== index);
      onFilesChange?.(updated);
      return updated;
    });
  };

  // --- Render Prop Pattern ---

  if (typeof children === 'function') {
    return (
      <View testID={testID} style={style}>
        {children({ pickFile, pickImage, takePhoto, loading, progress })}
      </View>
    );
  }

  // --- Default UI ---

  if (Platform.OS === 'web') {
    return (
      <View testID={testID} style={[styles.container, style]}>
        <TouchableOpacity
          style={[styles.webUploadButton, (isDisabled || isAtLimit) && styles.disabledButton]}
          onPress={pickImage}
          disabled={isDisabled || loading || isAtLimit}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={text}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.webUploadText}>
                {progress >= 0 ? `${progress}%` : 'Uploading...'}
              </Text>
            </>
          ) : (
            <>
              <Upload size={20} color={isAtLimit ? theme.colors.text.tertiary : theme.colors.primary} />
              <Text style={[styles.webUploadText, isAtLimit && styles.disabledText]}>
                {isAtLimit ? `Limit reached (${maxFiles})` : text}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Staged file list (deferred mode) */}
        {deferUpload && stagedFiles.length > 0 && (
          <StagedFileList files={stagedFiles} onRemove={removeStagedFile} />
        )}
      </View>
    );
  }

  // Mobile UI: Camera + Gallery + Files buttons
  return (
    <View testID={testID} style={[styles.container, style]}>
      {loading && (
        <View style={styles.progressRow}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.progressText}>
            {progress >= 0 ? `Uploading... ${progress}%` : 'Uploading...'}
          </Text>
        </View>
      )}

      <View style={styles.mobileButtons}>
        {showCamera && (
          <TouchableOpacity
            style={[styles.fileButton, (isDisabled || isAtLimit) && styles.disabledButton]}
            onPress={takePhoto}
            disabled={isDisabled || loading || isAtLimit}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Take photo"
          >
            <Camera size={18} color={isAtLimit ? theme.colors.text.tertiary : theme.colors.primary} />
            <Text style={[styles.fileButtonText, isAtLimit && styles.disabledText]}>Camera</Text>
          </TouchableOpacity>
        )}

        {showGallery && (
          <TouchableOpacity
            style={[styles.fileButton, (isDisabled || isAtLimit) && styles.disabledButton]}
            onPress={pickImage}
            disabled={isDisabled || loading || isAtLimit}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Pick from gallery"
          >
            <ImageIcon size={18} color={isAtLimit ? theme.colors.text.tertiary : theme.colors.primary} />
            <Text style={[styles.fileButtonText, isAtLimit && styles.disabledText]}>Gallery</Text>
          </TouchableOpacity>
        )}

        {showDocuments && (
          <TouchableOpacity
            style={[styles.fileButton, (isDisabled || isAtLimit) && styles.disabledButton]}
            onPress={pickFile}
            disabled={isDisabled || loading || isAtLimit}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Pick document"
          >
            <FileText size={18} color={isAtLimit ? theme.colors.text.tertiary : theme.colors.primary} />
            <Text style={[styles.fileButtonText, isAtLimit && styles.disabledText]}>Files</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Staged file list (deferred mode) */}
      {deferUpload && stagedFiles.length > 0 && (
        <StagedFileList files={stagedFiles} onRemove={removeStagedFile} />
      )}
    </View>
  );
});

FileUpload.displayName = 'FileUpload';

// --- Companion: StagedFileList (for deferred mode — local files not yet uploaded) ---

const StagedFileList: React.FC<{ files: StagedFile[]; onRemove: (index: number) => void }> = ({ files, onRemove }) => (
  <View style={styles.fileList}>
    {files.map((file, index) => (
      <View key={`${file.name}-${index}`} style={styles.fileItem}>
        <View style={styles.fileInfo}>
          {file.type.startsWith('image/') ? (
            <ImageIcon size={14} color={theme.colors.text.secondary} />
          ) : (
            <FileText size={14} color={theme.colors.text.secondary} />
          )}
          <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
          {file.size > 0 && (
            <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => onRemove(index)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${file.name}`}
        >
          <X size={16} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    ))}
  </View>
);

// --- Companion: FileList (renders already-uploaded files with remove) ---

export interface FileListProps {
  files: UploadedFile[];
  onRemove?: (index: number) => void;
  showRemove?: boolean;
}

export const FileList: React.FC<FileListProps> = ({ files, onRemove, showRemove = true }) => {
  if (files.length === 0) return null;

  return (
    <View style={styles.fileList}>
      {files.map((file, index) => (
        <View key={`${file.name}-${index}`} style={styles.fileItem}>
          <View style={styles.fileInfo}>
            {file.type.startsWith('image/') ? (
              <ImageIcon size={14} color={theme.colors.text.secondary} />
            ) : (
              <FileText size={14} color={theme.colors.text.secondary} />
            )}
            <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
            {file.size > 0 && (
              <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
            )}
          </View>
          {showRemove && onRemove && (
            <TouchableOpacity
              onPress={() => onRemove(index)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${file.name}`}
            >
              <X size={16} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
};

// --- Helpers ---

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {},
  webUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: '#ffffff',
  },
  webUploadText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  mobileButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: '#ffffff',
  },
  fileButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: theme.colors.text.tertiary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  fileList: {
    marginTop: 8,
    gap: 6,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  fileName: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text.primary,
  },
  fileSize: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },
});

export default FileUpload;
