// // screens/PostScreen.js
// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Alert,
//   ActivityIndicator,
//   TextInput,
//   Modal,
//   FlatList,
//   Dimensions,
// } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import * as FileSystem from 'expo-file-system';
// import { Video } from 'expo-av';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { MaterialIcons } from '@expo/vector-icons';

// const { width, height } = Dimensions.get('window');

// const PostScreen = ({ navigation, userInfo }) => {
//   const [selectedVideo, setSelectedVideo] = useState(null);
//   const [caption, setCaption] = useState('');
//   const [category, setCategory] = useState('');
//   const [selectedThread, setSelectedThread] = useState(null);
//   const [userVideos, setUserVideos] = useState([]);
//   const [threadHeads, setThreadHeads] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [uploading, setUploading] = useState(false);
//   const [posting, setPosting] = useState(false);
//   const [showVideoModal, setShowVideoModal] = useState(false);
//   const [showThreadModal, setShowThreadModal] = useState(false);
//   const [showCategoryModal, setShowCategoryModal] = useState(false);
//   const [playingVideo, setPlayingVideo] = useState(null);

//   const POST_API_BASE_URL = 'http://aarya.live:8082';
//   const VIDEO_API_BASE_URL = 'http://aarya.live:8084'

//   // Categories list
//   const categories = [
//     'Fitness', 'Nutrition', 'Lifestyle', 'Motivation', 
//     'Training', 'Recovery', 'Mental Health', 'Other'
//   ];

//   // Request permissions
//   const requestPermissions = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== 'granted') {
//       Alert.alert('Permission needed', 'Please grant media library permissions to upload videos');
//       return false;
//     }
//     return true;
//   };

//   // Fetch user's videos
//   const fetchUserVideos = async () => {
//     try {
//       setLoading(true);
//       const token = await AsyncStorage.getItem('token');
      
//       if (!token) {
//         Alert.alert('Error', 'Please login first');
//         navigation.navigate('Login');
//         return;
//       }

//       const response = await fetch(`${VIDEO_API_BASE_URL}/videos`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setUserVideos(data || []);
//       } else if (response.status === 401) {
//         Alert.alert('Session Expired', 'Please login again');
//         navigation.navigate('Home');
//       } else {
//         throw new Error('Failed to fetch videos');
//       }
//     } catch (error) {
//       console.error('Error fetching videos:', error);
//       Alert.alert('Error', 'Failed to load videos');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch thread heads (posts with thread_id = null)
//   const fetchThreadHeads = async () => {
//     try {
//       const token = await AsyncStorage.getItem('token');
      
//       if (!token) {
//         Alert.alert('Error', 'Please login first');
//         navigation.navigate('Login');
//         return;
//       }

//       const response = await fetch(`${POST_API_BASE_URL}/mythreads`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setThreadHeads(data || []);
//       } else {
//         throw new Error('Failed to fetch thread heads');
//       }
//     } catch (error) {
//       console.error('Error fetching thread heads:', error);
//       Alert.alert('Error', 'Failed to load thread options');
//     }
//   };

//   // Upload video to S3
//   const uploadVideoToS3 = async (uploadUrl, videoUri) => {
//     try {
//       console.log('Uploading video to S3...');
      
//       const fileInfo = await FileSystem.getInfoAsync(videoUri);
      
//       if (!fileInfo.exists) {
//         throw new Error('File does not exist');
//       }
      
//       const uploadResponse = await FileSystem.uploadAsync(uploadUrl, fileInfo.uri, {
//         httpMethod: 'PUT',
//         uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
//         headers: {
//           'Content-Type': 'video/mp4',
//         },
//       });
      
//       if (uploadResponse.status !== 200) {
//         throw new Error(`S3 upload failed: ${uploadResponse.status}`);
//       }
      
//       return true;
//     } catch (error) {
//       console.error('S3 upload error:', error);
//       throw error;
//     }
//   };

//   // Handle new video upload
//   const handleVideoUpload = async () => {
//     try {
//       const hasPermission = await requestPermissions();
//       if (!hasPermission) return;

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ['videos'],
//         allowsEditing: true,
//         quality: 0.8,
//         duration: 300000, // 5 minutes max
//       });

//       if (result.canceled || !result.assets || result.assets.length === 0) {
//         return;
//       }

//       const video = result.assets[0];

//       try {
//         setUploading(true);
//         const token = await AsyncStorage.getItem('token');

//         if (!token) {
//           Alert.alert('Error', 'Please login first');
//           navigation.navigate('Home');
//           return;
//         }

//         // Get presigned upload URL
//         const uploadResponse = await fetch(`${VIDEO_API_BASE_URL}/generate-upload-url`, {
//           method: 'POST',
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             filename: video.fileName || `video_${Date.now()}.mp4`,
//           }),
//         });

//         if (!uploadResponse.ok) {
//           throw new Error('Failed to get upload URL');
//         }

