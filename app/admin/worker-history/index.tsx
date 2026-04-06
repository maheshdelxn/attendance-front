import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { getCurrentMonthIST, getCurrentYearIST, formatDisplayDate, formatDisplayTime } from '../../utils/time';
import Skeleton from '../../../components/common/Skeleton';

export default function WorkerHistoryScreen() {
    const router = useRouter();
    const { id, name, role } = useLocalSearchParams();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Default to current month/year (IST-aware)
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthIST());
    const [selectedYear, setSelectedYear] = useState(getCurrentYearIST());

    const fetchHistory = async (month = selectedMonth, year = selectedYear, isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const data = await api.getAttendanceHistory(id as string, month, year);
            setHistory(data);
        } catch (error) {
            console.error('Fetch history error:', error);
            // If network fails, api.getAttendanceHistory already handles returning cached data if available
            // but just in case we need to handle it here too.
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
        fetchHistory(selectedMonth, selectedYear, true);
    };

    const handleMonthChange = (direction: 'prev' | 'next') => {
        let newMonth = selectedMonth;
        let newYear = selectedYear;

        if (direction === 'prev') {
            if (newMonth === 1) {
                newMonth = 12;
                newYear--;
            } else {
                newMonth--;
            }
        } else {
            if (newMonth === 12) {
                newMonth = 1;
                newYear++;
            } else {
                newMonth++;
            }
        }

        setSelectedMonth(newMonth);
        setSelectedYear(newYear);
        fetchHistory(newMonth, newYear);
    };

    const getMonthName = (m: number) => {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[m - 1];
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-6 pt-14 pb-6 shadow-sm">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <View className="items-center">
                        <Text className="text-secondary font-bold text-lg">{name}</Text>
                        <Text className="text-secondary/60 text-xs font-medium uppercase tracking-wider">{role}</Text>
                    </View>
                    <View className="w-10" />
                </View>
            </View>

            <ScrollView
                className="flex-1 px-6"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FFD700"]} />
                }
            >
                {/* Month Selector */}
                <View className="bg-white mt-6 p-4 rounded-2xl shadow-sm border border-gray-100 flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => handleMonthChange('prev')} className="p-2 border border-blue-50 bg-blue-50/30 rounded-full">
                        <Ionicons name="chevron-back" size={20} color="#2563EB" />
                    </TouchableOpacity>

                    <View className="items-center">
                        <Text className="text-secondary font-bold text-base">{getMonthName(selectedMonth)}</Text>
                        <Text className="text-secondary/40 text-[10px] font-bold uppercase">{selectedYear}</Text>
                    </View>

                    <TouchableOpacity onPress={() => handleMonthChange('next')} className="p-2 border border-blue-50 bg-blue-50/30 rounded-full">
                        <Ionicons name="chevron-forward" size={20} color="#2563EB" />
                    </TouchableOpacity>
                </View>

                {/* History List */}
                <View className="mt-8 mb-10">
                    <Text className="text-secondary font-bold text-lg mb-4">Detailed Track</Text>
                    <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {loading && !refreshing ? (
                            <View className="p-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <View key={i} className="mb-4 bg-gray-50/50 p-4 rounded-xl flex-row justify-between items-center">
                                        <View className="flex-row items-center flex-1">
                                            <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
                                            <View>
                                                <Skeleton width={120} height={16} style={{ marginBottom: 6 }} />
                                                <Skeleton width={80} height={12} />
                                            </View>
                                        </View>
                                        <View className="items-end">
                                            <Skeleton width={60} height={16} style={{ marginBottom: 4 }} />
                                            <Skeleton width={40} height={10} />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : history.length === 0 ? (
                            <View className="p-10 items-center">
                                <Ionicons name="documents-outline" size={48} color="#CCC" />
                                <Text className="text-secondary/40 font-medium mt-2">No history recorded yet.</Text>
                            </View>
                        ) : (
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
                                                {formatDisplayDate(record.date)}
                                            </Text>
                                            <Text className="text-secondary/60 text-xs">
                                                {record.site?.name || 'Multiple Sites'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-secondary font-bold text-sm">
                                            {formatDisplayTime(record.checkInTime)}
                                        </Text>
                                        <Text className="text-success text-[10px] font-bold uppercase">Punch-in</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
