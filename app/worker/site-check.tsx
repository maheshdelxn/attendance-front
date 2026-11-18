import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Alert, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    const insets = useSafeAreaInsets();

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
            {/* Top Back Button Floating on Map */}
            <View
                style={{ top: Math.max(insets.top + 8, 16) }}
                className="absolute left-4 z-20 flex-row items-center"
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-11 h-11 bg-white rounded-full items-center justify-center shadow-lg border border-gray-200"
                >
                    <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
                </TouchableOpacity>
                <View className="ml-3 bg-white/95 px-3.5 py-1.5 rounded-full shadow-md border border-gray-100">
                    <Text className="text-secondary font-bold text-xs" numberOfLines={1}>{siteName}</Text>
                </View>
            </View>

            {/* Responsive Map Area */}
            <View style={{ height: Dimensions.get('window').height * 0.48 }}>
                <MapView
                    style={{ width: '100%', height: '100%' }}
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
                            <Ionicons name="construct" size={28} color="#D50000" />
                            <View className="bg-white px-2 py-0.5 rounded-md border border-gray-300 shadow-sm">
                                <Text className="text-[10px] font-extrabold text-secondary">{siteName}</Text>
                            </View>
                        </View>
                    </Marker>
                    <Circle
                        center={siteCoordinate}
                        radius={siteRadius}
                        fillColor={isWithinRange ? "rgba(0, 200, 83, 0.25)" : "rgba(213, 0, 0, 0.25)"}
                        strokeColor={isWithinRange ? "rgba(0, 200, 83, 0.9)" : "rgba(213, 0, 0, 0.9)"}
                        strokeWidth={2}
                    />
                </MapView>
            </View>

            {/* Bottom Status Panel with ScrollView for Complete Responsiveness */}
            <View className="flex-1 bg-white -mt-6 rounded-t-[32px] shadow-2xl border-t border-gray-100 overflow-hidden">
                <ScrollView
                    contentContainerStyle={{
                        paddingHorizontal: 24,
                        paddingTop: 24,
                        paddingBottom: insets.bottom + 24,
                        flexGrow: 1,
                        justifyContent: 'space-between',
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    <View>
                        {/* Status Row */}
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-secondary/70 font-bold uppercase tracking-wider text-xs">
                                Geofence Status
                            </Text>
                            {isWithinRange ? (
                                <View className="flex-row items-center bg-green-100 px-3 py-1 rounded-full border border-green-200">
                                    <Ionicons name="checkmark-circle" size={16} color="#00C853" />
                                    <Text className="text-success text-xs font-extrabold ml-1.5">In Site Range</Text>
                                </View>
                            ) : (
                                <View className="flex-row items-center bg-red-100 px-3 py-1 rounded-full border border-red-200">
                                    <Ionicons name="warning" size={16} color="#D50000" />
                                    <Text className="text-danger text-xs font-extrabold ml-1.5">Outside Boundary</Text>
                                </View>
                            )}
                        </View>

                        {/* Distance Meter */}
                        <View className="flex-row items-baseline gap-2 mb-2">
                            <Text className="text-4xl font-extrabold text-secondary tracking-tight">
                                {distance !== null ? Math.round(distance) : '---'}
                            </Text>
                            <Text className="text-base text-secondary/70 font-bold">meters from site center</Text>
                        </View>

                        <Text className="text-secondary/70 text-xs font-medium leading-relaxed mb-6">
                            You must be within <Text className="font-bold text-secondary">{siteRadius}m</Text> radius of <Text className="font-bold text-secondary">{siteName}</Text> to verify attendance.
                        </Text>
                    </View>

                    {/* Actions */}
                    <View className="pt-2">
                        <Button
                            title={isWithinRange ? "Take Selfie & Verify" : "Move Closer to Site"}
                            onPress={() => {
                                if (isWithinRange) {
                                    router.push({
                                        pathname: '/worker/camera',
                                        params: { siteId, siteName, lat: location.coords.latitude, long: location.coords.longitude }
                                    });
                                } else {
                                    Alert.alert("Access Denied", "You are outside the verified site geofence.");
                                }
                            }}
                            variant={isWithinRange ? "primary" : "secondary"}
                            disabled={!isWithinRange}
                            className={!isWithinRange ? "opacity-60" : ""}
                        />

                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="mt-3.5 py-2 items-center"
                        >
                            <Text className="text-secondary/70 font-bold text-sm">Cancel & Return</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}
