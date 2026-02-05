import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Modal, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

export default function LiveAttendance() {
    const router = useRouter();
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
            {/* Header */}
            <View className="bg-white px-6 pt-16 pb-4 border-b border-gray-100 flex-row justify-between items-center z-10">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
                        <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                    </TouchableOpacity>
                    <Text className="text-secondary text-2xl font-bold">Live Activity</Text>
                </View>
                <View className="flex-row items-center gap-1 bg-green-100 px-3 py-1 rounded-full">
                    <View className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    <Text className="text-success text-xs font-bold">Live</Text>
                </View>
            </View>

            {/* Feed */}
            <FlatList
                data={logs}
                renderItem={renderLogItem}
                keyExtractor={item => item._id}
                contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListHeaderComponent={
                    <Text className="text-secondary/40 text-xs font-bold uppercase mb-6 tracking-widest">Today, {dateStr}</Text>
                }
                ListEmptyComponent={
                    loading ? null : (
                        <View className="items-center justify-center mt-20">
                            <Ionicons name="calendar-outline" size={48} color="#CCC" />
                            <Text className="text-secondary/40 mt-2 font-medium">No activity recorded yet today.</Text>
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
                    className="flex-1 bg-black/90 items-center justify-center p-8"
                >
                    {selectedProof && (
                        <View className="bg-white p-4 rounded-2xl w-full">
                            <View className="flex-row justify-between items-center mb-4">
                                <View>
                                    <Text className="text-secondary font-bold text-lg">{selectedProof.user?.name}</Text>
                                    <Text className="text-secondary/60 text-xs">
                                        {new Date(selectedProof.checkInTime).toLocaleTimeString()} • {selectedProof.site?.name}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => setSelectedProof(null)}>
                                    <Ionicons name="close" size={24} color="#1A1A1A" />
                                </TouchableOpacity>
                            </View>

                            <View className="h-64 bg-gray-200 rounded-xl items-center justify-center mb-4 overflow-hidden">
                                {selectedProof.checkInPhoto ? (
                                    <Image source={{ uri: selectedProof.checkInPhoto }} className="w-full h-full" resizeMode="cover" />
                                ) : (
                                    <>
                                        <Ionicons name="person" size={64} color="#999" />
                                        <Text className="text-gray-400 text-xs mt-2">No Photo Available</Text>
                                    </>
                                )}
                            </View>

                            <View className="flex-row items-center gap-2 bg-green-50 p-3 rounded-lg border border-green-100">
                                <Ionicons name="checkmark-circle" size={20} color="green" />
                                <Text className="text-success font-medium text-sm">Location Verified: Inside Geofence range.</Text>
                            </View>
                        </View>
                    )}
                </TouchableOpacity>
            </Modal>
        </View>
    );
}