//         const { upload_url, video_id } = await uploadResponse.json();

//         // Upload to S3
//         await uploadVideoToS3(upload_url, video.uri);

//         // Construct the proper S3 URL for the uploaded video
//         const s3_url = upload_url.split('?')[0]; // Remove query parameters from presigned URL 
        
//         // // Set the uploaded video as selected
//         // setSelectedVideo({ id: video_id, uri: video.uri, isNewUpload: true });
//         // Set the uploaded video as selected
//         setSelectedVideo({ 
//             id: video_id, 
//             uri: video.uri, 
//             s3_url: s3_url, 
//             isNewUpload: true 
//         });
//         Alert.alert('Success', 'Video uploaded successfully!');
//         fetchUserVideos(); // Refresh video list

//       } catch (error) {
//         console.error('Upload error:', error);
//         Alert.alert('Error', error.message || 'Failed to upload video');
//       } finally {
//         setUploading(false);
//       }
//     } catch (error) {
//       console.error('Video selection error:', error);
//       Alert.alert('Error', 'Failed to select video');
//     }
//   };

//   // Handle post creation
//   const handleCreatePost = async () => {
//     if (!selectedVideo) {
//       Alert.alert('Error', 'Please select a video first');
//       return;
//     }

//     if (!caption.trim()) {
//       Alert.alert('Error', 'Please add a caption');
//       return;
//     }

//     if (!category) {
//       Alert.alert('Error', 'Please select a category');
//       return;
//     }

//     try {
//       setPosting(true);
//       const token = await AsyncStorage.getItem('token');

//       if (!token) {
//         Alert.alert('Error', 'Please login first');
//         navigation.navigate('Home');
//         return;
//       }

//       const response = await fetch(`${POST_API_BASE_URL}/posts`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         // body: JSON.stringify({
//         //   video_id: selectedVideo.id,
//         //   caption: caption.trim(),
//         //   category: category,
//         //   thread_id: selectedThread?.id || null,
//         // }),
//         body: JSON.stringify({
//         video_id: selectedVideo.id,
//         video_url: selectedVideo.s3_url, //|| selectedVideo.uri, // Use s3_url if available, fallback to uri
//         caption: caption.trim(),
//         category: category,
//         thread_id: selectedThread?.id || null,
//         }),
//       });

//       if (response.ok) {
//         Alert.alert('Success', 'Post created successfully!', [
//           { text: 'OK', onPress: () => navigation.navigate('Feed') }
//         ]);
//         // Reset form
//         setSelectedVideo(null);
//         setCaption('');
//         setCategory('');
//         setSelectedThread(null);
//       } else {
//         throw new Error('Failed to create post');
//       }
//     } catch (error) {
//       console.error('Post creation error:', error);
//       Alert.alert('Error', error.message || 'Failed to create post');
//     } finally {
//       setPosting(false);
//     }
//   };

//   // Toggle video play
//   const toggleVideoPlay = (videoId) => {
//     setPlayingVideo(playingVideo === videoId ? null : videoId);
//   };

//   useEffect(() => {
//     fetchUserVideos();
//     fetchThreadHeads();
//   }, []);

//   // Render video item for selection
//   const renderVideoItem = ({ item }) => (
//     <TouchableOpacity
//       style={[
//         styles.videoItem,
//         selectedVideo?.id === item.id && styles.selectedVideoItem
//       ]}
//       onPress={() => {
//         setSelectedVideo(item);
//         setShowVideoModal(false);
//       }}
//     >
//       <View style={styles.videoThumbnail}>
//         {playingVideo === item.id ? (
//           <Video
//             source={{ uri: item.s3_url }}
//             style={styles.videoPreview}
//             useNativeControls
//             resizeMode="contain"
//             onError={(error) => {
//               console.error('Video playback error:', error);
//               setPlayingVideo(null);
//             }}
//           />
//         ) : (
//           <TouchableOpacity
//             style={styles.videoPlaceholder}
//             onPress={() => toggleVideoPlay(item.id)}
//           >
//             <MaterialIcons name="play-circle-filled" size={32} color="#007bff" />
//           </TouchableOpacity>
//         )}
//       </View>
//       <Text style={styles.videoItemText} numberOfLines={1}>
//         {item.video_name?.replace(/^\d+_/, '') || 'Untitled Video'}
//       </Text>
//     </TouchableOpacity>
//   );

//   // Render thread head item
//   const renderThreadHeadItem = ({ item }) => (
//     <TouchableOpacity
//       style={[
//         styles.threadItem,
//         selectedThread?.id === item.id && styles.selectedThreadItem
//       ]}
//       onPress={() => {
//         setSelectedThread(item);
//         setShowThreadModal(false);
//       }}
//     >
//       <Text style={styles.threadCaption} numberOfLines={2}>
//         {item.caption}
//       </Text>
//       <Text style={styles.threadCategory}>{item.category}</Text>
//       <Text style={styles.threadDate}>
//         {new Date(item.created_at).toLocaleDateString()}
//       </Text>
//     </TouchableOpacity>
//   );

