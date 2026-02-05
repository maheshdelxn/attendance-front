import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withDelay,
    withSequence,
    withTiming
} from 'react-native-reanimated';

export default function SplashScreen() {
    const router = useRouter();
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        // Logo Animation
        scale.value = withSpring(1, { damping: 10, stiffness: 100 });

        // Tagline Animation
        opacity.value = withDelay(500, withTiming(1, { duration: 1000 }));

        // Navigation
        const timer = setTimeout(() => {
            router.replace('/auth/login');
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    const logoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <View className="flex-1 items-center justify-center bg-primary">
            <Animated.View style={[logoStyle]} className="items-center mb-6">
                <View className="w-32 h-32 bg-secondary rounded-3xl items-center justify-center shadow-lg border-4 border-white">
                    <Text className="text-6xl">🏗️</Text>
                </View>
            </Animated.View>

            <Animated.View style={[textStyle]} className="items-center px-8">
                <Text className="text-4xl font-extrabold text-secondary text-center mb-2">BuildSafe</Text>
                <Text className="text-lg font-medium text-secondary/80 text-center">
                    Smart Attendance for Construction Sites
                </Text>
            </Animated.View>
        </View>
    );
}
