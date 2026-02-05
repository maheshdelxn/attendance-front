import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert, Modal, ScrollView, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { api } from '../services/api';

export default function WorkerManagement() {
    const router = useRouter();
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
        const matchesSearch = worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
                            <View className={`px-2 py-1 rounded-full ${item.status === 'ACTIVE' ? 'bg-green-100' : (item.status === 'PENDING' ? 'bg-yellow-100' : 'bg-red-100')}`}>
                                <Text className={`text-[10px] font-bold ${item.status === 'ACTIVE' ? 'text-success' : (item.status === 'PENDING' ? 'text-yellow-600' : 'text-danger')}`}>
                                    {item.status}
                                </Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Footer Row (Site Link + Edit Button) */}
                <View className="flex-row items-center justify-between mt-4">
                    <TouchableOpacity onPress={navigateToHistory} className="flex-row items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                        <Ionicons name="business-outline" size={12} color="#666" />
                        <Text className="text-secondary/60 text-xs font-medium">
                            {item.assignedSite?.name || 'Unassigned'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => handleEditWorker(item)}
                        className="bg-primary px-3 py-1.5 rounded-full flex-row items-center gap-1.5 border border-secondary/5"
                    >
                        <Ionicons name="create-outline" size={14} color="#1A1A1A" />
                        <Text className="text-xs font-bold text-secondary">Edit / Approve</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="bg-white px-6 pt-16 pb-4 border-b border-gray-100 flex-row justify-between items-center">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
                        <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                    </TouchableOpacity>
                    <Text className="text-secondary text-2xl font-bold">Workers</Text>
                </View>
                <TouchableOpacity onPress={onRefresh} className="w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-200">
                    <Ionicons name="refresh" size={20} color="#1A1A1A" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View className="px-6 pt-6 pb-2">
                <Input
                    label=""
                    placeholder="Search by name or mobile..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    containerClassName="mb-4"
                />

                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                    {['ALL', 'PENDING', 'ACTIVE', 'INACTIVE'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            onPress={() => setFilterStatus(status as any)}
                            className={`px-4 py-2 rounded-full border mr-2 ${filterStatus === status ? 'bg-secondary border-secondary' : 'bg-white border-gray-200'}`}
                        >
                            <Text className={`font-bold text-xs ${filterStatus === status ? 'text-white' : 'text-secondary/60'}`}>
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
                contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View className="items-center py-10">
                        {loading ? (
                            <ActivityIndicator size="large" color="#FFD700" />
                        ) : (
                            <Text className="text-secondary/40 font-medium">No workers found.</Text>
                        )}
                    </View>
                }
            />

            {/* Edit / Approve Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={!!selectedWorker}
                onRequestClose={() => setSelectedWorker(null)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-[30px] p-6 h-[75%]">
                        {selectedWorker && (
                            <View className="flex-1">
                                {/* Modal Header */}
                                <View className="flex-row justify-between items-start mb-6">
                                    <View>
                                        <Text className="text-secondary text-2xl font-bold">Edit Worker</Text>
                                        <Text className="text-secondary/60">{selectedWorker.name}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setSelectedWorker(null)}>
                                        <Ionicons name="close-circle" size={30} color="#ccc" />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

                                    {/* Status Section */}
                                    <Text className="text-secondary font-bold mb-2">Account Status</Text>
                                    <View className="flex-row gap-3 mb-6">
                                        {['ACTIVE', 'PENDING', 'INACTIVE'].map((status) => (
                                            <TouchableOpacity
                                                key={status}
                                                onPress={() => setEditStatus(status)}
                                                className={`flex-1 py-3 rounded-xl border items-center ${editStatus === status
                                                    ? 'bg-secondary border-secondary'
                                                    : 'bg-white border-gray-200'}`}
                                            >
                                                <Text className={`font-bold ${editStatus === status ? 'text-primary' : 'text-gray-500'}`}>
                                                    {status}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Wage Section */}
                                    <Input
                                        label="Daily Wage (₹)"
                                        placeholder="e.g. 500"
                                        keyboardType="numeric"
                                        value={editWage}
                                        onChangeText={setEditWage}
                                        containerClassName="mb-6"
                                    />

                                    {/* Site Assignment Section */}
                                    <Text className="text-secondary font-bold mb-2">Assign to Site</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
                                        {sites.map((site) => (
                                            <TouchableOpacity
                                                key={site._id}
                                                onPress={() => setEditSiteId(site._id)}
                                                className={`mr-3 p-4 rounded-xl border ${editSiteId === site._id
                                                    ? 'bg-secondary border-secondary'
                                                    : 'bg-white border-gray-200'
                                                    } min-w-[120px]`}
                                            >
                                                <Text className={`font-bold ${editSiteId === site._id ? 'text-primary' : 'text-secondary'}`}>
                                                    {site.name}
                                                </Text>
                                                <Text className="text-xs text-gray-400 mt-1">{site.location?.lat ? 'Mapped' : 'No Loc'}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>


                                    <Button
                                        title="Save Changes"
                                        onPress={handleUpdateWorker}
                                        isLoading={isSaving}
                                    />

                                </ScrollView>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}