//   // Render category item
//   const renderCategoryItem = ({ item }) => (
//     <TouchableOpacity
//       style={[
//         styles.categoryItem,
//         category === item && styles.selectedCategoryItem
//       ]}
//       onPress={() => {
//         setCategory(item);
//         setShowCategoryModal(false);
//       }}
//     >
//       <Text style={[
//         styles.categoryText,
//         category === item && styles.selectedCategoryText
//       ]}>
//         {item}
//       </Text>
//     </TouchableOpacity>
//   );

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => navigation.goBack()}
//         >
//           <MaterialIcons name="arrow-back" size={24} color="#333" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Create Post</Text>
//         <TouchableOpacity
//           style={[styles.postButton, (!selectedVideo || !caption.trim() || !category) && styles.disabledButton]}
//           onPress={handleCreatePost}
//           disabled={posting || !selectedVideo || !caption.trim() || !category}
//         >
//           {posting ? (
//             <ActivityIndicator color="#fff" size="small" />
//           ) : (
//             <Text style={styles.postButtonText}>Post</Text>
//           )}
//         </TouchableOpacity>
//       </View>

//       <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
//         {/* Video Selection */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Select Video</Text>
//           <View style={styles.videoSelectionContainer}>
//             <TouchableOpacity
//               style={styles.selectVideoButton}
//               onPress={() => setShowVideoModal(true)}
//             >
//               <MaterialIcons name="video-library" size={24} color="#007bff" />
//               <Text style={styles.selectVideoText}>
//                 {selectedVideo ? 'Change Video' : 'Select from Library'}
//               </Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={styles.uploadVideoButton}
//               onPress={handleVideoUpload}
//               disabled={uploading}
//             >
//               {uploading ? (
//                 <ActivityIndicator color="#007bff" size="small" />
//               ) : (
//                 <>
//                   <MaterialIcons name="add" size={24} color="#007bff" />
//                   <Text style={styles.uploadVideoText}>Upload New</Text>
//                 </>
//               )}
//             </TouchableOpacity>
//           </View>

//           {selectedVideo && (
//             <View style={styles.selectedVideoContainer}>
//               <Text style={styles.selectedVideoText}>Selected Video:</Text>
//               <View style={styles.selectedVideoInfo}>
//                 <MaterialIcons name="video-file" size={20} color="#666" />
//                 <Text style={styles.selectedVideoName}>
//                   {selectedVideo.video_name?.replace(/^\d+_/, '') || 'New Upload'}
//                 </Text>
//               </View>
//             </View>
//           )}
//         </View>

//         {/* Caption Input */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Caption</Text>
//           <TextInput
//             style={styles.captionInput}
//             value={caption}
//             onChangeText={setCaption}
//             placeholder="Write a caption for your post..."
//             multiline
//             maxLength={500}
//           />
//           <Text style={styles.characterCount}>{caption.length}/500</Text>
//         </View>

//         {/* Category Selection */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Category</Text>
//           <TouchableOpacity
//             style={styles.categorySelector}
//             onPress={() => setShowCategoryModal(true)}
//           >
//             <Text style={[styles.categorySelectorText, !category && styles.placeholderText]}>
//               {category || 'Select Category'}
//             </Text>
//             <MaterialIcons name="keyboard-arrow-down" size={24} color="#666" />
//           </TouchableOpacity>
//         </View>

//         {/* Thread Selection */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Thread (Optional)</Text>
//           <Text style={styles.sectionSubtitle}>
//             Add this post to an existing thread
//           </Text>
//           <TouchableOpacity
//             style={styles.threadSelector}
//             onPress={() => setShowThreadModal(true)}
//           >
//             <Text style={[styles.threadSelectorText, !selectedThread && styles.placeholderText]}>
//               {selectedThread ? selectedThread.caption.substring(0, 30) + '...' : 'Select Thread (Optional)'}
//             </Text>
//             <MaterialIcons name="keyboard-arrow-down" size={24} color="#666" />
//           </TouchableOpacity>
          
//           {selectedThread && (
//             <TouchableOpacity
//               style={styles.clearThreadButton}
//               onPress={() => setSelectedThread(null)}
//             >
//               <Text style={styles.clearThreadText}>Clear Selection</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       </ScrollView>

//       {/* Video Selection Modal */}
//       <Modal
//         visible={showVideoModal}
//         animationType="slide"
//         transparent={true}
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Select Video</Text>
//               <TouchableOpacity
//                 style={styles.closeButton}
//                 onPress={() => setShowVideoModal(false)}
//               >
//                 <MaterialIcons name="close" size={24} color="#333" />
//               </TouchableOpacity>
//             </View>
            
