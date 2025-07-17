import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Video } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SplashVideoScreen = ({ navigation }) => {
  const video = useRef(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const userData = await AsyncStorage.getItem('userData');
      const isLoggedIn = !!userData;

      // Wait until the video finishes (or use setTimeout with same duration)
      setTimeout(() => {
        if (isLoggedIn) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      }, 4000); // Match your video duration (in ms)
    };

    checkLoginStatus();
  }, []);

  return (
    <View style={styles.container}>
      <Video
        ref={video}
        source={require('../assets/momentum-splash-video.mp4')}
        resizeMode="cover"
        shouldPlay
        isLooping={false}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

export default SplashVideoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
