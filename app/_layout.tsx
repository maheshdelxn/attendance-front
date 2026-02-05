import '../global.css';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
    return (
        <AuthProvider>
            <SafeAreaProvider>
                <StatusBar style="dark" />
                <Stack
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: '#F4F4F4' }, // Concrete Gray
                    }}
                >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="auth/login" />
                    {/* Worker and Admin routes will be added later */}
                </Stack>
            </SafeAreaProvider>
        </AuthProvider>
    );
}
