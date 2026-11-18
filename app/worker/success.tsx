import React, { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import Button from '../../components/Button';

export default function PunchSuccessScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { siteName, date: dateParam, time } = useLocalSearchParams();
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        scale.value = withSpring(1, { damping: 12 });
        opacity.value = withDelay(400, withSpring(1));
    }, []);

    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const contentStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: withSpring(opacity.value * 1 ? 0 : 20) }],
    }));

    return (
        <View className="flex-1 bg-white">
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 24,
                    paddingTop: Math.max(insets.top + 20, 32),
                    paddingBottom: Math.max(insets.bottom + 24, 32),
                }}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={[iconStyle]} className="mb-6">
                    <View className="w-28 h-28 bg-green-100 rounded-full items-center justify-center border-4 border-green-200 shadow-md">
                        <Ionicons name="checkmark" size={56} color="#00C853" />
                    </View>
                </Animated.View>

                <Animated.View style={[contentStyle]} className="items-center w-full max-w-sm">
                    <Text className="text-3xl font-extrabold text-secondary mb-2 text-center">Punch In Successful!</Text>
                    <Text className="text-secondary/70 text-base font-medium mb-6 text-center">
                        Verified at <Text className="font-bold text-secondary">{siteName || 'Construction Site'}</Text>
                    </Text>

                    <View className="bg-gray-50 w-full p-5 rounded-2xl mb-8 border border-gray-200 shadow-sm">
                        <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                            <Text className="text-secondary/70 font-semibold text-sm">Time Logged</Text>
                            <Text className="text-secondary font-extrabold text-base">
                                {time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                        <View className="flex-row justify-between items-center py-2">
                            <Text className="text-secondary/70 font-semibold text-sm">Date</Text>
                            <Text className="text-secondary font-extrabold text-base">
                                {dateParam || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Text>
                        </View>
                    </View>

                    <Button
                        title="Back to Dashboard"
                        onPress={() => router.replace('/worker')}
                        className="w-full"
                    />
                </Animated.View>
            </ScrollView>
        </View>
    );
}
