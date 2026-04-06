import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { api } from '../services/api';

export default function WorkerHome() {
    const router = useRouter();
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
        <View className="flex-1 bg-background pt-12">
            <ScrollView
                contentContainerStyle={{ padding: 24 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Header */}
                <View className="flex-row justify-between items-center mb-8">
                    <View>
                        <Text className="text-secondary text-lg font-bold">Hello, {user?.name || 'Worker'}</Text>
                        <Text className="text-secondary/60 text-sm">
                            {selectedSite ? `Site: ${selectedSite.name}` : 'Select a Site'}
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-3">
                        <TouchableOpacity onPress={onRefresh} className="w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-200">
                            <Ionicons name="refresh" size={20} color="#1A1A1A" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleLogout}
                            className="w-10 h-10 bg-red-50 rounded-full items-center justify-center border border-red-100"
                        >
                            <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Date Display */}
                <Text className="text-secondary/40 font-medium uppercase tracking-widest mb-2 text-xs">Today</Text>
                <Text className="text-secondary text-2xl font-bold mb-8">{date}</Text>

                {/* Status Card */}
                {status?.punchedIn && (
                    <View className="bg-green-100 p-4 rounded-xl border border-green-200 mb-8 flex-row items-center gap-4">
                        <View className="bg-green-500 w-10 h-10 rounded-full items-center justify-center">
                            <Ionicons name="checkmark" size={24} color="white" />
                        </View>
                        <View>
                            <Text className="text-success font-bold text-lg">Punched In</Text>
                            <Text className="text-secondary/60 text-sm">at {new Date(status.checkInTime).toLocaleTimeString()}</Text>
                        </View>
                    </View>
                )}

                {/* Site Selector */}
                <Text className="text-secondary font-bold text-lg mb-4">Select Work Site</Text>
                {loading ? (
                    <ActivityIndicator size="large" color="#FFD700" className="my-8" />
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
                        {sites.length > 0 ? (
                            sites.map((site) => (
                                <TouchableOpacity
                                    key={site._id}
                                    onPress={() => setSelectedSite(site)}
                                    className={`mr-4 p-4 rounded-2xl border ${selectedSite?._id === site._id ? 'bg-secondary border-secondary' : 'bg-white border-gray-100'} w-40`}
                                >
                                    <Text className={`font-bold ${selectedSite?._id === site._id ? 'text-primary' : 'text-secondary'}`}>{site.name}</Text>
                                    <Text className={`text-xs mt-1 ${selectedSite?._id === site._id ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Radius: {site.radius}m
                                    </Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text className="text-secondary/40">No sites available.</Text>
                        )}
                    </ScrollView>
                )}

                {/* Attendance History Section */}
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-secondary font-bold text-lg">Your Attendance Track</Text>
                    <View className="bg-blue-100 px-2 py-0.5 rounded-full">
                        <Text className="text-blue-600 text-[10px] font-bold uppercase">{history.length} Days</Text>
                    </View>
                </View>

                <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-12">
                    {history.length > 0 ? (
                        history.map((record: any, index: number) => (
                            <View
                                key={record._id}
                                className={`p-4 flex-row justify-between items-center ${index !== history.length - 1 ? 'border-b border-gray-50' : ''}`}
                            >
                                <View className="flex-row items-center gap-3">
                                    <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100">
                                        <Ionicons name="calendar-outline" size={18} color="#1A1A1A" />
                                    </View>
                                    <View>
                                        <Text className="text-secondary font-bold text-sm">
                                            {new Date(record.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                        </Text>
                                        <Text className="text-secondary/40 text-[10px]">{record.site?.name || 'Unknown Site'}</Text>
                                    </View>
                                </View>
                                <View className="items-end">
                                    <Text className="text-secondary font-bold text-sm">
                                        {new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                    <Text className="text-success text-[10px] font-bold uppercase">Punched In</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View className="p-8 items-center">
                            <Ionicons name="time-outline" size={32} color="#CCC" />
                            <Text className="text-secondary/40 text-xs mt-2 text-center">No attendance history found yet.</Text>
                        </View>
                    )}
                </View>

                {/* Main Action */}
                <View className="items-center mb-12">
                    <TouchableOpacity
                        onPress={handlePunchIn}
                        disabled={!selectedSite || !!status?.punchedIn}
                        className={`w-48 h-48 rounded-full items-center justify-center shadow-xl border-8 border-white ${(!selectedSite || !!status?.punchedIn) ? 'bg-gray-300' : 'bg-primary'}`}
                        style={{ shadowColor: (!selectedSite || !!status?.punchedIn) ? '#999' : '#FFD700', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 }}
                    >
                        {status?.punchedIn ? (
                            <Ionicons name="checkmark-done" size={48} color="#4CAF50" />
                        ) : (
                            <Ionicons name="finger-print" size={48} color={!selectedSite ? '#666' : '#1A1A1A'} />
                        )}
                        <Text className={`font-bold text-lg mt-2 uppercase ${(!selectedSite || !!status?.punchedIn) ? 'text-gray-500' : 'text-secondary'}`}>
                            {status?.punchedIn ? 'Punched In' : 'Mark In'}
                        </Text>
                    </TouchableOpacity>

                    {status?.punchedIn ? (
                        <Text className="text-success text-sm mt-6 font-bold text-center">
                            You've completed your attendance for today!
                        </Text>
                    ) : (
                        <Text className="text-secondary/60 text-sm mt-6 font-medium">
                            {selectedSite ? 'Tap to verify location & selfie' : 'Please select a site first'}
                        </Text>
                    )}
                </View>

            </ScrollView>
        </View>
    );
}
