import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert, Modal, ScrollView, ActivityIndicator, TextInput, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { api } from '../services/api';

export default function WorkerManagement() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [workers, setWorkers] = useState<any[]>([]);
    const [sites, setSites] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedWorker, setSelectedWorker] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'INACTIVE'>('ALL');

    // Edit Form State
    const [editStatus, setEditStatus] = useState('');
    const [editSiteId, setEditSiteId] = useState('');
    const [editWage, setEditWage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [workerHistory, setWorkerHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const fetchData = async () => {
        try {
            const [workersData, sitesData] = await Promise.all([
                api.getWorkers(),
                api.getSites()
            ]);
            setWorkers(workersData || []);
            setSites(sitesData || []);
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const filteredWorkers = (workers || []).filter(worker => {
        if (!worker) return false;
        const matchesSearch = (worker.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (worker.mobile || '').includes(searchQuery);
        const matchesStatus = filterStatus === 'ALL' || worker.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleEditWorker = async (worker: any) => {
        setSelectedWorker(worker);
        setEditStatus((worker.status || 'PENDING').toUpperCase());
        setEditSiteId(worker.assignedSite?._id || worker.assignedSite || '');
        setEditWage((worker.dailyWage || 0).toString());

        // Fetch specific worker history
        setLoadingHistory(true);
        try {
            const history = await api.getAttendanceHistory(worker._id || worker.id);
            setWorkerHistory(history || []);
        } catch (error) {
            console.error("Failed to load worker history:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleUpdateWorker = async () => {
        if (!selectedWorker) return;
        setIsSaving(true);
        try {
            const updatePayload = {
                status: editStatus,
                assignedSite: editSiteId || null,
                dailyWage: parseFloat(editWage) || 0
            };

            await api.updateWorker(selectedWorker._id || selectedWorker.id, updatePayload);

            Alert.alert("Success", "Worker updated successfully");
            setSelectedWorker(null);
            fetchData();
        } catch (error: any) {
            Alert.alert("Update Failed", error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const renderWorkerCard = ({ item }: any) => {
        const navigateToHistory = () => router.push({
            pathname: '/admin/worker-history',
            params: { id: item._id || item.id, name: item.name, role: item.role }
        });

        return (
            <View className="bg-white p-4 rounded-2xl border border-gray-100 mb-4 shadow-sm">
                {/* Main Content (History Link) */}
                <TouchableOpacity onPress={navigateToHistory} className="flex-row items-center gap-4">
                    <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center border border-gray-200">
                        <Text className="text-secondary font-bold text-lg">{item.name?.charAt(0)}</Text>
                    </View>

                    <View className="flex-1">
                        <View className="flex-row justify-between items-start">
                            <View>
                                <Text className="text-secondary font-bold text-base">{item.name}</Text>
                                <Text className="text-secondary/60 text-xs">{item.role} • {item.mobile}</Text>
                            </View>
                            <View className={`px-2.5 py-1 rounded-full ${item.status === 'ACTIVE' ? 'bg-green-100 border border-green-200' : (item.status === 'PENDING' ? 'bg-yellow-100 border border-yellow-200' : 'bg-red-100 border border-red-200')}`}>
                                <Text className={`text-[10px] font-extrabold ${item.status === 'ACTIVE' ? 'text-success' : (item.status === 'PENDING' ? 'text-amber-800' : 'text-danger')}`}>
                                    {item.status}
                                </Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Footer Row (Site Link + Edit Button) */}
                <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <TouchableOpacity onPress={navigateToHistory} className="flex-row items-center gap-1.5 bg-gray-100 px-2.5 py-1.5 rounded-lg border border-gray-200">
                        <Ionicons name="business" size={13} color="#4B5563" />
                        <Text className="text-secondary font-bold text-xs">
                            {item.assignedSite?.name || 'Unassigned Site'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => handleEditWorker(item)}
                        className="bg-primary px-3.5 py-1.5 rounded-full flex-row items-center gap-1.5 border border-primary/20 shadow-sm"
                    >
                        <Ionicons name="create-outline" size={14} color="#1A1A1A" />
                        <Text className="text-xs font-extrabold text-secondary">Edit / Approve</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-background">
            {/* Header with Safe Area Insets */}
            <View
                style={{ paddingTop: Math.max(insets.top + 12, 20) }}
                className="bg-white px-6 pb-4 border-b border-gray-200 flex-row justify-between items-center shadow-sm"
            >
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center border border-gray-200"
                    >
                        <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
                    </TouchableOpacity>
                    <Text className="text-secondary text-2xl font-extrabold">Workers</Text>
                </View>
                <TouchableOpacity
                    onPress={onRefresh}
                    className="w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-200 shadow-sm"
                >
                    <Ionicons name="refresh" size={20} color="#1A1A1A" />
                </TouchableOpacity>
            </View>

            {/* Search Bar & Filter Chips */}
            <View className="px-5 pt-4 pb-2">
                <Input
                    placeholder="Search worker by name or mobile..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    containerClassName="mb-3"
                />

                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                    {['ALL', 'PENDING', 'ACTIVE', 'INACTIVE'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            onPress={() => setFilterStatus(status as any)}
                            className={`px-4 py-2 rounded-full border mr-2 ${filterStatus === status ? 'bg-secondary border-secondary shadow-sm' : 'bg-white border-gray-200'}`}
                        >
                            <Text className={`font-bold text-xs ${filterStatus === status ? 'text-primary' : 'text-gray-700'}`}>
                                {status}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* List */}
            <FlatList
                data={filteredWorkers}
                renderItem={renderWorkerCard}
                keyExtractor={item => item._id || item.id}
                contentContainerStyle={{
                    padding: 20,
                    paddingBottom: insets.bottom + 40,
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1A1A1A"]} />}
                ListEmptyComponent={
                    <View className="items-center py-16">
                        {loading ? (
                            <ActivityIndicator size="large" color="#FFD700" />
                        ) : (
                            <View className="items-center">
                                <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                                <Text className="text-secondary/70 font-semibold text-sm mt-3">
                                    No workers match the selected criteria.
                                </Text>
                            </View>
                        )}
                    </View>
                }
            />

            {/* Edit / Approve Modal with Keyboard Avoiding View */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={!!selectedWorker}
                onRequestClose={() => setSelectedWorker(null)}
            >
                <View className="flex-1 justify-end bg-black/60">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        className="w-full max-h-[88%]"
                    >
                        <View className="bg-white rounded-t-[32px] p-6 shadow-2xl border-t border-gray-100">
                            {selectedWorker && (
                                <View>
                                    {/* Modal Header */}
                                    <View className="flex-row justify-between items-start mb-5">
                                        <View>
                                            <Text className="text-secondary text-2xl font-extrabold">Worker Review</Text>
                                            <Text className="text-secondary/70 font-semibold text-sm">{selectedWorker.name} • {selectedWorker.mobile}</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => setSelectedWorker(null)}
                                            className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                                        >
                                            <Ionicons name="close" size={20} color="#1A1A1A" />
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView
                                        showsVerticalScrollIndicator={false}
                                        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 32) }}
                                        keyboardShouldPersistTaps="handled"
                                    >
                                        {/* Status Approval Section */}
                                        <Text className="text-secondary font-bold text-xs uppercase tracking-wider mb-2">Account Authorization</Text>
                                        <View className="flex-row gap-2.5 mb-5">
                                            {['ACTIVE', 'PENDING', 'INACTIVE'].map((status) => (
                                                <TouchableOpacity
                                                    key={status}
                                                    onPress={() => setEditStatus(status)}
                                                    className={`flex-1 py-3 rounded-xl border items-center ${editStatus === status
                                                        ? 'bg-secondary border-secondary shadow-sm'
                                                        : 'bg-white border-gray-200'}`}
                                                >
                                                    <Text className={`font-bold text-xs ${editStatus === status ? 'text-primary' : 'text-gray-700'}`}>
                                                        {status}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>

                                        {/* Wage Section */}
                                        <Input
                                            label="Daily Wage (₹ INR)"
                                            placeholder="e.g. 600"
                                            keyboardType="numeric"
                                            value={editWage}
                                            onChangeText={setEditWage}
                                            containerClassName="mb-5"
                                        />

                                        {/* Site Assignment Section */}
                                        <Text className="text-secondary font-bold text-xs uppercase tracking-wider mb-2">Assign Primary Work Site</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                                            {sites.map((site) => (
                                                <TouchableOpacity
                                                    key={site._id || site.id}
                                                    onPress={() => setEditSiteId(site._id || site.id)}
                                                    className={`mr-3 p-3.5 rounded-xl border ${editSiteId === (site._id || site.id)
                                                        ? 'bg-secondary border-secondary shadow-sm'
                                                        : 'bg-white border-gray-200'
                                                        } min-w-[130px]`}
                                                >
                                                    <Text className={`font-bold text-sm ${editSiteId === (site._id || site.id) ? 'text-primary' : 'text-secondary'}`}>
                                                        {site.name}
                                                    </Text>
                                                    <Text className="text-xs text-gray-500 font-medium mt-1">
                                                        {site.location?.lat ? '✓ GPS Configured' : 'No Coordinates'}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>

                                        <Button
                                            title="Save Worker Profile"
                                            onPress={handleUpdateWorker}
                                            isLoading={isSaving}
                                        />
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
}
