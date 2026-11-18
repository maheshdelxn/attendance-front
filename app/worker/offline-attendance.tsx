import React, { useState } from 'react';
import { View, Text, Alert, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../components/Button';

export default function OfflineAttendanceScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [isStored, setIsStored] = useState(false);

    // Late Logic
    const [isLate, setIsLate] = useState(false);
    const [lateReason, setLateReason] = useState('');

    React.useEffect(() => {
        const checkLateStatus = () => {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
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
            Alert.alert("Reason Required", "You are marking late. Please provide a reason to save locally.");
            return;
        }

        setIsStored(true);
        Alert.alert("Offline Punch Saved", "Your attendance has been saved locally on this device. It will automatically sync when connectivity is restored.");
    };

    return (
        <View className="flex-1 bg-background">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingBottom: insets.bottom + 32,
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Offline Header */}
                    <View
                        style={{ paddingTop: Math.max(insets.top + 12, 24) }}
                        className="bg-secondary pb-8 px-6 rounded-b-[40px] shadow-lg mb-6"
                    >
                        <View className="flex-row items-center justify-between mb-4">
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/20"
                            >
                                <Ionicons name="arrow-back" size={22} color="white" />
                            </TouchableOpacity>
                            <View className="bg-yellow-400/20 px-3 py-1 rounded-full border border-yellow-400/40">
                                <Text className="text-yellow-400 text-xs font-bold uppercase tracking-wider">Offline Mode</Text>
                            </View>
                            <View className="w-10" />
                        </View>

                        <View className="items-center">
                            <View className="w-16 h-16 bg-white/10 rounded-full items-center justify-center mb-3 border border-white/20">
                                <Ionicons name="cloud-offline-outline" size={36} color="#FFD700" />
                            </View>
                            <Text className="text-white text-2xl font-extrabold text-center">Offline Attendance</Text>
                            <Text className="text-white/80 text-center text-xs mt-1.5 px-4 font-medium leading-relaxed">
                                No internet connection detected. You can record your attendance locally on device.
                            </Text>
                        </View>
                    </View>

                    <View className="px-6 flex-1 justify-between">
                        <View>
                            {/* GPS Location Card */}
                            <View className="bg-white w-full p-5 rounded-2xl shadow-sm border border-gray-200 mb-6 items-center">
                                <Text className="text-secondary/70 text-xs font-bold uppercase tracking-wider mb-2">Device GPS Coordinates</Text>
                                <Text className="text-2xl font-extrabold text-secondary text-center mb-1">18.5204° N, 73.8567° E</Text>
                                <Text className="text-secondary/70 text-xs text-center font-semibold">(Estimated Accuracy: ±15m)</Text>

                                <View className="bg-yellow-50 p-3 rounded-xl mt-4 w-full border border-yellow-200">
                                    <Text className="text-yellow-800 text-xs text-center font-bold">
                                        ⚠️ Camera photo is disabled in offline mode. GPS and timestamp will sync upon network reconnect.
                                    </Text>
                                </View>
                            </View>

                            {/* Late Reason Input */}
                            {isLate && !isStored && (
                                <View className="w-full mb-6 bg-red-50 p-4 rounded-2xl border border-red-200">
                                    <View className="flex-row items-center gap-1.5 mb-1">
                                        <Ionicons name="alert-circle" size={18} color="#D50000" />
                                        <Text className="text-danger font-bold text-sm">Late Attendance Note</Text>
                                    </View>
                                    <Text className="text-secondary/70 text-xs font-medium mb-3">
                                        Current time is past 09:30 AM grace period. Please state reason:
                                    </Text>
                                    <TextInput
                                        placeholder="Reason for late check-in (e.g. traffic, transit delay)..."
                                        placeholderTextColor="#9CA3AF"
                                        value={lateReason}
                                        onChangeText={setLateReason}
                                        style={{ color: '#1A1A1A' }}
                                        className="bg-white border-2 border-gray-200 rounded-xl p-3 text-secondary font-semibold text-sm"
                                        multiline
                                        numberOfLines={2}
                                    />
                                </View>
                            )}
                        </View>

                        {/* Bottom Actions */}
                        <View className="pt-4">
                            {isStored ? (
                                <View className="w-full items-center">
                                    <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-3 border-2 border-green-300">
                                        <Ionicons name="checkmark" size={36} color="#00C853" />
                                    </View>
                                    <Text className="text-xl font-extrabold text-secondary mb-1">Record Saved Locally</Text>
                                    <Text className="text-secondary/70 text-xs text-center mb-6 font-medium">
                                        Attendance record saved on this phone. It will automatically upload to the server when connected.
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
                                    icon={<Ionicons name="save-outline" size={22} color="#1A1A1A" />}
                                />
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
