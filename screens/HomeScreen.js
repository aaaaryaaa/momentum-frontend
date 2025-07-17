// // screens/HomeScreen.js
// import React, { useEffect, useState } from 'react';
// import { useNavigation } from '@react-navigation/native';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   SafeAreaView,
//   ActivityIndicator,
//   Alert,
//   ScrollView,
//   Dimensions,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const { width } = Dimensions.get('window');

// export default function HomeScreen({ onLogout }) {
//   const navigation = useNavigation();
//   const [userInfo, setUserInfo] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const fetchUserInfo = async () => {
//     try {
//       const token = await AsyncStorage.getItem('token');
//       if (!token) {
//         Alert.alert('Session expired');
//         onLogout();
//         return;
//       }

//       const meResponse = await fetch('http://aarya.live:8000/me', {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const data = await meResponse.json();

//       if (meResponse.ok) {
//         setUserInfo(data);
//       } else {
//         Alert.alert('Error', data.message || 'Failed to fetch user');
//         onLogout();
//       }
//     } catch (e) {
//       console.log('Error fetching user info:', e);
//       onLogout();
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogout = async () => {
//     await AsyncStorage.removeItem('token');
//     onLogout();
//   };

//   useEffect(() => {
//     fetchUserInfo();
//   }, []);

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#007AFF" />
//           <Text style={styles.loadingText}>Loading...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView showsVerticalScrollIndicator={false}>
//         {/* Header */}
//         <View style={styles.header}>
//           <View style={styles.headerContent}>
//             <Text style={styles.welcomeText}>Welcome Back!</Text>
//             <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
//               <Text style={styles.logoutButtonText}>Logout</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* User Info Section */}
//         <View style={styles.userSection}>
//           <View style={styles.avatarContainer}>
//             <View style={styles.avatar}>
//               <Text style={styles.avatarText}>
//                 {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
//               </Text>
//             </View>
//           </View>
//           <Text style={styles.hiText}>
//             Hi {userInfo?.name || 'User'}! 👋
//           </Text>
//           <Text style={styles.emailText}>
//             {userInfo?.email || 'No email available'}
//           </Text>
//         </View>

//         {/* Quick Actions */}
//         <View style={styles.quickActionsContainer}>
//           <Text style={styles.sectionTitle}>Quick Actions</Text>
//           <View style={styles.actionButtonsContainer}>
//             <TouchableOpacity 
//               style={[styles.actionButton, styles.chatButton]} 
//               onPress={() => navigation.navigate('Chat')}
//             >
//               <View style={styles.actionButtonIcon}>
//                 <Text style={styles.actionButtonEmoji}>💬</Text>
//               </View>
//               <Text style={styles.actionButtonTitle}>Chat</Text>
//               <Text style={styles.actionButtonSubtitle}>Start a conversation</Text>
//             </TouchableOpacity>

//             <TouchableOpacity 
//               style={[styles.actionButton, styles.videoButton]} 
//               onPress={() => navigation.navigate('Video')}
//             >
//               <View style={styles.actionButtonIcon}>
//                 <Text style={styles.actionButtonEmoji}>🎥</Text>
//               </View>
//               <Text style={styles.actionButtonTitle}>Videos</Text>
//               <Text style={styles.actionButtonSubtitle}>Upload & manage videos</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Profile Card */}
//         <View style={styles.profileCard}>
//           <Text style={styles.cardTitle}>Your Profile</Text>
//           <View style={styles.profileInfo}>
//             <View style={styles.profileRow}>
//               <Text style={styles.profileLabel}>Name:</Text>
//               <Text style={styles.profileValue}>{userInfo?.name || 'Not set'}</Text>
//             </View>
//             <View style={styles.profileRow}>
//               <Text style={styles.profileLabel}>Email:</Text>
//               <Text style={styles.profileValue}>{userInfo?.email || 'Not set'}</Text>
//             </View>
//           </View>
//         </View>

//         {/* Coming Soon Card */}
//         <View style={styles.comingSoonCard}>
//           <Text style={styles.cardTitle}>Coming Soon</Text>
//           <View style={styles.featureList}>
//             <View style={styles.featureItem}>
//               <Text style={styles.featureEmoji}>📸</Text>
//               <Text style={styles.featureText}>Instagram-like Stories</Text>
//             </View>
//             <View style={styles.featureItem}>
//               <Text style={styles.featureEmoji}>🔔</Text>
//               <Text style={styles.featureText}>Push Notifications</Text>
//             </View>
//             <View style={styles.featureItem}>
//               <Text style={styles.featureEmoji}>👥</Text>
//               <Text style={styles.featureText}>Social Features</Text>
//             </View>
//             <View style={styles.featureItem}>
//               <Text style={styles.featureEmoji}>⚡</Text>
//               <Text style={styles.featureText}>Real-time Updates</Text>
//             </View>
//           </View>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#666',
//   },
//   header: {
//     backgroundColor: '#ffffff',
//     paddingTop: 10,
//     paddingBottom: 20,
//     borderBottomLeftRadius: 25,
//     borderBottomRightRadius: 25,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   headerContent: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   welcomeText: {
//     fontSize: 26,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//   },
//   logoutButton: {
//     backgroundColor: '#e74c3c',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     shadowColor: '#e74c3c',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   logoutButtonText: {
//     color: 'white',
//     fontWeight: '600',
//     fontSize: 14,
//   },
//   userSection: {
//     alignItems: 'center',
//     paddingVertical: 30,
//     paddingHorizontal: 20,
//   },
//   avatarContainer: {
//     marginBottom: 15,
//   },
//   avatar: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: '#3498db',
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#3498db',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   avatarText: {
//     fontSize: 32,
//     fontWeight: 'bold',
//     color: 'white',
//   },
//   hiText: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginBottom: 5,
//   },
//   emailText: {
//     fontSize: 16,
//     color: '#7f8c8d',
//   },
//   quickActionsContainer: {
//     paddingHorizontal: 20,
//     marginBottom: 25,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginBottom: 15,
//   },
//   actionButtonsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     gap: 15,
//   },
//   actionButton: {
//     flex: 1,
//     padding: 20,
//     borderRadius: 20,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   chatButton: {
//     backgroundColor: '#3498db',
//   },
//   videoButton: {
//     backgroundColor: '#e74c3c',
//   },
//   actionButtonIcon: {
//     marginBottom: 10,
//   },
//   actionButtonEmoji: {
//     fontSize: 32,
//   },
//   actionButtonTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: 'white',
//     marginBottom: 5,
//   },
//   actionButtonSubtitle: {
//     fontSize: 12,
//     color: 'rgba(255, 255, 255, 0.8)',
//     textAlign: 'center',
//   },
//   profileCard: {
//     backgroundColor: 'white',
//     marginHorizontal: 20,
//     marginBottom: 20,
//     padding: 20,
//     borderRadius: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   cardTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginBottom: 15,
//   },
//   profileInfo: {
//     gap: 10,
//   },
//   profileRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   profileLabel: {
//     fontSize: 14,
//     color: '#7f8c8d',
//     fontWeight: '500',
//   },
//   profileValue: {
//     fontSize: 14,
//     color: '#2c3e50',
//     fontWeight: '600',
//     flex: 1,
//     textAlign: 'right',
//   },
//   comingSoonCard: {
//     backgroundColor: '#ecf0f1',
//     marginHorizontal: 20,
//     marginBottom: 30,
//     padding: 20,
//     borderRadius: 20,
//     borderWidth: 2,
//     borderColor: '#bdc3c7',
//     borderStyle: 'dashed',
//   },
//   featureList: {
//     gap: 12,
//   },
//   featureItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   featureEmoji: {
//     fontSize: 20,
//   },
//   featureText: {
//     fontSize: 14,
//     color: '#7f8c8d',
//     flex: 1,
//   },
// });

import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function HomeScreen({ onLogout }) {
  const navigation = useNavigation();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userStreak, setUserStreak] = useState(null);
  const [userPostsNumber, setUserPostsNumber] = useState(0);
  const [userNudgesNumber, setUserNudgesNumber] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);

  const fetchUserInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Session expired');
        onLogout();
        return;
      }

      const meResponse = await fetch('http://aarya.live:8000/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await meResponse.json();

      if (meResponse.ok) {
        setUserInfo(data);
        await fetchUserStreak(token);
        await fetchUserPostsNumber(token);
        await fetchUserNudgesNumber(token);
        await fetchRecentActivity(token);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch user');
        onLogout();
      }
    } catch (e) {
      console.log('Error fetching user info:', e);
      onLogout();
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStreak = async (token) => {
    try {
      const response = await fetch('http://aarya.live:8082/streak', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUserStreak(data);
      }
    } catch (error) {
      console.log('Error fetching streak:', error);
    }
  };
  
  const fetchUserPostsNumber = async (token) => {
    try {
      const response = await fetch('http://aarya.live:8082/myposts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUserPostsNumber(data.length);
      }
    } catch (error) {
      console.log('Error fetching posts number:', error);
    }
  };
  
  const fetchUserNudgesNumber = async (token) => {
    try {
      const response = await fetch('http://aarya.live:8082/myposts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const totalNudges = data.reduce((sum, post) => sum + (post.nudges || 0), 0);
        setUserNudgesNumber(totalNudges);
      }
    } catch (error) {
      console.log('Error fetching nudges number:', error);
    }
  };

  const fetchRecentActivity = async (token) => {
    try {
      const response = await fetch('http://aarya.live:8082/feed?limit=3', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRecentActivity([data[0], data[1], data[2] ] || []);
      }
    } catch (error) {
      console.log('Error fetching recent activity:', error);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    onLogout();
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.profilePicture}>
                <Text style={styles.profileInitial}>
                  {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.welcomeText}>Welcome back!</Text>
                <Text style={styles.userName}>{userInfo?.name || 'User'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <MaterialIcons name="logout" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <MaterialIcons name="local-fire-department" size={24} color="#ff6b35" />
            <Text style={styles.statNumber}>{userStreak?.streak || 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialIcons name="thumb-up" size={24} color="#007bff" />
            <Text style={styles.statNumber}>{userNudgesNumber || 0}</Text>
            <Text style={styles.statLabel}>Total Nudges</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialIcons name="video-library" size={24} color="#28a745" />
            <Text style={styles.statNumber}>{userPostsNumber || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>

        {/* Main Action Buttons */}
        <View style={styles.mainActionsContainer}>
          <TouchableOpacity 
            style={[styles.mainActionButton, styles.feedButton]} 
            onPress={() => navigation.navigate('Feed')}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.actionButtonGradient}
            >
              <MaterialIcons name="dynamic-feed" size={28} color="#fff" />
              <Text style={styles.mainActionTitle}>Feed</Text>
              <Text style={styles.mainActionSubtitle}>See what's happening</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.mainActionButton, styles.postButton]} 
            onPress={() => navigation.navigate('Post')}
          >
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              style={styles.actionButtonGradient}
            >
              <MaterialIcons name="add-circle" size={28} color="#fff" />
              <Text style={styles.mainActionTitle}>Create Post</Text>
              <Text style={styles.mainActionSubtitle}>Share your journey</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Secondary Actions */}
        <View style={styles.secondaryActionsContainer}>
          <TouchableOpacity 
            style={styles.secondaryActionButton} 
            onPress={() => navigation.navigate('Chat')}
          >
            <View style={styles.secondaryActionIcon}>
              <MaterialIcons name="chat" size={24} color="#007bff" />
            </View>
            <Text style={styles.secondaryActionTitle}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryActionButton} 
            onPress={() => navigation.navigate('Video')}
          >
            <View style={styles.secondaryActionIcon}>
              <MaterialIcons name="video-library" size={24} color="#28a745" />
            </View>
            <Text style={styles.secondaryActionTitle}>Videos</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity 
            style={styles.secondaryActionButton} 
            onPress={() => navigation.navigate('Feed')}
          >
            <View style={styles.secondaryActionIcon}>
              <MaterialIcons name="leaderboard" size={24} color="#ffc107" />
            </View>
            <Text style={styles.secondaryActionTitle}>Leaderboard</Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            style={styles.secondaryActionButton} 
            onPress={() => navigation.navigate('Leaderboard')}
          >
            <View style={styles.secondaryActionIcon}>
              <MaterialIcons name="leaderboard" size={24} color="#ffc107" />
            </View>
            <Text style={styles.secondaryActionTitle}>Leaderboard</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <View style={styles.recentActivityContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Feed')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {recentActivity.map((post, index) => (
              <View key={post.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <MaterialIcons name="video-file" size={20} color="#007bff" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText} numberOfLines={2}>
                    {post.caption}
                  </Text>
                  <Text style={styles.activityMeta}>
                    {post.category} • {new Date(post.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.activityStats}>
                  <Text style={styles.activityStatText}>
                    {post.nudges || 0} nudges
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Profile Summary */}
        <View style={styles.profileSummaryCard}>
          <View style={styles.profileSummaryHeader}>
            <Text style={styles.profileSummaryTitle}>Your Profile</Text>
            <TouchableOpacity>
              <MaterialIcons name="edit" size={20} color="#007bff" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileSummaryContent}>
            <View style={styles.profileSummaryRow}>
              <MaterialIcons name="person" size={20} color="#666" />
              <Text style={styles.profileSummaryText}>
                {userInfo?.name || 'Not set'}
              </Text>
            </View>
            <View style={styles.profileSummaryRow}>
              <MaterialIcons name="email" size={20} color="#666" />
              <Text style={styles.profileSummaryText}>
                {userInfo?.email || 'Not set'}
              </Text>
            </View>
          </View>
        </View>

        {/* Motivational Quote */}
        <View style={styles.motivationalCard}>
          <LinearGradient
            colors={['#4facfe', '#00f2fe']}
            style={styles.motivationalGradient}
          >
            <MaterialIcons name="format-quote" size={24} color="#fff" />
            <Text style={styles.motivationalText}>
              "Every day is a new opportunity to improve yourself!"
            </Text>
            <Text style={styles.motivationalAuthor}>Keep pushing forward 🚀</Text>
          </LinearGradient>
        </View>

        {/* Coming Soon Features */}
        <View style={styles.comingSoonCard}>
          <Text style={styles.comingSoonTitle}>Coming Soon ✨</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <MaterialIcons name="camera-alt" size={20} color="#007bff" />
              <Text style={styles.featureText}>Stories</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="notifications" size={20} color="#28a745" />
              <Text style={styles.featureText}>Push Notifications</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="group" size={20} color="#ffc107" />
              <Text style={styles.featureText}>Groups</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="flash-on" size={20} color="#dc3545" />
              <Text style={styles.featureText}>Live Updates</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingTop: 40,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  headerTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e9ecef',
    marginHorizontal: 16,
  },
  mainActionsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  mainActionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  mainActionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
  },
  mainActionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  secondaryActionsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryActionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  recentActivityContainer: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
  activityItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  activityMeta: {
    fontSize: 12,
    color: '#666',
  },
  activityStats: {
    alignItems: 'flex-end',
  },
  activityStatText: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
  },
  profileSummaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  profileSummaryContent: {
    gap: 12,
  },
  profileSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileSummaryText: {
    fontSize: 14,
    color: '#666',
  },
  motivationalCard: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  motivationalGradient: {
    padding: 20,
    alignItems: 'center',
  },
  motivationalText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  motivationalAuthor: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  comingSoonCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 32,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  featureList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});