//             {loading ? (
//               <View style={styles.loadingContainer}>
//                 <ActivityIndicator size="large" color="#007bff" />
//                 <Text style={styles.loadingText}>Loading videos...</Text>
//               </View>
//             ) : (
//               <FlatList
//                 data={userVideos}
//                 renderItem={renderVideoItem}
//                 keyExtractor={(item) => item.id.toString()}
//                 numColumns={2}
//                 contentContainerStyle={styles.videoGrid}
//                 ListEmptyComponent={
//                   <View style={styles.emptyContainer}>
//                     <MaterialIcons name="video-library" size={48} color="#ccc" />
//                     <Text style={styles.emptyText}>No videos found</Text>
//                     <Text style={styles.emptySubtext}>Upload a video first</Text>
//                   </View>
//                 }
//               />
//             )}
//           </View>
//         </View>
//       </Modal>

//       {/* Thread Selection Modal */}
//       <Modal
//         visible={showThreadModal}
//         animationType="slide"
//         transparent={true}
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Select Thread</Text>
//               <TouchableOpacity
//                 style={styles.closeButton}
//                 onPress={() => setShowThreadModal(false)}
//               >
//                 <MaterialIcons name="close" size={24} color="#333" />
//               </TouchableOpacity>
//             </View>
            
//             <FlatList
//               data={threadHeads}
//               renderItem={renderThreadHeadItem}
//               keyExtractor={(item) => item.id.toString()}
//               contentContainerStyle={styles.threadList}
//               ListEmptyComponent={
//                 <View style={styles.emptyContainer}>
//                   <MaterialIcons name="forum" size={48} color="#ccc" />
//                   <Text style={styles.emptyText}>No threads found</Text>
//                   <Text style={styles.emptySubtext}>Create your first post to start a thread</Text>
//                 </View>
//               }
//             />
//           </View>
//         </View>
//       </Modal>

//       {/* Category Selection Modal */}
//       <Modal
//         visible={showCategoryModal}
//         animationType="slide"
//         transparent={true}
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Select Category</Text>
//               <TouchableOpacity
//                 style={styles.closeButton}
//                 onPress={() => setShowCategoryModal(false)}
//               >
//                 <MaterialIcons name="close" size={24} color="#333" />
//               </TouchableOpacity>
//             </View>
            
