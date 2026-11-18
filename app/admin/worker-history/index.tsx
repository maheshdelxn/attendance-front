import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { getCurrentMonthIST, getCurrentYearIST, formatDisplayDate, formatDisplayTime } from '../../utils/time';
import Skeleton from '../../../components/common/Skeleton';

export default function WorkerHistoryScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
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
        <View className="flex-1 bg-background">
            {/* Header with Safe Area Insets */}
            <View
                style={{ paddingTop: Math.max(insets.top + 12, 20) }}
                className="bg-white px-6 pb-4 shadow-sm border-b border-gray-200"
            >
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center border border-gray-200"
                    >
                        <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
                    </TouchableOpacity>
                    <View className="items-center flex-1 mx-2">
                        <Text className="text-secondary font-extrabold text-lg text-center" numberOfLines={1}>
                            {name || 'Worker Track'}
                        </Text>
                        <Text className="text-secondary/70 text-xs font-bold uppercase tracking-wider">{role || 'Worker'}</Text>
                    </View>
                    <View className="w-10" />
                </View>
            </View>

            <ScrollView
                className="flex-1 px-5"
                contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1A1A1A"]} />
                }
            >
                {/* Month Selector */}
                <View className="bg-white mt-5 p-4 rounded-2xl shadow-sm border border-gray-200 flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => handleMonthChange('prev')}
                        className="w-10 h-10 border border-blue-200 bg-blue-50 rounded-full items-center justify-center"
                    >
                        <Ionicons name="chevron-back" size={20} color="#2563EB" />
                    </TouchableOpacity>

                    <View className="items-center">
                        <Text className="text-secondary font-extrabold text-lg">{getMonthName(selectedMonth)}</Text>
                        <Text className="text-secondary/70 text-xs font-extrabold uppercase mt-0.5">{selectedYear}</Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => handleMonthChange('next')}
                        className="w-10 h-10 border border-blue-200 bg-blue-50 rounded-full items-center justify-center"
                    >
                        <Ionicons name="chevron-forward" size={20} color="#2563EB" />
                    </TouchableOpacity>
                </View>

                {/* History List */}
                <View className="mt-6 mb-10">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-secondary font-extrabold text-base">Monthly Attendance Log</Text>
                        <View className="bg-blue-100 px-2.5 py-0.5 rounded-full">
                            <Text className="text-blue-700 text-xs font-bold">{history.length} Days Logged</Text>
                        </View>
                    </View>

                    <View className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
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
                            <View className="p-12 items-center justify-center">
                                <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
                                <Text className="text-secondary/70 font-semibold text-sm mt-3 text-center">
                                    No attendance records for {getMonthName(selectedMonth)} {selectedYear}.
                                </Text>
                            </View>
                        ) : (
                            history.map((record: any, index: number) => (
                                <View
                                    key={record._id || index}
                                    className={`p-4 flex-row justify-between items-center ${index !== history.length - 1 ? 'border-b border-gray-100' : ''}`}
                                >
                                    <View className="flex-row items-center gap-3">
                                        <View className="bg-blue-50 w-10 h-10 rounded-full items-center justify-center border border-blue-100">
                                            <Ionicons name="calendar" size={18} color="#2563EB" />
                                        </View>
                                        <View>
                                            <Text className="text-secondary font-extrabold text-sm">
                                                {formatDisplayDate(record.date || record.checkInTime)}
                                            </Text>
                                            <Text className="text-secondary/70 text-xs font-semibold">
                                                {record.site?.name || 'Assigned Site'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-secondary font-extrabold text-sm">
                                            {formatDisplayTime(record.checkInTime)}
                                        </Text>
                                        <Text className="text-success text-[10px] font-extrabold uppercase">Punch-In</Text>
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
