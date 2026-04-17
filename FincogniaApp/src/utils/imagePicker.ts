/**
 * Image Picker Utility
 * Handles image selection from camera or gallery
 */

import { Platform, Alert, Linking, PermissionsAndroid } from 'react-native';
import { launchCamera, launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';

export interface ImagePickerResult {
  uri: string;
  base64?: string;
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
}

/**
 * Request camera permissions on Android
 */
async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission',
        message: 'PaisaBuddy needs access to your camera to take photos of documents',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('Error requesting camera permission:', err);
    return false;
  }
}

/**
 * Pick an image from camera or gallery
 * @param options - Options for image picker (source: 'camera' | 'gallery' | 'both')
 */
export async function pickImage(options: {
  source?: 'camera' | 'gallery' | 'both';
  includeBase64?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
} = {}): Promise<ImagePickerResult | null> {
  const {
    source = 'both',
    includeBase64 = true,
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 0.8,
  } = options;

  return new Promise((resolve) => {
    const pickerOptions = {
      mediaType: 'photo' as MediaType,
      includeBase64,
      maxWidth,
      maxHeight,
      quality,
      saveToPhotos: false,
    };

    const showOptions = () => {
      if (source === 'camera') {
        handleCameraLaunch();
      } else if (source === 'gallery') {
        handleGalleryLaunch();
      } else {
        // Show action sheet to choose
        Alert.alert(
          'Select Image',
          'Choose an option',
          [
            {
              text: 'Camera',
              onPress: handleCameraLaunch,
            },
            {
              text: 'Gallery',
              onPress: handleGalleryLaunch,
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(null),
            },
          ],
          { cancelable: true, onDismiss: () => resolve(null) }
        );
      }
    };

    const handleCameraLaunch = async () => {
      // Request camera permission first
      if (Platform.OS === 'android') {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
          Alert.alert(
            'Permission Required',
            'Camera permission is required to take photos. Please enable it in app settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => Linking.openSettings(),
              },
            ]
          );
          resolve(null);
          return;
        }
      }

      launchCamera(pickerOptions, handlePickerResponse);
    };

    const handleGalleryLaunch = () => {
      launchImageLibrary(pickerOptions, handlePickerResponse);
    };

    const handlePickerResponse = (response: ImagePickerResponse) => {
      if (response.didCancel) {
        resolve(null);
        return;
      }

      if (response.errorCode) {
        console.error('ImagePicker Error:', response.errorMessage);
        Alert.alert('Error', response.errorMessage || 'Failed to pick image');
        resolve(null);
        return;
      }

      const asset = response.assets?.[0];
      if (!asset || !asset.uri) {
        resolve(null);
        return;
      }

      resolve({
        uri: asset.uri,
        base64: asset.base64 || undefined,
        mimeType: asset.type || 'image/jpeg',
        fileName: asset.fileName || undefined,
        fileSize: asset.fileSize || undefined,
      });
    };

    showOptions();
  });
}


