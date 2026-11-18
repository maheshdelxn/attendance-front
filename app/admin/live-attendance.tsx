import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Modal, RefreshControl, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';

export default function LiveAttendance() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [selectedProof, setSelectedProof] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLogs = async () => {
        try {
            const data = await api.getAttendanceLogs();
            setLogs(data);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchLogs();
    };

    const renderLogItem = ({ item }: any) => (
        <View className="flex-row items-center mb-6">
            {/* Timeline Line */}
            <View className="items-center mr-4">
                <View className={`w-3 h-3 rounded-full ${item.status === 'PRESENT' ? 'bg-success' : 'bg-warning'}`} />
                <View className="w-0.5 h-full bg-gray-200 mt-1" />
            </View>

            {/* Card */}
            <View className="flex-1 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <View className="flex-row justify-between items-start mb-2">
                    <View>
                        <Text className="text-secondary font-bold text-base">{item.user?.name || 'Unknown Worker'}</Text>
                        <Text className="text-secondary/60 text-xs">{item.site?.name || 'Unknown Site'}</Text>
                    </View>
                    <View className={`px-2 py-1 rounded-md ${item.status === 'PRESENT' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                        <Text className={`text-[10px] font-bold ${item.status === 'PRESENT' ? 'text-success' : 'text-warning'}`}>
                            {item.status}
                        </Text>
                    </View>
                </View>

                <View className="flex-row justify-between items-center mt-2">
                    <View className="flex-row items-center gap-1">
                        <Ionicons name="time-outline" size={14} color="#666" />
                        <Text className="text-secondary/80 text-sm font-medium">
                            {new Date(item.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setSelectedProof(item)}
                        className="flex-row items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-200"
                    >
                        <Ionicons name="image-outline" size={12} color="#1A1A1A" />
                        <Text className="text-secondary text-xs">View Proof</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    return (
        <View className="flex-1 bg-background">
            {/* Header with Safe Area Insets */}
            <View
                style={{ paddingTop: Math.max(insets.top + 12, 20) }}
                className="bg-white px-6 pb-4 border-b border-gray-200 flex-row justify-between items-center z-10 shadow-sm"
            >
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center border border-gray-200"
                    >
                        <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
                    </TouchableOpacity>
                    <Text className="text-secondary text-2xl font-extrabold">Live Activity</Text>
                </View>
                <View className="flex-row items-center gap-1.5 bg-green-100 px-3 py-1 rounded-full border border-green-200">
                    <View className="w-2.5 h-2.5 bg-success rounded-full animate-pulse" />
                    <Text className="text-success text-xs font-extrabold">LIVE</Text>
                </View>
            </View>

            {/* Feed */}
            <FlatList
                data={logs}
                renderItem={renderLogItem}
                keyExtractor={item => item._id || item.id}
                contentContainerStyle={{
                    padding: 20,
                    paddingBottom: insets.bottom + 40,
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1A1A1A"]} />}
                ListHeaderComponent={
                    <Text className="text-secondary/70 text-xs font-extrabold uppercase mb-5 tracking-wider">
                        Today's Attendance Timeline • {dateStr}
                    </Text>
                }
                ListEmptyComponent={
                    loading ? null : (
                        <View className="items-center justify-center mt-20 p-8">
                            <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
                            <Text className="text-secondary/60 mt-3 font-semibold text-center">
                                No attendance records logged yet today.
                            </Text>
                        </View>
                    )
                }
            />

            {/* Proof Modal */}
            <Modal
                visible={!!selectedProof}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedProof(null)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setSelectedProof(null)}
                    className="flex-1 bg-black/85 items-center justify-center p-6"
                >
                    {selectedProof && (
                        <View
                            onStartShouldSetResponder={() => true}
                            className="bg-white p-5 rounded-3xl w-full max-w-sm shadow-2xl border border-gray-100"
                        >
                            <View className="flex-row justify-between items-start mb-4">
                                <View className="flex-1 mr-2">
                                    <Text className="text-secondary font-extrabold text-lg" numberOfLines={1}>
                                        {selectedProof.user?.name || 'Worker'}
                                    </Text>
                                    <Text className="text-secondary/70 text-xs font-semibold">
                                        {new Date(selectedProof.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {selectedProof.site?.name || 'On Site'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setSelectedProof(null)}
                                    className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                                >
                                    <Ionicons name="close" size={20} color="#1A1A1A" />
                                </TouchableOpacity>
                            </View>

                            <View
                                style={{ height: Math.min(Dimensions.get('window').height * 0.35, 260) }}
                                className="bg-gray-100 rounded-2xl items-center justify-center mb-4 overflow-hidden border border-gray-200"
                            >
                                {selectedProof.checkInPhoto ? (
                                    <Image
                                        source={{ uri: selectedProof.checkInPhoto }}
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View className="items-center">
                                        <Ionicons name="person" size={56} color="#9CA3AF" />
                                        <Text className="text-gray-500 text-xs font-semibold mt-2">No Photo Attached</Text>
                                    </View>
                                )}
                            </View>

                            <View className="flex-row items-center gap-2 bg-green-50 p-3 rounded-xl border border-green-200">
                                <Ionicons name="checkmark-circle" size={18} color="#00C853" />
                                <Text className="text-green-800 font-bold text-xs flex-1">
                                    Location Verified: Inside Geofence radius.
                                </Text>
                            </View>
                        </View>
                    )}
                </TouchableOpacity>
            </Modal>
        </View>
    );
}
