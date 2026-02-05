import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
    const router = useRouter();
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
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex-1 min-w-[45%]"
        >
            <View className={`w-10 h-10 rounded-full items-center justify-center mb-3 ${color}`}>
                <Ionicons name={icon} size={20} color="#1A1A1A" />
            </View>
            <Text className="text-secondary/60 text-xs font-bold uppercase mb-1">{title}</Text>
            <Text className="text-secondary text-2xl font-bold">{loading ? '-' : value}</Text>
        </TouchableOpacity>
    );

    const ActionButton = ({ title, icon, route }: any) => (
        <TouchableOpacity
            onPress={() => router.push(route)}
            className="flex-row items-center justify-between bg-white p-4 rounded-xl border border-gray-100 mb-3 active:bg-gray-50"
        >
            <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100">
                    <Ionicons name={icon} size={20} color="#1A1A1A" />
                </View>
                <Text className="text-secondary font-bold text-base">{title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Header */}
                <View className="bg-secondary pt-16 pb-8 px-6 rounded-b-[40px] shadow-xl mb-8">
                    <View className="flex-row justify-between items-center mb-6">
                        <View>
                            <Text className="text-white/60 text-sm font-medium uppercase tracking-wider">Headquarters</Text>
                            <Text className="text-white text-3xl font-bold">Overview</Text>
                        </View>
                        <View className="flex-row items-center gap-3">
                            <TouchableOpacity className="w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/20">
                                <Ionicons name="notifications" size={20} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleLogout}
                                className="w-10 h-10 bg-red-500/20 rounded-full items-center justify-center border border-red-500/30"
                            >
                                <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Daily Quick Stats */}
                    <View className="flex-row items-center justify-between bg-white/10 p-3 rounded-xl border border-white/5">
                        <View className="flex-row items-center gap-2">
                            <View className={`w-2 h-2 rounded-full animate-pulse ${stats.presentToday > 0 ? 'bg-success' : 'bg-gray-400'}`} />
                            <Text className="text-white/90 font-medium">{stats.presentToday} Workers present right now</Text>
                        </View>
                        {stats.pendingWorkers > 0 && (
                            <View className="bg-warning px-2 py-1 rounded-lg">
                                <Text className="text-secondary text-[10px] font-bold">{stats.pendingWorkers} NEW</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View className="px-6">
                    {/* Stats Grid */}
                    <Text className="text-secondary font-bold text-lg mb-4">Today's Statistics</Text>
                    <View className="flex-row gap-4 mb-4">
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
                    <View className="flex-row gap-4 mb-8">
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
                    <Text className="text-secondary font-bold text-lg mb-4">Management</Text>
                    <ActionButton title="Manage Sites" icon="map" route="/admin/sites" />
                    <TouchableOpacity
                        onPress={() => router.push('/admin/workers')}
                        className="flex-row items-center justify-between bg-white p-4 rounded-xl border border-gray-100 mb-3 active:bg-gray-50"
                    >
                        <View className="flex-row items-center gap-4">
                            <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100">
                                <Ionicons name="id-card" size={20} color="#1A1A1A" />
                            </View>
                            <View>
                                <Text className="text-secondary font-bold text-base">Worker Directory</Text>
                                {stats.pendingWorkers > 0 && (
                                    <Text className="text-warning text-xs font-bold">{stats.pendingWorkers} pending approvals</Text>
                                )}
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
                    </TouchableOpacity>
                    <ActionButton title="View Reports" icon="document-text" route="/admin/reports" />
                </View>
            </ScrollView>
        </View>
    );
}
