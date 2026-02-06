import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Alert, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';

// Haversine Formula for Distance
const getDistanceFromLatLonInM = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d * 1000; // Distance in meters
};

const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
};

export default function SiteCheckScreen() {
    const router = useRouter();

    // Get Site Details from Navigation Params
    const params = useLocalSearchParams();
    const siteId = params.siteId as string;
    const siteName = params.siteName as string;
    const siteLat = parseFloat(params.lat as string);
    const siteLong = parseFloat(params.long as string);
    const siteRadius = parseFloat(params.radius as string);

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [isWithinRange, setIsWithinRange] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const subscription = useRef<Location.LocationSubscription | null>(null);

    useEffect(() => {
        let isActive = true;

        (async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    if (isActive) {
                        setErrorMsg('Permission to access location was denied');
                        setIsLoading(false);
                    }
                    return;
                }

                // Check for NaN params and handle gracefully
                if (isNaN(siteLat) || isNaN(siteLong)) {
                    Alert.alert("Error", "Invalid site coordinates. Please contact admin.");
                    router.back();
                    return;
                }

                // Watch Position for Real-time updates
                subscription.current = await Location.watchPositionAsync({
                    accuracy: Location.Accuracy.Balanced, // Balanced is safer for some devices
                    timeInterval: 2000,
                    distanceInterval: 1,
                }, (newLoc) => {
                    if (!isActive) return;
                    setLocation(newLoc);
                    const dist = getDistanceFromLatLonInM(
                        newLoc.coords.latitude,
                        newLoc.coords.longitude,
                        siteLat,
                        siteLong
                    );
                    setDistance(dist);
                    setIsWithinRange(dist <= siteRadius);
                    setIsLoading(false);
                });
            } catch (err) {
                console.error("Location error:", err);
                if (isActive) {
                    Alert.alert("GPS Error", "Failed to get your location. Please check your GPS settings.");
                    setIsLoading(false);
                }
            }
        })();

        return () => {
            isActive = false;
            if (subscription.current) {
                subscription.current.remove();
            }
        };
    }, []);

    if (isLoading || !location) {
        return (
            <View className="flex-1 items-center justify-center bg-primary">
                <ActivityIndicator size="large" color="#1A1A1A" />
                <Text className="text-secondary font-bold mt-4">Locating GPS...</Text>
            </View>
        );
    }

    // Site Center Coordinate
    const siteCoordinate = {
        latitude: siteLat,
        longitude: siteLong,
    };

    return (
        <View className="flex-1 bg-white">
            {/* Map Area */}
            <MapView
                style={{ width: Dimensions.get('window').width, height: '65%' }}
                initialRegion={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }}
                showsUserLocation={true}
                followsUserLocation={true}
            >
                {/* Site Marker & Geo-fence */}
                <Marker
                    coordinate={siteCoordinate}
                    title={siteName}
                    description={`Radius: ${siteRadius}m`}
                >
                    <View className="items-center">
                        <Ionicons name="construct" size={30} color="#D50000" />
                        <View className="bg-white px-2 rounded-md border border-gray-300">
                            <Text className="text-xs font-bold">{siteName}</Text>
                        </View>
                    </View>
                </Marker>
                <Circle
                    center={siteCoordinate}
                    radius={siteRadius}
                    fillColor={isWithinRange ? "rgba(76, 175, 80, 0.2)" : "rgba(211, 47, 47, 0.2)"} // Green if in range, Red if out
                    strokeColor={isWithinRange ? "rgba(76, 175, 80, 0.8)" : "rgba(211, 47, 47, 0.8)"}
                    strokeWidth={2}
                />
            </MapView>

            {/* Bottom Status Panel */}
            <View className="flex-1 bg-white -mt-6 rounded-t-[30px] px-8 pt-8 shadow-2xl">
                <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-secondary/50 font-bold uppercase tracking-widest text-xs">Distance to Site</Text>
                    {isWithinRange ? (
                        <View className="flex-row items-center bg-green-100 px-3 py-1 rounded-full">
                            <Ionicons name="checkmark-circle" size={16} color="green" />
                            <Text className="text-success text-xs font-bold ml-1">In Range</Text>
                        </View>
                    ) : (
                        <View className="flex-row items-center bg-red-100 px-3 py-1 rounded-full">
                            <Ionicons name="warning" size={16} color="red" />
                            <Text className="text-danger text-xs font-bold ml-1">Too Far</Text>
                        </View>
                    )}
                </View>

                <Text className="text-4xl font-extrabold text-secondary mb-1">
                    {distance ? Math.round(distance) : '---'} <Text className="text-lg text-secondary/60">meters</Text>
                </Text>
                <Text className="text-secondary/60 font-medium mb-8">
                    You must be within {siteRadius}m of <Text className="font-bold text-secondary">{siteName}</Text> to mark attendance.
                </Text>

                <Button
                    title={isWithinRange ? "Take Selfie & Verify" : "Move Closer to Site"}
                    onPress={() => {
                        if (isWithinRange) {
                            Alert.alert("Success", "Location Verified! Opening Camera...");
                            router.push({
                                pathname: '/worker/camera',
                                params: { siteId, siteName, lat: location.coords.latitude, long: location.coords.longitude }
                            });
                        } else {
                            Alert.alert("Access Denied", "You are too far from the site location.");
                        }
                    }}
                    variant={isWithinRange ? "primary" : "secondary"}
                    disabled={!isWithinRange}
                    className={!isWithinRange ? "opacity-50" : ""}
                />

                {!isWithinRange && (
                    <TouchableOpacity onPress={() => router.back()} className="mt-4 items-center">
                        <Text className="text-secondary/50 font-medium">Cancel</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}
