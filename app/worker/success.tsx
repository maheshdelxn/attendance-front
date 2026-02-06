import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import Button from '../../components/Button';

export default function PunchSuccessScreen() {
    const router = useRouter();
    const { siteName, date: dateParam, time } = useLocalSearchParams();
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        scale.value = withSpring(1, { damping: 12 });
        opacity.value = withDelay(500, withSpring(1));
    }, []);

    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const contentStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: withSpring(opacity.value * 1 ? 0 : 20) }],
    }));

    return (
        <View className="flex-1 bg-white items-center justify-center px-8">
            <Animated.View style={[iconStyle]} className="mb-8">
                <View className="w-32 h-32 bg-green-100 rounded-full items-center justify-center">
                    <Ionicons name="checkmark" size={64} color="#00C853" />
                </View>
            </Animated.View>

            <Animated.View style={[contentStyle]} className="items-center w-full">
                <Text className="text-3xl font-bold text-secondary mb-2 text-center">Punch In Successful!</Text>
                <Text className="text-secondary/60 text-lg mb-8 text-center">
                    Attendance marked for {siteName || 'Site'}
                </Text>

                <View className="bg-gray-50 w-full p-6 rounded-2xl mb-8 border border-gray-100">
                    <View className="flex-row justify-between mb-4">
                        <Text className="text-secondary/60">Time</Text>
                        <Text className="text-secondary font-bold">{time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-secondary/60">Date</Text>
                        <Text className="text-secondary font-bold">{dateParam || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    </View>
                </View>

                <Button
                    title="Back to Dashboard"
                    onPress={() => router.replace('/worker')}
                    className="w-full"
                />
            </Animated.View>
        </View>
    );
}
