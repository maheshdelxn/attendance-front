import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { api } from '../services/api';

export default function WorkerHome() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, logout } = useAuth();
    const [sites, setSites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedSite, setSelectedSite] = useState<any>(null);
    const [status, setStatus] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);

    const fetchData = async () => {
        try {
            const [sitesData, statusData, historyData] = await Promise.all([
                api.getSites(),
                user?.id ? api.getAttendanceStatus(user.id) : null,
                user?.id ? api.getAttendanceHistory(
                    user.id,
                    new Date().getMonth() + 1,
                    new Date().getFullYear()
                ) : []
            ]);
            setSites(sitesData || []);
            setStatus(statusData);
            setHistory(historyData || []);

            // Auto-select first site or site they already punched into
            if (statusData?.siteName) {
                const currentSite = (sitesData || []).find((s: any) => s.name === statusData.siteName);
                if (currentSite) setSelectedSite(currentSite);
            } else if (sitesData?.length > 0 && !selectedSite) {
                setSelectedSite(sitesData[0]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user?.id]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

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

    const date = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const handlePunchIn = () => {
        if (!selectedSite) {
            Alert.alert("No Site", "Please select a work site first.");
            return;
        }

        // Validate site location data before navigating
        if (!selectedSite.location?.lat || !selectedSite.location?.lng) {
            Alert.alert("Data Error", "This site's location is not properly configured. Please contact admin.");
            return;
        }

        router.push({
            pathname: '/worker/site-check',
            params: {
                siteId: selectedSite._id || selectedSite.id,
                siteName: selectedSite.name || 'Site',
                lat: selectedSite.location.lat.toString(),
                long: selectedSite.location.lng.toString(),
                radius: (selectedSite.radius || 100).toString()
            }
        });
    };

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                contentContainerStyle={{
                    paddingTop: Math.max(insets.top + 16, 24),
                    paddingBottom: insets.bottom + 40,
                    paddingHorizontal: 20,
                }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1A1A1A"]} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View className="flex-row justify-between items-center mb-6">
                    <View className="flex-1 mr-3">
                        <Text className="text-secondary text-xl font-extrabold" numberOfLines={1}>
                            Hello, {user?.name || 'Worker'}
                        </Text>
                        <Text className="text-secondary/70 text-xs font-semibold mt-0.5" numberOfLines={1}>
                            {selectedSite ? `Assigned: ${selectedSite.name}` : 'Select a Site Below'}
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                        {/* Offline Mode Shortcut */}
                        <TouchableOpacity
                            onPress={() => router.push('/worker/offline-attendance')}
                            className="px-2.5 py-2 bg-yellow-100 rounded-xl items-center justify-center border border-yellow-300 flex-row gap-1"
                        >
                            <Ionicons name="cloud-offline" size={16} color="#1A1A1A" />
                            <Text className="text-secondary font-bold text-[11px]">Offline</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onRefresh}
                            className="w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-200 shadow-sm"
                        >
                            <Ionicons name="refresh" size={18} color="#1A1A1A" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleLogout}
                            className="w-10 h-10 bg-red-50 rounded-full items-center justify-center border border-red-200"
                        >
                            <Ionicons name="log-out-outline" size={18} color="#D50000" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Date Display */}
                <View className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
                    <Text className="text-secondary/60 font-bold uppercase tracking-widest text-[11px] mb-1">Current Shift Date</Text>
                    <Text className="text-secondary text-xl font-extrabold">{date}</Text>
                </View>

                {/* Today Status Card */}
                {status?.punchedIn && (
                    <View className="bg-green-50 p-4 rounded-2xl border border-green-200 mb-6 flex-row items-center gap-3">
                        <View className="bg-green-600 w-10 h-10 rounded-full items-center justify-center">
                            <Ionicons name="checkmark" size={22} color="white" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-success font-extrabold text-base">Punched In Today</Text>
                            <Text className="text-secondary/80 text-xs font-semibold">
                                Checked in at {new Date(status.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Site Selector */}
                <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-secondary font-extrabold text-base">Select Work Site</Text>
                    <Text className="text-secondary/60 text-xs font-semibold">
                        {sites.length} {sites.length === 1 ? 'Site' : 'Sites'} Available
                    </Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#FFD700" className="my-6" />
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                        {sites.length > 0 ? (
                            sites.map((site) => {
                                const isSelected = selectedSite?._id === site._id || selectedSite?.id === site.id;
                                return (
                                    <TouchableOpacity
                                        key={site._id || site.id}
                                        onPress={() => setSelectedSite(site)}
                                        className={`mr-3 p-4 rounded-2xl border ${isSelected ? 'bg-secondary border-secondary shadow-md' : 'bg-white border-gray-200 shadow-sm'} w-44`}
                                    >
                                        <Text className={`font-bold text-base ${isSelected ? 'text-primary' : 'text-secondary'}`} numberOfLines={1}>
                                            {site.name}
                                        </Text>
                                        <View className="flex-row items-center gap-1 mt-1.5">
                                            <Ionicons name="locate-outline" size={12} color={isSelected ? '#FFD700' : '#4B5563'} />
                                            <Text className={`text-xs font-semibold ${isSelected ? 'text-gray-200' : 'text-gray-600'}`}>
                                                Radius: {site.radius || 100}m
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        ) : (
                            <View className="bg-white p-4 rounded-xl border border-gray-200 w-full">
                                <Text className="text-secondary/70 font-semibold text-sm">No construction sites assigned yet.</Text>
                            </View>
                        )}
                    </ScrollView>
                )}

                {/* Attendance History Section */}
                <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-secondary font-extrabold text-base">Your Recent Activity</Text>
                    <View className="bg-blue-100 px-2.5 py-0.5 rounded-full">
                        <Text className="text-blue-700 text-xs font-bold">{history.length} Punches</Text>
                    </View>
                </View>

                <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
                    {history.length > 0 ? (
                        history.slice(0, 5).map((record: any, index: number) => (
                            <View
                                key={record._id || index}
                                className={`p-4 flex-row justify-between items-center ${index !== Math.min(history.length, 5) - 1 ? 'border-b border-gray-100' : ''}`}
                            >
                                <View className="flex-row items-center gap-3">
                                    <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center border border-gray-200">
                                        <Ionicons name="calendar" size={16} color="#1A1A1A" />
                                    </View>
                                    <View>
                                        <Text className="text-secondary font-bold text-sm">
                                            {new Date(record.date || record.checkInTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                        </Text>
                                        <Text className="text-secondary/70 text-xs font-medium">{record.site?.name || 'On Site'}</Text>
                                    </View>
                                </View>
                                <View className="items-end">
                                    <Text className="text-secondary font-bold text-sm">
                                        {new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                    <Text className="text-success text-[10px] font-extrabold uppercase">Verified</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View className="p-8 items-center justify-center">
                            <Ionicons name="time-outline" size={32} color="#9CA3AF" />
                            <Text className="text-secondary/60 text-xs font-semibold mt-2 text-center">
                                No past attendance records found this month.
                            </Text>
                        </View>
                    )}
                </View>

                {/* Main Punch Action Button */}
                <View className="items-center pb-8">
                    <TouchableOpacity
                        onPress={handlePunchIn}
                        disabled={!selectedSite || !!status?.punchedIn}
                        activeOpacity={0.85}
                        className={`w-44 h-44 rounded-full items-center justify-center shadow-xl border-4 border-white ${(!selectedSite || !!status?.punchedIn) ? 'bg-gray-300' : 'bg-primary'}`}
                        style={{
                            shadowColor: (!selectedSite || !!status?.punchedIn) ? '#000' : '#FFD700',
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.25,
                            shadowRadius: 16,
                            elevation: 8,
                        }}
                    >
                        {status?.punchedIn ? (
                            <Ionicons name="checkmark-done" size={44} color="#00C853" />
                        ) : (
                            <Ionicons name="finger-print" size={44} color={!selectedSite ? '#4B5563' : '#1A1A1A'} />
                        )}
                        <Text className={`font-extrabold text-base mt-2 tracking-wider uppercase ${(!selectedSite || !!status?.punchedIn) ? 'text-gray-600' : 'text-secondary'}`}>
                            {status?.punchedIn ? 'Punched In' : 'Mark In'}
                        </Text>
                    </TouchableOpacity>

                    {status?.punchedIn ? (
                        <Text className="text-success text-sm mt-4 font-bold text-center">
                            ✓ Your attendance has been logged for today!
                        </Text>
                    ) : (
                        <Text className="text-secondary/70 text-xs mt-4 font-bold text-center">
                            {selectedSite ? `Selected: ${selectedSite.name} (Tap above to verify)` : '⚠️ Select a work site above to enable attendance'}
                        </Text>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
