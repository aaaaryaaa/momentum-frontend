// screens/ThreadScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Share,
} from 'react-native';
import { Video } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

const ThreadScreen = ({ route, navigation }) => {
  const { threadId, threadTitle } = route.params;
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);

  const API_BASE_URL = 'http://aarya.live:8082';

  // Common reaction emojis
  const reactionEmojis = ['🔥', '💪', '👏', '❤️', '😮', '🎉', '💯', '🚀'];

  // Fetch thread posts
  const fetchThread = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Error', 'Please login first');
        navigation.navigate('Login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/thread/${threadId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data || []);
      } else if (response.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        navigation.navigate('Home');
      } else {
        throw new Error('Failed to fetch thread');
      }
    } catch (error) {
      console.error('Error fetching thread:', error);
      Alert.alert('Error', 'Failed to load thread');
    } finally {
      setLoading(false);
    }
  };

  // Handle reaction toggle
  const handleReaction = async (postId, emoji) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      // Find the post to check current reaction state
      const post = posts.find(p => p.id === postId);
      const currentReactions = post?.reactions || {};
      const hasReacted = currentReactions[emoji] > 0;

      const method = hasReacted ? 'DELETE' : 'POST';
      
      const response = await fetch(`${API_BASE_URL}/react`, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_id: postId,
          emoji: emoji,
        }),
      });

      if (response.ok) {
        // Update local state optimistically
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId
              ? {
                  ...post,
                  reactions: {
                    ...post.reactions,
                    [emoji]: hasReacted 
                      ? Math.max(0, (post.reactions[emoji] || 0) - 1)
                      : (post.reactions[emoji] || 0) + 1
                  }
                }
              : post
          )
        );
      } else {
        throw new Error('Failed to update reaction');
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      Alert.alert('Error', 'Failed to update reaction');
    }
  };

  // Handle nudge toggle
  const handleNudge = async (postId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      // Find the post to check current nudge state
      const post = posts.find(p => p.id === postId);
      const hasNudged = post?.user_nudged || false;

      const method = hasNudged ? 'DELETE' : 'POST';
      
      const response = await fetch(`${API_BASE_URL}/nudge`, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_id: postId,
        }),
      });

      if (response.ok) {
        // Update local state optimistically
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId
              ? {
                  ...post,
                  nudges: hasNudged 
                    ? Math.max(0, post.nudges - 1)
                    : post.nudges + 1,
                  user_nudged: !hasNudged
                }
              : post
          )
        );
      } else {
        throw new Error('Failed to update nudge');
      }
    } catch (error) {
      console.error('Error handling nudge:', error);
      Alert.alert('Error', 'Failed to update nudge');
    }
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
  const toggleVideoPlay = (postId) => {
    setPlayingVideo(playingVideo === postId ? null : postId);
  };

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchThread();
    setRefreshing(false);
  }, [threadId]);

  // Load data on component mount
  useEffect(() => {
    fetchThread();
  }, [threadId]);

  // Navigate to reply (create new post in this thread)
  const handleReply = () => {
    navigation.navigate('Post', { threadId, threadTitle });
  };

  // Render post item
  const renderPost = (post, index) => (
    <View key={post.id} style={[
      styles.postCard,
      index === 0 && styles.threadHeaderCard // Style first post as thread header
    ]}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.postUserInfo}>
          <MaterialIcons name="account-circle" size={32} color="#666" />
          <View style={styles.postUserDetails}>
            <Text style={styles.postUserName}>User {post.user_id}</Text>
            <Text style={styles.postDate}>
              {new Date(post.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={styles.postMeta}>
          <Text style={styles.postCategory}>{post.category}</Text>
          {index === 0 && (
            <View style={styles.threadHeaderBadge}>
              <MaterialIcons name="forum" size={16} color="#007bff" />
              <Text style={styles.threadHeaderText}>Thread</Text>
            </View>
          )}
        </View>
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

      {/* Engagement Section */}
      <View style={styles.engagementSection}>
        {/* Reactions */}
        <View style={styles.reactionsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.reactionsScrollView}
          >
            {reactionEmojis.map(emoji => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.reactionButton,
                  (post.reactions?.[emoji] || 0) > 0 && styles.reactionButtonActive
                ]}
                onPress={() => handleReaction(post.id, emoji)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                {(post.reactions?.[emoji] || 0) > 0 && (
                  <Text style={styles.reactionCount}>
                    {post.reactions[emoji]}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              post.user_nudged && styles.actionButtonActive
            ]}
            onPress={() => handleNudge(post.id)}
          >
            <MaterialIcons 
              name="thumb-up" 
              size={20} 
              color={post.user_nudged ? "#007bff" : "#666"} 
            />
            <Text style={[
              styles.actionText,
              post.user_nudged && styles.actionTextActive
            ]}>
              Nudge {post.nudges || 0}
            </Text>
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
    </View>
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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Thread</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {threadTitle}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.replyButton}
          onPress={handleReply}
        >
          <MaterialIcons name="reply" size={24} color="#007bff" />
        </TouchableOpacity>
      </View>

      {/* Thread Content */}
      <ScrollView
        style={styles.threadContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Loading thread...</Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="forum" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No posts in this thread</Text>
            <TouchableOpacity
              style={styles.createPostButton}
              onPress={handleReply}
            >
              <MaterialIcons name="reply" size={20} color="#fff" />
              <Text style={styles.createPostButtonText}>Start Discussion</Text>
            </TouchableOpacity>
          </View>
        ) : (
          posts.map((post, index) => renderPost(post, index))
        )}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  replyButton: {
    padding: 4,
  },
  threadContent: {
    flex: 1,
  },
  postCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  threadHeaderCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postUserDetails: {
    flex: 1,
  },
  postUserName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  postDate: {
    fontSize: 12,
    color: '#666',
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postCategory: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  threadHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  threadHeaderText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  videoContainer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#000',
    marginBottom: 12,
    overflow: 'hidden',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoThumbnail: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  playText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  postCaption: {
    fontSize: 16,
    color: '#333',
    lineHeight: 20,
    marginBottom: 16,
  },
  engagementSection: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  reactionsContainer: {
    marginBottom: 12,
  },
  reactionsScrollView: {
    flexDirection: 'row',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
    gap: 4,
  },
  reactionButtonActive: {
    backgroundColor: '#e3f2fd',
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  actionButtonActive: {
    backgroundColor: '#e3f2fd',
  },
  actionText: {
    fontSize: 14,
    color: '#666',
  },
  actionTextActive: {
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
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
    gap: 8,
  },
  createPostButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ThreadScreen;