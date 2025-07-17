import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  SafeAreaView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const CameraScreen = ({ navigation, userInfo }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [facing, setFacing] = useState('back'); // Changed from cameraType to facing
  const [uploading, setUploading] = useState(false);
  const cameraRef = useRef(null);
  const timerRef = useRef(null);

  const MAX_RECORDING_TIME = 10; // 10 seconds
  const API_BASE_URL = 'http://aarya.live:8084';

  // Request camera permissions on mount
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Timer for recording duration
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecordingTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // Convert .mov to .mp4 if needed
  const convertVideoIfNeeded = async (videoUri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      
      if (!fileInfo.exists) {
        throw new Error('Video file does not exist');
      }

      // Check if the file is .mov
      if (videoUri.toLowerCase().endsWith('.mov')) {
        console.log('Converting .mov to .mp4...');
        
        // Create new filename with .mp4 extension
        const newUri = videoUri.replace(/\.mov$/i, '.mp4');
        
        // On iOS, we can try to copy and rename
        if (Platform.OS === 'ios') {
          await FileSystem.copyAsync({
            from: videoUri,
            to: newUri,
          });
          
          // Delete original .mov file
          await FileSystem.deleteAsync(videoUri);
          
          console.log('Video converted to .mp4');
          return newUri;
        }
      }
      
      return videoUri;
    } catch (error) {
      console.error('Error converting video:', error);
      return videoUri;
    }
  };

  // Upload video to S3
  const uploadVideoToS3 = async (uploadUrl, videoUri) => {
    try {
      console.log('Uploading video to S3...');
      
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }
      
      const uploadResponse = await FileSystem.uploadAsync(uploadUrl, fileInfo.uri, {
        httpMethod: 'PUT',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: {
          'Content-Type': 'video/mp4',
        },
      });
      
      if (uploadResponse.status !== 200) {
        throw new Error(`S3 upload failed: ${uploadResponse.status}`);
      }
      
      return true;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw error;
    }
  };

  // Start recording
  const startRecording = async () => {
    if (!cameraRef.current) return;

    try {
      setIsRecording(true);
      
      const video = await cameraRef.current.recordAsync({
        maxDuration: MAX_RECORDING_TIME,
        mute: false,
      });

      console.log('Recording completed:', video);
      
      if (video && video.uri) {
        handleVideoUpload(video.uri);
      }
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Error', 'Failed to record video');
      setIsRecording(false);
    }
  };

  // Stop recording
  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;

    try {
      setIsRecording(false);
      await cameraRef.current.stopRecording();
    } catch (error) {
      console.error('Stop recording error:', error);
      setIsRecording(false);
    }
  };

  // Handle video upload
  const handleVideoUpload = async (videoUri) => {
    try {
      setUploading(true);
      
      // Convert video if needed (.mov to .mp4)
      const convertedUri = await convertVideoIfNeeded(videoUri);
      
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        Alert.alert('Error', 'Please login first');
        navigation.navigate('Home');
        return;
      }

      // Generate filename
      const filename = `recorded_video_${Date.now()}.mp4`;

      // Step 1: Get presigned upload URL
      console.log('Getting presigned upload URL...');
      const uploadResponse = await fetch(`${API_BASE_URL}/generate-upload-url`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: filename,
        }),
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Failed to get upload URL: ${errorText}`);
      }

      const { upload_url, video_id } = await uploadResponse.json();

      // Step 2: Upload video to S3
      await uploadVideoToS3(upload_url, convertedUri);
      
      // Clean up local file
      await FileSystem.deleteAsync(convertedUri);
      
      Alert.alert(
        'Success', 
        'Video recorded and uploaded successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to videos screen or posts screen
              navigation.navigate('Video');
            }
          }
        ]
      );

    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  // Toggle camera facing
  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  // Format time display
  const formatTime = (seconds) => {
    return `${seconds}s`;
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <MaterialIcons name="camera-alt" size={64} color="#ccc" />
        <Text style={styles.errorText}>No access to camera</Text>
        <Text style={styles.errorSubtext}>
          Please enable camera permissions to record videos
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={requestPermission}
        >
          <Text style={styles.retryButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.retryButton, { marginTop: 10, backgroundColor: '#666' }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isRecording}
        >
          <MaterialIcons name="arrow-back" size={24} color={isRecording ? "#666" : "#fff"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Video</Text>
        <TouchableOpacity
          style={styles.flipButton}
          onPress={toggleCameraFacing}
          disabled={isRecording}
        >
          <MaterialIcons name="flip-camera-ios" size={24} color={isRecording ? "#666" : "#fff"} />
        </TouchableOpacity>
      </View>

      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode="video"
      >
        {/* Recording Timer */}
        {isRecording && (
          <View style={styles.timerContainer}>
            <View style={styles.recordingIndicator} />
            <Text style={styles.timerText}>
              {formatTime(recordingTime)} / {formatTime(MAX_RECORDING_TIME)}
            </Text>
          </View>
        )}

        {/* Time Limit Warning */}
        <View style={styles.warningContainer}>
          <MaterialIcons name="info" size={16} color="#fff" />
          <Text style={styles.warningText}>
            Maximum recording time: {MAX_RECORDING_TIME} seconds
          </Text>
        </View>
      </CameraView>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.controlsRow}>
          {/* Recording Button */}
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={uploading}
          >
            <View style={[
              styles.recordButtonInner,
              isRecording && styles.recordButtonInnerActive
            ]}>
              {isRecording ? (
                <MaterialIcons name="stop" size={32} color="#fff" />
              ) : (
                <MaterialIcons name="fiber-manual-record" size={32} color="#ff0000" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Status Text */}
        <Text style={styles.statusText}>
          {isRecording ? 'Recording...' : 'Tap to start recording'}
        </Text>
      </View>

      {/* Upload Overlay */}
      {uploading && (
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadProgress}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.uploadText}>Uploading video...</Text>
            <Text style={styles.uploadSubtext}>Please wait...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  flipButton: {
    padding: 8,
  },
  camera: {
    flex: 1,
    width: width,
    height: height,
  },
  timerContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
    borderRadius: 20,
    marginHorizontal: 20,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    backgroundColor: '#ff0000',
    borderRadius: 6,
    marginRight: 8,
  },
  timerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    borderRadius: 20,
  },
  warningText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
  controls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  recordButtonActive: {
    backgroundColor: 'rgba(255,0,0,0.3)',
    borderColor: '#ff0000',
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonInnerActive: {
    backgroundColor: 'rgba(255,0,0,0.5)',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  loadingText: {
    color: '#007bff',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
  },
  errorSubtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginHorizontal: 40,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadProgress: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  uploadText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default CameraScreen;