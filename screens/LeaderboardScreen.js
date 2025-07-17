// screens/LeaderboardScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const LeaderboardScreen = ({ navigation }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [streakLeaderboard, setStreakLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboardType, setLeaderboardType] = useState('nudge'); // 'nudge' or 'streak'
  const [selectedCategory, setSelectedCategory] = useState('');

  const API_BASE_URL = 'http://aarya.live:8082';
  const AUTH_API_BASE_URL = 'http://aarya.live:8000';

  // Categories list
  const categories = [
    'All', 'Fitness', 'Nutrition', 'Lifestyle', 'Motivation', 
    'Training', 'Recovery', 'Mental Health', 'Other'
  ];

  // Fetch user full name
  const fetchUserFullName = async (userId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        return `User ${userId}`;
      }

      const response = await fetch(`${AUTH_API_BASE_URL}/get-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "user_id": userId
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.name || `User ${userId}`;
      } else {
        return `User ${userId}`;
      }
    } catch (error) {
      console.error('Error fetching user full name:', error);
      return `User ${userId}`;
    }
  };

  // Fetch leaderboard data
  const fetchLeaderboard = async (type = 'nudge', category = '') => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Error', 'Please login first');
        navigation.navigate('Login');
        return;
      }

      let data = [];

      if (type === 'nudge') {
        if (!category || category === 'All') {
          // Fetch all categories and aggregate
          const categoryPromises = categories
            .filter(cat => cat !== 'All')
            .map(async (cat) => {
              try {
                const url = `${API_BASE_URL}/leaderboard?category=${encodeURIComponent(cat)}`;
                const response = await fetch(url, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                });
                
                if (response.ok) {
                  const categoryData = await response.json();
                  return Array.isArray(categoryData) ? categoryData : [];
                }
                return [];
              } catch (error) {
                console.error(`Error fetching ${cat} leaderboard:`, error);
                return [];
              }
            });

          const allCategoryData = await Promise.all(categoryPromises);
          const flatData = allCategoryData.flat();
          
          // Aggregate nudges by user_id
          const userNudges = {};
          flatData.forEach(item => {
            if (userNudges[item.user_id]) {
              userNudges[item.user_id].nudges += item.nudges;
              // Keep the most recent last_nudge
              if (new Date(item.last_nudge) > new Date(userNudges[item.user_id].last_nudge)) {
                userNudges[item.user_id].last_nudge = item.last_nudge;
              }
            } else {
              userNudges[item.user_id] = {
                user_id: item.user_id,
                nudges: item.nudges,
                last_nudge: item.last_nudge,
                category: 'All'
              };
            }
          });

          data = Object.values(userNudges).sort((a, b) => b.nudges - a.nudges);
        } else {
          // Fetch specific category
          const url = `${API_BASE_URL}/leaderboard?category=${encodeURIComponent(category)}`;
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const responseData = await response.json();
            data = Array.isArray(responseData) ? responseData : [];
          } else if (response.status === 401) {
            Alert.alert('Session Expired', 'Please login again');
            navigation.navigate('Home');
            return;
          } else {
            console.log('Non-OK response for category:', category, response.status);
            data = [];
          }
        }
      } else {
        // Streak leaderboard
        const url = `${API_BASE_URL}/streak-leaderboard`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const responseData = await response.json();
          data = Array.isArray(responseData) ? responseData : [];
        } else if (response.status === 401) {
          Alert.alert('Session Expired', 'Please login again');
          navigation.navigate('Home');
          return;
        } else {
          console.log('Non-OK response for streak leaderboard:', response.status);
          data = [];
        }
      }

      // Ensure data is an array
      if (!Array.isArray(data)) {
        data = [];
      }

      // Fetch user names for all leaderboard entries
      const dataWithUserNames = await Promise.all(
        data.map(async (item) => {
          const userName = await fetchUserFullName(item.user_id);
          return { ...item, user_name: userName };
        })
      );

      if (type === 'nudge') {
        setLeaderboardData(dataWithUserNames);
      } else {
        setStreakLeaderboard(dataWithUserNames);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Don't show alert for network errors, just log and show empty state
      if (type === 'nudge') {
        setLeaderboardData([]);
      } else {
        setStreakLeaderboard([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle leaderboard type change
  const handleLeaderboardTypeChange = (type) => {
    setLeaderboardType(type);
    fetchLeaderboard(type, selectedCategory);
  };

  // Handle category change
  const handleCategoryChange = (category) => {
    const newCategory = category === 'All' ? '' : category;
    setSelectedCategory(newCategory);
    if (leaderboardType === 'nudge') {
      fetchLeaderboard('nudge', newCategory);
    }
  };

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (leaderboardType === 'nudge') {
      await fetchLeaderboard('nudge', selectedCategory);
    } else {
      await fetchLeaderboard('streak', '');
    }
    setRefreshing(false);
  }, [leaderboardType, selectedCategory]);

  // Load data on screen focus
  useFocusEffect(
    useCallback(() => {
      // Load nudge leaderboard for current category
      fetchLeaderboard('nudge', selectedCategory);
      // Always load streak leaderboard
      fetchLeaderboard('streak', '');
    }, [selectedCategory])
  );

  // Render leaderboard item
  const renderLeaderboardItem = ({ item, index }) => {
    const isTop3 = index < 3;
    const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32']; // Gold, Silver, Bronze
    const rankIcons = ['emoji-events', 'emoji-events', 'emoji-events'];
    
    return (
      <View style={[
        styles.leaderboardItem,
        isTop3 && styles.leaderboardItemTop3
      ]}>
        <View style={[
          styles.leaderboardRank,
          isTop3 && { backgroundColor: rankColors[index] }
        ]}>
          {isTop3 ? (
            <MaterialIcons 
              name={rankIcons[index]} 
              size={20} 
              color="#fff" 
            />
          ) : (
            <Text style={styles.leaderboardRankText}>#{index + 1}</Text>
          )}
        </View>
        
        <View style={styles.leaderboardInfo}>
          <Text style={styles.leaderboardName}>
            {item.user_name || `User ${item.user_id}`}
          </Text>
          <Text style={styles.leaderboardStats}>
            {leaderboardType === 'nudge' 
              ? `${item.nudges} nudges in ${item.category}`
              : `${item.streak} day streak`
            }
          </Text>
          {leaderboardType === 'nudge' && item.last_nudge && (
            <Text style={styles.leaderboardLastActivity}>
              Last nudge: {new Date(item.last_nudge).toLocaleDateString()}
            </Text>
          )}
          {leaderboardType === 'streak' && item.last_posted && (
            <Text style={styles.leaderboardLastActivity}>
              Last posted: {new Date(item.last_posted).toLocaleDateString()}
            </Text>
          )}
        </View>
        
        <View style={styles.leaderboardBadge}>
          <MaterialIcons 
            name={leaderboardType === 'nudge' ? 'thumb-up' : 'local-fire-department'} 
            size={24} 
            color={isTop3 ? rankColors[index] : '#007bff'} 
          />
        </View>
      </View>
    );
  };

  const currentData = leaderboardType === 'nudge' ? leaderboardData : streakLeaderboard;

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
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={styles.headerRight} />
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
          <MaterialIcons name="thumb-up" size={16} color={leaderboardType === 'nudge' ? '#fff' : '#666'} />
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
          <MaterialIcons name="local-fire-department" size={16} color={leaderboardType === 'streak' ? '#fff' : '#666'} />
          <Text style={[
            styles.toggleButtonText,
            leaderboardType === 'streak' && styles.toggleButtonTextActive
          ]}>
            Streak Leaders
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter (only for nudge leaderboard) */}
      {leaderboardType === 'nudge' && (
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
                onPress={() => handleCategoryChange(category)}
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
      )}

      {/* Leaderboard List */}
      <View style={styles.leaderboardContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Loading leaderboard...</Text>
          </View>
        ) : (
          <FlatList
            data={currentData}
            renderItem={renderLeaderboardItem}
            keyExtractor={(item) => `${item.user_id}-${leaderboardType}`}
            contentContainerStyle={styles.leaderboardList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="leaderboard" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No data yet</Text>
                <Text style={styles.emptySubtext}>
                  {leaderboardType === 'nudge' 
                    ? 'Start nudging posts to see leaderboard data'
                    : 'Start posting daily to build your streak'
                  }
                </Text>
              </View>
            }
          />
        )}
      </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    width: 32, // To balance the back button
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#007bff',
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  toggleButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
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
  leaderboardContainer: {
    flex: 1,
  },
  leaderboardList: {
    padding: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leaderboardItemTop3: {
    borderWidth: 2,
    borderColor: '#ffd700',
  },
  leaderboardRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
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
    fontWeight: '600',
    color: '#333',
  },
  leaderboardStats: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  leaderboardLastActivity: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  leaderboardBadge: {
    padding: 8,
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
});

export default LeaderboardScreen;