//             <FlatList
//               data={categories}
//               renderItem={renderCategoryItem}
//               keyExtractor={(item) => item}
//               contentContainerStyle={styles.categoryList}
//             />
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingTop: 50,
//     paddingBottom: 16,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//   },
//   backButton: {
//     padding: 4,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   postButton: {
//     backgroundColor: '#007bff',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     minWidth: 60,
//     alignItems: 'center',
//   },
//   disabledButton: {
//     backgroundColor: '#ccc',
//   },
//   postButtonText: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 14,
//   },
//   content: {
//     flex: 1,
//     padding: 16,
//   },
//   section: {
//     marginBottom: 24,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 8,
//   },
//   sectionSubtitle: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 8,
//   },
//   videoSelectionContainer: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   selectVideoButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#fff',
//     padding: 16,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//     gap: 8,
//   },
//   selectVideoText: {
//     color: '#007bff',
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   uploadVideoButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#fff',
//     padding: 16,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//     gap: 8,
//   },
//   uploadVideoText: {
//     color: '#007bff',
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   selectedVideoContainer: {
//     marginTop: 12,
//     padding: 12,
//     backgroundColor: '#e3f2fd',
//     borderRadius: 8,
//   },
//   selectedVideoText: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#333',
//     marginBottom: 4,
//   },
//   selectedVideoInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   selectedVideoName: {
//     fontSize: 14,
//     color: '#666',
//   },
//   captionInput: {
//     backgroundColor: '#fff',
//     padding: 12,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//     minHeight: 100,
//     textAlignVertical: 'top',
//     fontSize: 16,
//   },
//   characterCount: {
//     textAlign: 'right',
//     fontSize: 12,
//     color: '#666',
//     marginTop: 4,
//   },
//   categorySelector: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     backgroundColor: '#fff',
//     padding: 16,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   categorySelectorText: {
//     fontSize: 16,
//     color: '#333',
//   },
//   threadSelector: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     backgroundColor: '#fff',
//     padding: 16,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   threadSelectorText: {
//     fontSize: 16,
//     color: '#333',
//     flex: 1,
//   },
//   placeholderText: {
//     color: '#999',
//   },
//   clearThreadButton: {
//     marginTop: 8,
//     alignSelf: 'flex-start',
//   },
//   clearThreadText: {
//     color: '#007bff',
//     fontSize: 14,
//   },
//   modalContainer: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'flex-end',
//   },
//   modalContent: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     maxHeight: height * 0.8,
//     paddingBottom: 34,
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   closeButton: {
//     padding: 4,
//   },
//   videoGrid: {
//     padding: 16,
//   },
//   videoItem: {
//     flex: 1,
//     margin: 6,
//     backgroundColor: '#f8f9fa',
//     borderRadius: 8,
//     padding: 8,
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: 'transparent',
//   },
//   selectedVideoItem: {
//     borderColor: '#007bff',
//     backgroundColor: '#e3f2fd',
//   },
//   videoThumbnail: {
//     width: '100%',
//     height: 80,
//     borderRadius: 6,
//     backgroundColor: '#e0e0e0',
//     marginBottom: 8,
//   },
//   videoPreview: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 6,
//   },
//   videoPlaceholder: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   videoItemText: {
//     fontSize: 12,
//     color: '#333',
//     textAlign: 'center',
//   },
//   threadList: {
//     padding: 16,
//   },
//   threadItem: {
//     backgroundColor: '#f8f9fa',
//     padding: 16,
//     borderRadius: 8,
//     marginBottom: 8,
//     borderWidth: 2,
//     borderColor: 'transparent',
//   },
//   selectedThreadItem: {
//     borderColor: '#007bff',
//     backgroundColor: '#e3f2fd',
//   },
//   threadCaption: {
//     fontSize: 14,
//     color: '#333',
//     marginBottom: 4,
//   },
//   threadCategory: {
//     fontSize: 12,
//     color: '#007bff',
//     fontWeight: '500',
//     marginBottom: 4,
//   },
//   threadDate: {
//     fontSize: 12,
//     color: '#666',
//   },
//   categoryList: {
//     padding: 16,
//   },
//   categoryItem: {
//     backgroundColor: '#f8f9fa',
//     padding: 16,
//     borderRadius: 8,
//     marginBottom: 8,
//     borderWidth: 2,
//     borderColor: 'transparent',
//   },
//   selectedCategoryItem: {
//     borderColor: '#007bff',
//     backgroundColor: '#e3f2fd',
//   },
//   categoryText: {
//     fontSize: 16,
//     color: '#333',
//     textAlign: 'center',
//   },
//   selectedCategoryText: {
//     color: '#007bff',
//     fontWeight: '500',
//   },
//   loadingContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 32,
//   },
//   loadingText: {
//     fontSize: 16,
//     color: '#666',
//     marginTop: 12,
//   },
//   emptyContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 32,
//   },
//   emptyText: {
//     fontSize: 16,
//     color: '#666',
//     marginTop: 12,
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: '#999',
//     marginTop: 4,
//     textAlign: 'center',
//   },
// });

// export default PostScreen;


// screens/PostScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
  Dimensions,
  RefreshControl,
  Share,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Video } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const PostScreen = ({ navigation, userInfo }) => {
  // Create Post State
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('');
  const [selectedThread, setSelectedThread] = useState(null);
  const [userVideos, setUserVideos] = useState([]);
  const [threadHeads, setThreadHeads] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showThreadModal, setShowThreadModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);

  // Manage Posts State
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'manage'
  const [myPosts, setMyPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingPost, setDeletingPost] = useState(null);

  const POST_API_BASE_URL = 'http://aarya.live:8082';
  const VIDEO_API_BASE_URL = 'http://aarya.live:8084';

  // Categories list
  const categories = [
    'Fitness', 'Nutrition', 'Lifestyle', 'Motivation', 
    'Training', 'Recovery', 'Mental Health', 'Other'
  ];

  // Common reaction emojis
  const reactionEmojis = ['🔥', '💪', '👏', '❤️', '😮', '🎉', '💯', '🚀'];

  // Request permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant media library permissions to upload videos');
      return false;
    }
    return true;
  };

  // Fetch user's videos
  const fetchUserVideos = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Error', 'Please login first');
        navigation.navigate('Login');
        return;
      }

      const response = await fetch(`${VIDEO_API_BASE_URL}/videos`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserVideos(data || []);
      } else if (response.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        navigation.navigate('Home');
      } else {
        throw new Error('Failed to fetch videos');
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      Alert.alert('Error', 'Failed to load videos');
    }
  };

  // Fetch thread heads (posts with thread_id = null)
  const fetchThreadHeads = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Error', 'Please login first');
        navigation.navigate('Login');
        return;
      }

      const response = await fetch(`${POST_API_BASE_URL}/mythreads`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setThreadHeads(data || []);
      } else {
        throw new Error('Failed to fetch thread heads');
      }
    } catch (error) {
      console.error('Error fetching thread heads:', error);
      Alert.alert('Error', 'Failed to load thread options');
    }
  };

  // Fetch user's posts
  const fetchMyPosts = async () => {
    try {
      setLoadingPosts(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Error', 'Please login first');
        navigation.navigate('Login');
        return;
      }

      const response = await fetch(`${POST_API_BASE_URL}/myposts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMyPosts(data || []);
      } else if (response.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        navigation.navigate('Home');
      } else {
        throw new Error('Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setLoadingPosts(false);
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

  // Handle new video upload
  const handleVideoUpload = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 0.8,
        duration: 300000, // 5 minutes max
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const video = result.assets[0];
      const convertedUri = await convertVideoIfNeeded(video.uri);

      try {
        setUploading(true);
        const token = await AsyncStorage.getItem('token');

        if (!token) {
          Alert.alert('Error', 'Please login first');
          navigation.navigate('Home');
          return;
        }

        // Get presigned upload URL
        const uploadResponse = await fetch(`${VIDEO_API_BASE_URL}/generate-upload-url`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: video.fileName || `video_${Date.now()}.mp4`,
          }),
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to get upload URL');
        }

        const { upload_url, video_id } = await uploadResponse.json();

        // // Upload to S3
        // await uploadVideoToS3(upload_url, video.uri);
        // use convertedUri instead of video.uri for the upload:
        await uploadVideoToS3(upload_url, convertedUri);

        // Construct the proper S3 URL for the uploaded video
        const s3_url = upload_url.split('?')[0]; // Remove query parameters from presigned URL 
        
        // Set the uploaded video as selected
        setSelectedVideo({ 
            id: video_id, 
            uri: video.uri, 
            s3_url: s3_url, 
            isNewUpload: true 
        });
        Alert.alert('Success', 'Video uploaded successfully!');
        fetchUserVideos(); // Refresh video list

      } catch (error) {
        console.error('Upload error:', error);
        Alert.alert('Error', error.message || 'Failed to upload video');
      } finally {
        setUploading(false);
      }
    } catch (error) {
      console.error('Video selection error:', error);
      Alert.alert('Error', 'Failed to select video');
    }
  };

  // Handle post creation
  const handleCreatePost = async () => {
    if (!selectedVideo) {
      Alert.alert('Error', 'Please select a video first');
      return;
    }

    if (!caption.trim()) {
      Alert.alert('Error', 'Please add a caption');
      return;
    }

    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    try {
      setPosting(true);
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        Alert.alert('Error', 'Please login first');
        navigation.navigate('Home');
        return;
      }

      const response = await fetch(`${POST_API_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_id: selectedVideo.id,
          video_url: selectedVideo.s3_url,
          caption: caption.trim(),
          category: category,
          thread_id: selectedThread?.id || null,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Post created successfully!', [
          { text: 'OK', onPress: () => {
            // Reset form
            setSelectedVideo(null);
            setCaption('');
            setCategory('');
            setSelectedThread(null);
            // Refresh posts if on manage tab
            if (activeTab === 'manage') {
              fetchMyPosts();
            }
          }}
        ]);
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      console.error('Post creation error:', error);
      Alert.alert('Error', error.message || 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  // Handle post deletion
  const handleDeletePost = async (postId) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingPost(postId);
              const token = await AsyncStorage.getItem('token');

              if (!token) {
                Alert.alert('Error', 'Please login first');
                navigation.navigate('Home');
                return;
              }

              const response = await fetch(`${POST_API_BASE_URL}/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                Alert.alert('Success', 'Post deleted successfully');
                fetchMyPosts(); // Refresh posts
              } else {
                throw new Error('Failed to delete post');
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', error.message || 'Failed to delete post');
            } finally {
              setDeletingPost(null);
            }
          }
        }
      ]
    );
  };

  // Handle thread navigation
  const handleThreadNavigation = (post) => {
    const threadId = post.thread_id || post.id;
    navigation.navigate('Thread', { threadId, threadTitle: post.caption });
  };

  // Handle share
  const handleShare = async (post) => {
    try {
      await Share.share({
        message: `Check out this post: ${post.caption}`,
        title: 'Share Post',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Toggle video play
  const toggleVideoPlay = (videoId) => {
    setPlayingVideo(playingVideo === videoId ? null : videoId);
  };

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'create') {
      await Promise.all([fetchUserVideos(), fetchThreadHeads()]);
    } else {
      await fetchMyPosts();
    }
    setRefreshing(false);
  }, [activeTab]);

  // Load data on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchUserVideos();
      fetchThreadHeads();
      if (activeTab === 'manage') {
        fetchMyPosts();
      }
    }, [activeTab])
  );

  // Render post item for manage tab
  const renderPostItem = (post) => (
    <View key={post.id} style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.postInfo}>
          <Text style={styles.postCategory}>{post.category}</Text>
          <Text style={styles.postDate}>
            {new Date(post.created_at).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletePost(post.id)}
          disabled={deletingPost === post.id}
        >
          {deletingPost === post.id ? (
            <ActivityIndicator color="#ff4444" size="small" />
          ) : (
            <MaterialIcons name="delete" size={20} color="#ff4444" />
          )}
        </TouchableOpacity>
      </View>

      {/* Video Player */}
      <View style={styles.videoContainer}>
        {playingVideo === post.id ? (
          <Video
            source={{ uri: post.video_url }}
            style={styles.videoPlayer}
            useNativeControls
            resizeMode="contain"
            onError={(error) => {
              console.error('Video playback error:', error);
              Alert.alert('Error', 'Failed to play video');
              setPlayingVideo(null);
            }}
            onPlaybackStatusUpdate={(status) => {
              if (status.didJustFinish) {
                setPlayingVideo(null);
              }
            }}
          />
        ) : (
          <TouchableOpacity
            style={styles.videoThumbnail}
            onPress={() => toggleVideoPlay(post.id)}
          >
            <MaterialIcons name="play-circle-filled" size={64} color="#007bff" />
            <Text style={styles.playText}>Tap to play</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Post Caption */}
      <Text style={styles.postCaption}>{post.caption}</Text>

      {/* Engagement Stats */}
      <View style={styles.engagementStats}>
        <View style={styles.statItem}>
          <MaterialIcons name="thumb-up" size={16} color="#666" />
          <Text style={styles.statText}>{post.nudges || 0} nudges</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialIcons name="emoji-emotions" size={16} color="#666" />
          <Text style={styles.statText}>
            {Object.values(post.reactions || {}).reduce((sum, count) => sum + count, 0)} reactions
          </Text>
        </View>
        {post.thread_id && (
          <View style={styles.statItem}>
            <MaterialIcons name="forum" size={16} color="#007bff" />
            <Text style={styles.statText}>In thread</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleThreadNavigation(post)}
        >
          <MaterialIcons name="forum" size={20} color="#666" />
          <Text style={styles.actionText}>View Thread</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleShare(post)}
        >
          <MaterialIcons name="share" size={20} color="#666" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render video item for selection
  const renderVideoItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.videoItem,
        selectedVideo?.id === item.id && styles.selectedVideoItem
      ]}
      onPress={() => {
        setSelectedVideo(item);
        setShowVideoModal(false);
      }}
    >
      <View style={styles.videoThumbnail}>
        {playingVideo === item.id ? (
          <Video
            source={{ uri: item.s3_url }}
            style={styles.videoPreview}
            useNativeControls
            resizeMode="contain"
            onError={(error) => {
              console.error('Video playback error:', error);
              setPlayingVideo(null);
            }}
          />
        ) : (
          <TouchableOpacity
            style={styles.videoPlaceholder}
            onPress={() => toggleVideoPlay(item.id)}
          >
            <MaterialIcons name="play-circle-filled" size={32} color="#007bff" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.videoItemText} numberOfLines={1}>
        {item.video_name?.replace(/^\d+_/, '') || 'Untitled Video'}
      </Text>
    </TouchableOpacity>
  );

  // Render thread head item
  const renderThreadHeadItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.threadItem,
        selectedThread?.id === item.id && styles.selectedThreadItem
      ]}
      onPress={() => {
        setSelectedThread(item);
        setShowThreadModal(false);
      }}
    >
      <Text style={styles.threadCaption} numberOfLines={2}>
        {item.caption}
      </Text>
      <Text style={styles.threadCategory}>{item.category}</Text>
      <Text style={styles.threadDate}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  // Render category item
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        category === item && styles.selectedCategoryItem
      ]}
      onPress={() => {
        setCategory(item);
        setShowCategoryModal(false);
      }}
    >
      <Text style={[
        styles.categoryText,
        category === item && styles.selectedCategoryText
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Posts</Text>
        {activeTab === 'create' && (
          <TouchableOpacity
            style={[styles.postButton, (!selectedVideo || !caption.trim() || !category) && styles.disabledButton]}
            onPress={handleCreatePost}
            disabled={posting || !selectedVideo || !caption.trim() || !category}
          >
            {posting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'create' && styles.activeTab]}
          onPress={() => setActiveTab('create')}
        >
          <MaterialIcons name="add" size={20} color={activeTab === 'create' ? '#007bff' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>
            Create
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'manage' && styles.activeTab]}
          onPress={() => {
            setActiveTab('manage');
            fetchMyPosts();
          }}
        >
          <MaterialIcons name="list" size={20} color={activeTab === 'manage' ? '#007bff' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'manage' && styles.activeTabText]}>
            My Posts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'create' ? (
          // Create Post Tab
          <>
            {/* Video Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Video</Text>
              <View style={styles.videoSelectionContainer}>
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={() => navigation.navigate('Camera')}
                >
                  <View style={styles.buttonContent}>
                    <MaterialIcons name="videocam" size={20} color="#007bff" />
                    <Text style={styles.cameraButtonText}>Record New</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.selectVideoButton}
                  onPress={() => setShowVideoModal(true)}
                >
                  <View style={styles.buttonContent}>
                    <MaterialIcons name="video-library" size={20} color="#007bff" />
                    <Text style={styles.selectVideoText}>
                      {selectedVideo ? 'Change Video' : 'Library'}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.uploadVideoButton}
                  onPress={handleVideoUpload}
                  disabled={uploading}
                >
                  <View style={styles.buttonContent}>
                    {uploading ? (
                      <ActivityIndicator color="#007bff" size="small" />
                    ) : (
                      <>
                        <MaterialIcons name="add" size={20} color="#007bff" />
                        <Text style={styles.uploadVideoText}>Upload New</Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {selectedVideo && (
                <View style={styles.selectedVideoContainer}>
                  <Text style={styles.selectedVideoText}>Selected Video:</Text>
                  <View style={styles.selectedVideoInfo}>
                    <MaterialIcons name="video-file" size={20} color="#666" />
                    <Text style={styles.selectedVideoName}>
                      {selectedVideo.video_name?.replace(/^\d+_/, '') || 'New Upload'}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Caption Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Caption</Text>
              <TextInput
                style={styles.captionInput}
                value={caption}
                onChangeText={setCaption}
                placeholder="Write a caption for your post..."
                multiline
                maxLength={500}
              />
              <Text style={styles.characterCount}>{caption.length}/500</Text>
            </View>

            {/* Category Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <TouchableOpacity
                style={styles.categorySelector}
                onPress={() => setShowCategoryModal(true)}
              >
                <Text style={[styles.categorySelectorText, !category && styles.placeholderText]}>
                  {category || 'Select Category'}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Thread Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thread (Optional)</Text>
              <Text style={styles.sectionSubtitle}>
                Add this post to an existing thread
              </Text>
              <TouchableOpacity
                style={styles.threadSelector}
                onPress={() => setShowThreadModal(true)}
              >
                <Text style={[styles.threadSelectorText, !selectedThread && styles.placeholderText]}>
                  {selectedThread ? selectedThread.caption.substring(0, 30) + '...' : 'Select Thread (Optional)'}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={24} color="#666" />
              </TouchableOpacity>
              
              {selectedThread && (
                <TouchableOpacity
                  style={styles.clearThreadButton}
                  onPress={() => setSelectedThread(null)}
                >
                  <Text style={styles.clearThreadText}>Clear Selection</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          // Manage Posts Tab
          <>
            {loadingPosts ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.loadingText}>Loading posts...</Text>
              </View>
            ) : myPosts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="post-add" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No posts yet</Text>
                <Text style={styles.emptySubtext}>
                  Create your first post to see it here
                </Text>
                <TouchableOpacity
                  style={styles.createPostButton}
                  onPress={() => setActiveTab('create')}
                >
                  <MaterialIcons name="add" size={20} color="#fff" />
                  <Text style={styles.createPostButtonText}>Create Post</Text>
                </TouchableOpacity>
              </View>
            ) : (
              myPosts.map(renderPostItem)
            )}
          </>
        )}
      </ScrollView>

      {/* Video Selection Modal */}
      <Modal
        visible={showVideoModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Video</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowVideoModal(false)}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={userVideos}
              renderItem={renderVideoItem}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              contentContainerStyle={styles.videoGrid}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="video-library" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No videos found</Text>
                  <Text style={styles.emptySubtext}>Upload a video first</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Thread Selection Modal */}
      <Modal
        visible={showThreadModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Thread</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowThreadModal(false)}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={threadHeads}
              renderItem={renderThreadHeadItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.threadList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="forum" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No threads found</Text>
                  <Text style={styles.emptySubtext}>Create your first post to start a thread</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCategoryModal(false)}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.categoryList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  postButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#007bff',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  videoSelectionContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cameraButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  cameraButtonText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '500',
  },
  selectVideoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  selectVideoText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '500',
  },
  uploadVideoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  uploadVideoText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedVideoContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  selectedVideoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  selectedVideoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedVideoName: {
    fontSize: 14,
    color: '#666',
  },
  captionInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categorySelectorText: {
    fontSize: 16,
    color: '#333',
  },
  threadSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  threadSelectorText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  clearThreadButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearThreadText: {
    color: '#007bff',
    fontSize: 14,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postInfo: {
    flex: 1,
  },
  postCategory: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  postDate: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  videoContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
  },
  videoPlayer: {
    width: '100%',
    height: 200,
  },
  videoThumbnail: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e0e0',
  },
  playText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  postCaption: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  engagementStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
  },
  createPostButton: {
    backgroundColor: '#007bff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  createPostButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  videoGrid: {
    padding: 16,
  },
  videoItem: {
    flex: 1,
    margin: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedVideoItem: {
    borderColor: '#007bff',
    backgroundColor: '#e3f2fd',
  },
  videoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoItemText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  threadList: {
    padding: 16,
  },
  threadItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedThreadItem: {
    borderColor: '#007bff',
    backgroundColor: '#e3f2fd',
  },
  threadCaption: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  threadCategory: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
    marginBottom: 4,
  },
  threadDate: {
    fontSize: 12,
    color: '#666',
  },
  categoryList: {
    padding: 16,
  },
  categoryItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCategoryItem: {
    borderColor: '#007bff',
    backgroundColor: '#e3f2fd',
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#007bff',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default PostScreen;