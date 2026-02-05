import React, { useState } from 'react';
import { View, Text, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';

export default function OfflineAttendanceScreen() {
    const router = useRouter();
    const [isStored, setIsStored] = useState(false);

    // Late Logic
    const [isLate, setIsLate] = useState(false);
    const [lateReason, setLateReason] = useState('');

    React.useEffect(() => {
        const checkLateStatus = () => {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            // Mock: Shift 09:00 + 30m Buffer = 09:30 Limit
            const limitHour = 9;
            const limitMinute = 30;

            if (currentHour > limitHour || (currentHour === limitHour && currentMinute > limitMinute)) {
                setIsLate(true);
            }
        };
        checkLateStatus();
    }, []);

    const handleOfflinePunch = () => {
        if (isLate && !lateReason.trim()) {
            Alert.alert("Reason Required", "You are late today. Please provide a reason to save locally.");
            return;
        }

        // Simulate Local Storage
        setIsStored(true);
        Alert.alert("Offline Punch Saved", "Your attendance has been saved locally. It will automatically sync when you are back online.");
    };

    return (
        <View className="flex-1 bg-background">
            {/* Offline Header */}
            <View className="bg-secondary pt-16 pb-8 px-6 rounded-b-[40px] mb-8 items-center">
                <Ionicons name="cloud-offline-outline" size={48} color="#FFD700" />
                <Text className="text-white text-2xl font-bold mt-4">Offline Mode</Text>
                <Text className="text-white/60 text-center mt-2 px-8">
                    No internet connection detected. You can still mark your attendance.
                </Text>
            </View>

            <View className="px-8 items-center">
                <View className="bg-white w-full p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 items-center">
                    <Text className="text-secondary/60 text-sm font-bold uppercase tracking-widest mb-4">Current Location</Text>
                    {/* In offline mode, we might just get basic GPS coordinates or last known location */}
                    <Text className="text-2xl font-bold text-secondary text-center mb-1">GPS: 18.52, 73.85</Text>
                    <Text className="text-secondary/40 text-xs text-center">(Accuracy: ±20m)</Text>

                    <View className="bg-yellow-50 px-4 py-2 rounded-lg mt-6 w-full">
                        <Text className="text-warning text-xs text-center">
                            ⚠️ Photo upload is disabled in offline mode. Location data will be synced later.
                        </Text>
                    </View>
                </View>

                {isLate && !isStored && (
                    <View className="w-full mb-6 bg-red-100 p-4 rounded-xl border border-red-200">
                        <Text className="text-danger font-bold mb-1">⚠️ You are Late (Offline)</Text>
                        <Text className="text-secondary/60 text-xs mb-3">
                            Shift started at 09:00. Buffer ended at 09:30.
                        </Text>
                        <TextInput
                            placeholder="Reason for being late..."
                            value={lateReason}
                            onChangeText={setLateReason}
                            className="bg-white border border-gray-300 rounded-lg p-3 text-secondary"
                        />
                    </View>
                )}

                {isStored ? (
                    <View className="w-full items-center">
                        <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
                            <Ionicons name="checkmark" size={40} color="#00C853" />
                        </View>
                        <Text className="text-xl font-bold text-secondary mb-2">Saved Locally</Text>
                        <Text className="text-secondary/60 text-center mb-6">
                            We will upload this data as soon as internet is restored.
                        </Text>
                        <Button
                            title="Back to Dashboard"
                            variant="outline"
                            onPress={() => router.back()}
                            className="w-full"
                        />
                    </View>
                ) : (
                    <Button
                        title="Mark Attendance (Offline)"
                        onPress={handleOfflinePunch}
                        className="w-full"
                        icon={<Ionicons name="save-outline" size={24} color="#1A1A1A" />}
                    />
                )}
            </View>
        </View>
    );
}
