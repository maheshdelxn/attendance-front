import { Stack } from 'expo-router';

export default function WorkerLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#F4F4F4' },
                animation: 'slide_from_right', // Native stack animation
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="site-check" />
            <Stack.Screen name="camera" />
            <Stack.Screen name="success" />
        </Stack>
    );
}
