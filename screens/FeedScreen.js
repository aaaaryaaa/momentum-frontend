// screens/FeedScreen.js
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
  Modal,
  FlatList,
  Dimensions,
  Share,
} from 'react-native';
import { Video } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const FeedScreen = ({ navigation, userInfo }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [streakLeaderboard, setStreakLeaderboard] = useState([]);
  const [userStreak, setUserStreak] = useState(null);
  const [leaderboardType, setLeaderboardType] = useState('nudge'); // 'nudge' or 'streak'
  const [selectedCategory, setSelectedCategory] = useState('');

  const API_BASE_URL = 'http://aarya.live:8082';

  // Categories list
  const categories = [
    'All', 'Fitness', 'Nutrition', 'Lifestyle', 'Motivation', 
    'Training', 'Recovery', 'Mental Health', 'Other'
  ];

  // Common reaction emojis
  const reactionEmojis = ['🔥', '💪', '👏', '❤️', '😮', '🎉', '💯', '🚀'];

  // Fetch feed posts
  const fetchFeed = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Error', 'Please login first');
        navigation.navigate('Login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/feed`, {
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
        throw new Error('Failed to fetch feed');
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
      Alert.alert('Error', 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's streak
  const fetchUserStreak = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/streak`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserStreak(data);
      }
    } catch (error) {
      console.error('Error fetching user streak:', error);
    }
  };

  // Fetch leaderboard data
  const fetchLeaderboard = async (type = 'nudge', category = '') => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      let url = `${API_BASE_URL}/${type === 'nudge' ? 'leaderboard' : 'streak-leaderboard'}`;
      if (type === 'nudge' && category && category !== 'All') {
        url += `?category=${encodeURIComponent(category)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (type === 'nudge') {
          setLeaderboardData(data || []);
        } else {
          setStreakLeaderboard(data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
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
      const hasReacted = currentReactions[emoji] > 0; // Assuming user has reacted if count > 0

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
      const hasNudged = post?.user_nudged || false; // Assuming this field exists

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
  const toggleVideoPlay = (postId) => {
    setPlayingVideo(playingVideo === postId ? null : postId);
  };

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchFeed(),
      fetchUserStreak(),
      fetchLeaderboard(leaderboardType, selectedCategory)
    ]);
    setRefreshing(false);
  }, [leaderboardType, selectedCategory]);

  // Handle leaderboard type change
  const handleLeaderboardTypeChange = (type) => {
    setLeaderboardType(type);
    fetchLeaderboard(type, selectedCategory);
  };

  // Load data on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchFeed();
      fetchUserStreak();
      fetchLeaderboard('nudge', selectedCategory);
      fetchLeaderboard('streak', selectedCategory);
    }, [selectedCategory])
  );

  // Render post item
  const renderPost = (post) => (
    <View key={post.id} style={styles.postCard}>
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
          {post.thread_id && (
            <MaterialIcons name="forum" size={16} color="#007bff" />
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
            onPress={() => handleThreadNavigation(post)}
          >
            <MaterialIcons name="forum" size={20} color="#666" />
            <Text style={styles.actionText}>Thread</Text>
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

  // Render leaderboard item
  const renderLeaderboardItem = ({ item, index }) => (
    <View style={styles.leaderboardItem}>
      <View style={styles.leaderboardRank}>
        <Text style={styles.leaderboardRankText}>#{index + 1}</Text>
      </View>
      <View style={styles.leaderboardInfo}>
        <Text style={styles.leaderboardName}>User {item.user_id}</Text>
        <Text style={styles.leaderboardStats}>
          {leaderboardType === 'nudge' 
            ? `${item.nudges} nudges in ${item.category}`
            : `${item.streak} day streak`
          }
        </Text>
      </View>
      <View style={styles.leaderboardBadge}>
        <MaterialIcons 
          name={leaderboardType === 'nudge' ? 'thumb-up' : 'local-fire-department'} 
          size={20} 
          color="#007bff" 
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowLeaderboard(true)}
          >
            <MaterialIcons name="leaderboard" size={24} color="#007bff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Post')}
          >
            <MaterialIcons name="add" size={24} color="#007bff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* User Streak Display */}
      {userStreak && (
        <View style={styles.streakBanner}>
          <MaterialIcons name="local-fire-department" size={20} color="#ff6b35" />
          <Text style={styles.streakText}>
            Your streak: {userStreak.streak} days
          </Text>
        </View>
      )}

      {/* Category Filter */}
      <View style={styles.categoryFilter}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryFilterContent}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryFilterButton,
                (selectedCategory === category || (category === 'All' && !selectedCategory)) && 
                styles.categoryFilterButtonActive
              ]}
              onPress={() => setSelectedCategory(category === 'All' ? '' : category)}
            >
              <Text style={[
                styles.categoryFilterText,
                (selectedCategory === category || (category === 'All' && !selectedCategory)) && 
                styles.categoryFilterTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Feed Content */}
      <ScrollView
        style={styles.feedContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Loading feed...</Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="dynamic-feed" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>
              Be the first to share something!
            </Text>
            <TouchableOpacity
              style={styles.createPostButton}
              onPress={() => navigation.navigate('Post')}
            >
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={styles.createPostButtonText}>Create Post</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Filter posts by category if selected
          posts
            .filter(post => !selectedCategory || post.category === selectedCategory)
            .map(renderPost)
        )}
      </ScrollView>

      {/* Leaderboard Modal */}
      <Modal
        visible={showLeaderboard}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Leaderboard</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowLeaderboard(false)}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Leaderboard Type Toggle */}
            <View style={styles.leaderboardToggle}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  leaderboardType === 'nudge' && styles.toggleButtonActive
                ]}
                onPress={() => handleLeaderboardTypeChange('nudge')}
              >
                <Text style={[
                  styles.toggleButtonText,
                  leaderboardType === 'nudge' && styles.toggleButtonTextActive
                ]}>
                  Nudge Leaders
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  leaderboardType === 'streak' && styles.toggleButtonActive
                ]}
                onPress={() => handleLeaderboardTypeChange('streak')}
              >
                <Text style={[
                  styles.toggleButtonText,
                  leaderboardType === 'streak' && styles.toggleButtonTextActive
                ]}>
                  Streak Leaders
                </Text>
              </TouchableOpacity>
            </View>

            {/* Leaderboard List */}
            <FlatList
              data={leaderboardType === 'nudge' ? leaderboardData : streakLeaderboard}
              renderItem={renderLeaderboardItem}
              keyExtractor={(item) => item.user_id.toString()}
              contentContainerStyle={styles.leaderboardList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="leaderboard" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No data yet</Text>
                  <Text style={styles.emptySubtext}>
                    Start posting to see leaderboard data
                  </Text>
                </View>
              }
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff3cd',
    padding: 12,
    gap: 6,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#856404',
  },
  categoryFilter: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryFilterContent: {
    paddingHorizontal: 16,
  },
  categoryFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  categoryFilterButtonActive: {
    backgroundColor: '#007bff',
  },
  categoryFilterText: {
    fontSize: 14,
    color: '#666',
  },
  categoryFilterTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  feedContent: {
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
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
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
  leaderboardToggle: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#007bff',
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#666',
  },
  toggleButtonTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  leaderboardList: {
    padding: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  leaderboardRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  leaderboardRankText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  leaderboardStats: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  leaderboardBadge: {
    padding: 8,
  },
});

export default FeedScreen;