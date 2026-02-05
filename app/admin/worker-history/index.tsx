import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';

export default function WorkerHistoryScreen() {
    const router = useRouter();
    const { id, name, role } = useLocalSearchParams();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHistory = async () => {
        try {
            const data = await api.getAttendanceHistory(id as string);
            setHistory(data || []);
        } catch (error) {
            console.error("Failed to fetch worker history:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [id]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="bg-white px-6 pt-16 pb-6 border-b border-gray-100 flex-row items-center gap-4">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
                >
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <View>
                    <Text className="text-secondary text-2xl font-bold">Attendance History</Text>
                    <Text className="text-secondary/60 text-xs font-bold uppercase tracking-widest">
                        {name || 'Worker'} • {role || 'Staff'}
                    </Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Summary Card */}
                <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 mb-8 items-center">
                    <Text className="text-secondary/40 text-[10px] font-bold uppercase tracking-widest mb-1">Total Days Present</Text>
                    <Text className="text-4xl font-extrabold text-secondary">{history.length}</Text>
                    <View className="bg-green-100 px-3 py-1 rounded-full mt-3">
                        <Text className="text-success text-[10px] font-bold uppercase">Record Verified</Text>
                    </View>
                </View>

                {/* History List */}
                <Text className="text-secondary font-bold text-lg mb-4">Detailed Track</Text>
                <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <View className="p-10 items-center">
                            <ActivityIndicator color="#FFD700" size="large" />
                        </View>
                    ) : history.length > 0 ? (
                        history.map((record: any, index: number) => (
                            <View
                                key={record._id}
                                className={`p-4 flex-row justify-between items-center ${index !== history.length - 1 ? 'border-b border-gray-50' : ''}`}
                            >
                                <View className="flex-row items-center gap-4">
                                    <View className="bg-blue-50 w-10 h-10 rounded-full items-center justify-center">
                                        <Ionicons name="calendar" size={18} color="#2563EB" />
                                    </View>
                                    <View>
                                        <Text className="text-secondary font-bold text-sm">
                                            {new Date(record.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </Text>
                                        <Text className="text-secondary/60 text-xs">
                                            {record.site?.name || 'Multiple Sites'}
                                        </Text>
                                    </View>
                                </View>
                                <View className="items-end">
                                    <Text className="text-secondary font-bold text-sm">
                                        {new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                    <Text className="text-success text-[10px] font-bold uppercase">Punch-in</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View className="p-10 items-center">
                            <Ionicons name="documents-outline" size={48} color="#CCC" />
                            <Text className="text-secondary/40 font-medium mt-2">No history recorded yet.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
