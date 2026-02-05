import { Stack } from 'expo-router';

export default function AdminLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#F4F4F4' },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="sites" />
            <Stack.Screen name="workers" />
            <Stack.Screen name="live-attendance" />
            <Stack.Screen name="reports" />
        </Stack>
    );
}
