import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { logout } = useAuth();
    const [stats, setStats] = useState<any>({
        totalWorkers: 0,
        presentToday: 0,
        sitesActive: 0,
        pendingWorkers: 0
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            const data = await api.getDashboardStats();
            setStats(data);
        } catch (error) {
            // console.error(error); // Silent fail or show stale data
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchStats();
    }, []);

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                        router.replace('/auth/login');
                    }
                }
            ]
        );
    };

    const StatCard = ({ title, value, icon, color, onPress }: any) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex-1 min-w-[130px]"
        >
            <View className={`w-10 h-10 rounded-full items-center justify-center mb-2.5 ${color}`}>
                <Ionicons name={icon} size={20} color="#1A1A1A" />
            </View>
            <Text className="text-secondary/70 text-xs font-bold uppercase tracking-wider mb-1" numberOfLines={1}>{title}</Text>
            <Text className="text-secondary text-2xl font-extrabold">{loading ? '-' : value}</Text>
        </TouchableOpacity>
    );

    const ActionButton = ({ title, icon, route }: any) => (
        <TouchableOpacity
            onPress={() => router.push(route)}
            activeOpacity={0.8}
            className="flex-row items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 mb-3 shadow-sm active:bg-gray-50"
        >
            <View className="flex-row items-center gap-3.5">
                <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center border border-gray-200">
                    <Ionicons name={icon} size={20} color="#1A1A1A" />
                </View>
                <Text className="text-secondary font-bold text-base">{title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1A1A1A"]} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View
                    style={{ paddingTop: Math.max(insets.top + 16, 24) }}
                    className="bg-secondary pb-8 px-6 rounded-b-[40px] shadow-xl mb-6"
                >
                    <View className="flex-row justify-between items-center mb-6">
                        <View>
                            <Text className="text-white/70 text-xs font-bold uppercase tracking-wider">Headquarters</Text>
                            <Text className="text-white text-3xl font-extrabold">Overview</Text>
                        </View>
                        <View className="flex-row items-center gap-2.5">
                            <TouchableOpacity
                                onPress={() => router.push('/admin/live-attendance')}
                                className="px-3 py-2 bg-green-500/20 rounded-full items-center justify-center border border-green-500/40 flex-row gap-1.5"
                            >
                                <View className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                <Text className="text-green-300 font-extrabold text-xs">Live Feed</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleLogout}
                                className="w-10 h-10 bg-red-500/20 rounded-full items-center justify-center border border-red-500/40"
                            >
                                <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Daily Quick Stats Banner */}
                    <View className="flex-row items-center justify-between bg-white/10 p-3.5 rounded-2xl border border-white/10">
                        <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                            <View className={`w-2.5 h-2.5 rounded-full ${stats.presentToday > 0 ? 'bg-success' : 'bg-gray-400'}`} />
                            <Text className="text-white font-bold text-xs" numberOfLines={1}>
                                {stats.presentToday} Workers on site today
                            </Text>
                        </View>
                        {stats.pendingWorkers > 0 && (
                            <View className="bg-warning px-2.5 py-1 rounded-full">
                                <Text className="text-white text-[11px] font-extrabold">{stats.pendingWorkers} NEW</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View className="px-5">
                    {/* Stats Grid */}
                    <Text className="text-secondary font-extrabold text-lg mb-3">Today's Statistics</Text>
                    <View className="flex-row gap-3 mb-3">
                        <StatCard
                            title="Total Workers"
                            value={stats.totalWorkers}
                            icon="people"
                            color="bg-purple-100"
                            onPress={() => router.push('/admin/workers')}
                        />
                        <StatCard
                            title="Pending"
                            value={stats.pendingWorkers}
                            icon="person-add"
                            color="bg-yellow-100"
                            onPress={() => router.push('/admin/workers')}
                        />
                    </View>
                    <View className="flex-row gap-3 mb-6">
                        <StatCard
                            title="Present Today"
                            value={stats.presentToday}
                            icon="stats-chart"
                            color="bg-green-100"
                            onPress={() => router.push('/admin/reports')}
                        />
                        <StatCard
                            title="Active Sites"
                            value={stats.sitesActive}
                            icon="business"
                            color="bg-blue-100"
                            onPress={() => router.push('/admin/sites')}
                        />
                    </View>

                    {/* Quick Actions */}
                    <Text className="text-secondary font-extrabold text-lg mb-3">Management</Text>
                    <ActionButton title="Manage Construction Sites" icon="map" route="/admin/sites" />
                    
                    <TouchableOpacity
                        onPress={() => router.push('/admin/workers')}
                        activeOpacity={0.8}
                        className="flex-row items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 mb-3 shadow-sm active:bg-gray-50"
                    >
                        <View className="flex-row items-center gap-3.5">
                            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center border border-gray-200">
                                <Ionicons name="id-card" size={20} color="#1A1A1A" />
                            </View>
                            <View>
                                <Text className="text-secondary font-bold text-base">Worker Directory</Text>
                                {stats.pendingWorkers > 0 && (
                                    <Text className="text-danger text-xs font-bold">{stats.pendingWorkers} pending worker approvals</Text>
                                )}
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                    <ActionButton title="View Attendance Reports" icon="document-text" route="/admin/reports" />
                </View>
            </ScrollView>
        </View>
    );
}
