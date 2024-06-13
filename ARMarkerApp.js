import React, {useState, useEffect} from 'react';
import {View, Text, Alert, PermissionsAndroid, Platform} from 'react-native';
import UnityView, {UnityModule} from 'react-native-unity-view';
import Geolocation from '@react-native-community/geolocation';

const ARMarkerApp = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [targetLocation, setTargetLocation] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
  });

  // Function to request location permission on Android
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message:
              'This app needs access to your location for AR experience.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('You can use the location');
        } else {
          console.log('Location permission denied');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  // Fetch current user location
  useEffect(() => {
    requestLocationPermission(); // Request location permission on mount
    Geolocation.getCurrentPosition(
      position => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      error => console.log(error),
      {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000},
    );
  }, []);

  // Calculate marker position relative to user location
  const calculatePosition = (userLocation, targetLocation) => {
    if (!userLocation || !targetLocation) return {x: 0, y: 0, z: 0};

    const distanceX =
      (targetLocation.longitude - userLocation.longitude) * 111000;
    const distanceZ =
      (targetLocation.latitude - userLocation.latitude) * 111000;
    return {x: distanceX, y: 0, z: -distanceZ}; // Unity coordinates (x, y, z)
  };

  // Calculate marker position based on user and target locations
  const markerPosition = calculatePosition(userLocation, targetLocation);

  // Handle marker click event
  const handleMarkerClick = message => {
    Alert.alert('Marker Clicked', message);
  };

  // Send updated marker position to Unity whenever it changes
  useEffect(() => {
    UnityModule.postMessageToUnityManager({
      name: 'SetMarkerPosition',
      data: JSON.stringify(markerPosition),
    });
  }, [markerPosition]);

  // If user location is not available yet, show loading message
  if (!userLocation) {
    return <Text>Loading...</Text>;
  }

  // Render UnityView component to display AR content
  return (
    <View style={{flex: 1}}>
      <UnityView
        style={{flex: 1}}
        onUnityMessage={message => {
          if (message.name === 'OnMarkerClick') {
            handleMarkerClick(message.data); // Handle marker click events from Unity
          }
        }}
      />
    </View>
  );
};

export default ARMarkerApp;
