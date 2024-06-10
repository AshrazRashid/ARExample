import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Text,
  Alert,
} from 'react-native';
import UnityView, {UnityModule} from 'react-native-unity-view';
import Geolocation from '@react-native-community/geolocation';

const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location for AR experience.',
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

const ARMarkerApp = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [targetLocation, setTargetLocation] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
  });

  useEffect(() => {
    requestLocationPermission();
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

  const calculatePosition = (userLocation, targetLocation) => {
    const distanceX =
      (targetLocation.longitude - userLocation.longitude) * 111000;
    const distanceZ =
      (targetLocation.latitude - userLocation.latitude) * 111000;
    return {x: distanceX, y: 0, z: -distanceZ};
  };

  const markerPosition = calculatePosition(userLocation, targetLocation);

  const handleMarkerClick = message => {
    Alert.alert('Marker Clicked', message);
  };

  useEffect(() => {
    // Send position data to Unity
    UnityModule.postMessageToUnityManager({
      name: 'SetMarkerPosition',
      data: JSON.stringify(markerPosition),
    });
  }, [markerPosition]);

  if (!userLocation) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={{flex: 1}}>
      <UnityView
        style={{flex: 1}}
        onUnityMessage={message => {
          if (message.name === 'OnMarkerClick') {
            handleMarkerClick(message.data);
          }
        }}
      />
    </View>
  );
};

export default ARMarkerApp;
