import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Modal, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { api } from '../services/api';

export default function SitesManagement() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [sites, setSites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [siteName, setSiteName] = useState('');
    const [siteLat, setSiteLat] = useState('');
    const [siteLong, setSiteLong] = useState('');
    const [siteRadius, setSiteRadius] = useState('');
    const [shiftStart, setShiftStart] = useState('');
    const [bufferProps, setBufferProps] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Location Picker State
    const [isLocating, setIsLocating] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [mapRegion, setMapRegion] = useState({
        latitude: 18.5204,
        longitude: 73.8567,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });
    const [tempCoords, setTempCoords] = useState<{ lat: number, long: number } | null>(null);

    const fetchSites = async () => {
        try {
            const data = await api.getSites();
            setSites(data || []);
        } catch (error) {
            console.error("Failed to fetch sites:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSites();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchSites();
    };

    const handleGetCurrentLocation = async () => {
        setIsLocating(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied');
                setIsLocating(false);
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setSiteLat(location.coords.latitude.toString());
            setSiteLong(location.coords.longitude.toString());
            setMapRegion({
                ...mapRegion,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });
            Alert.alert("Success", "Current Location Fetched!");
        } catch (error) {
            Alert.alert("Error", "Could not fetch location.");
        } finally {
            setIsLocating(false);
        }
    };

    const handleMapPress = (e: MapPressEvent) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setTempCoords({ lat: latitude, long: longitude });
    };

    const confirmMapSelection = () => {
        if (tempCoords) {
            setSiteLat(tempCoords.lat.toString());
            setSiteLong(tempCoords.long.toString());
            setShowMapPicker(false);
        }
    };

    const resetForm = () => {
        setSiteName('');
        setSiteLat('');
        setSiteLong('');
        setSiteRadius('');
        setShiftStart('09:00');
        setBufferProps('30');
        setIsEditing(false);
        setEditingId(null);
    };

    const openAddModal = () => {
        resetForm();
        setModalVisible(true);
    };

    const openEditModal = (site: any) => {
        setSiteName(site.name);
        setSiteLat(site.location.lat.toString());
        setSiteLong(site.location.lng.toString());
        setSiteRadius(site.radius.toString());
        setShiftStart(site.shiftStartTime || '09:00');
        setBufferProps(site.buffer?.toString() || '30');
        setEditingId(site._id);
        setIsEditing(true);
        setModalVisible(true);
    };

    const handleSaveSite = async () => {
        const lat = parseFloat(siteLat);
        const lng = parseFloat(siteLong);
        const radius = parseInt(siteRadius);

        if (isNaN(lat) || isNaN(lng)) {
            Alert.alert("Error", "Latitude and Longitude must be valid numbers");
            return;
        }

        if (isNaN(radius)) {
            Alert.alert("Error", "Radius must be a valid number");
            return;
        }

        setIsSaving(true);
        try {
            const siteData = {
                name: siteName,
                lat: lat,
                lng: lng,
                radius: radius,
                shiftStart: shiftStart || '09:00',
                buffer: parseInt(bufferProps) || 30
            };

            if (isEditing && editingId) {
                await api.updateSite(editingId, siteData);
                Alert.alert("Success", "Site Updated");
            } else {
                await api.createSite(siteData);
                Alert.alert("Success", "New Site Added");
            }
            setModalVisible(false);
            fetchSites();
            resetForm();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSite = (id: string) => {
        Alert.alert(
            "Delete Site",
            "Are you sure you want to delete this site?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.deleteSite(id);
                            fetchSites();
                        } catch (error: any) {
                            Alert.alert("Error", error.message);
                        }
                    }
                }
            ]
        );
    };

    const renderSiteCard = ({ item }: any) => (
        <View className="bg-white p-4 rounded-2xl border border-gray-100 mb-4 shadow-sm">
            <View className="flex-row justify-between items-start mb-2">
                <View>
                    <Text className="text-secondary font-bold text-lg">{item.name}</Text>
                    <View className="flex-row items-center gap-1 mt-1">
                        <Ionicons name="location-outline" size={14} color="#666" />
                        <Text className="text-secondary/60 text-xs">
                            {`${item.location.lat}, ${item.location.lng}`}
                        </Text>
                    </View>
                </View>
                <View className="bg-green-100 px-2 py-1 rounded-full">
                    <Text className="text-xs font-bold text-success">Active</Text>
                </View>
            </View>

            <View className="flex-row justify-between items-center mt-2 pt-3 border-t border-gray-50">
                <View className="flex-row gap-4">
                    <View>
                        <Text className="text-secondary/40 text-[10px] font-bold uppercase">Radius</Text>
                        <Text className="text-secondary font-medium">{item.radius}m</Text>
                    </View>
                    <View>
                        <Text className="text-secondary/40 text-[10px] font-bold uppercase">Start</Text>
                        <Text className="text-secondary font-medium">{item.shiftStartTime || '09:00'}</Text>
                    </View>
                </View>

                <View className="flex-row gap-2">
                    <TouchableOpacity
                        onPress={() => openEditModal(item)}
                        className="bg-gray-50 p-2 rounded-full border border-gray-200"
                    >
                        <Ionicons name="create-outline" size={18} color="#1A1A1A" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleDeleteSite(item._id)}
                        className="bg-red-50 p-2 rounded-full border border-red-100"
                    >
                        <Ionicons name="trash-outline" size={18} color="#D50000" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

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
                    <Text className="text-secondary text-2xl font-extrabold">Manage Sites</Text>
                </View>
                <TouchableOpacity
                    onPress={openAddModal}
                    activeOpacity={0.8}
                    className="w-10 h-10 bg-primary rounded-full items-center justify-center shadow-md border border-primary/20"
                >
                    <Ionicons name="add" size={24} color="#1A1A1A" />
                </TouchableOpacity>
            </View>

            {/* List */}
            <FlatList
                data={sites}
                renderItem={renderSiteCard}
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
                                <Ionicons name="business-outline" size={48} color="#9CA3AF" />
                                <Text className="text-secondary/70 font-semibold text-sm mt-3">
                                    No construction sites added yet. Tap + above to create one.
                                </Text>
                            </View>
                        )}
                    </View>
                }
            />

            {/* Add/Edit Site Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/60">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        className="w-full max-h-[90%]"
                    >
                        <View className="bg-white rounded-t-[32px] p-6 shadow-2xl border-t border-gray-100">
                            <View className="flex-row justify-between items-center mb-5">
                                <Text className="text-secondary text-2xl font-extrabold">
                                    {isEditing ? 'Edit Construction Site' : 'Add New Site'}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setModalVisible(false)}
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
                                <Input
                                    label="Site Name"
                                    placeholder="e.g. City Center Mall - Phase 2"
                                    value={siteName}
                                    onChangeText={setSiteName}
                                    containerClassName="mb-3"
                                />

                                <View className="flex-row gap-3">
                                    <View className="flex-1">
                                        <Input
                                            label="Latitude"
                                            placeholder="e.g. 18.5204"
                                            keyboardType="numeric"
                                            value={siteLat}
                                            onChangeText={setSiteLat}
                                            containerClassName="mb-3"
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Input
                                            label="Longitude"
                                            placeholder="e.g. 73.8567"
                                            keyboardType="numeric"
                                            value={siteLong}
                                            onChangeText={setSiteLong}
                                            containerClassName="mb-3"
                                        />
                                    </View>
                                </View>

                                {/* Location Picker Buttons */}
                                <View className="flex-row gap-3 mb-3">
                                    <TouchableOpacity
                                        onPress={handleGetCurrentLocation}
                                        className="flex-1 bg-yellow-50 p-3.5 rounded-xl border border-yellow-200 flex-row items-center justify-center gap-1.5"
                                        disabled={isLocating}
                                    >
                                        {isLocating ? (
                                            <ActivityIndicator size="small" color="#1A1A1A" />
                                        ) : (
                                            <Ionicons name="locate" size={18} color="#1A1A1A" />
                                        )}
                                        <Text className="text-secondary font-bold text-xs">
                                            {isLocating ? 'Locating...' : 'Use My GPS'}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => setShowMapPicker(true)}
                                        className="flex-1 bg-gray-100 p-3.5 rounded-xl border border-gray-200 flex-row items-center justify-center gap-1.5"
                                    >
                                        <Ionicons name="map" size={18} color="#1A1A1A" />
                                        <Text className="text-secondary font-bold text-xs">Pick on Map</Text>
                                    </TouchableOpacity>
                                </View>

                                <Input
                                    label="Geofence Radius (meters)"
                                    placeholder="e.g. 150"
                                    keyboardType="numeric"
                                    value={siteRadius}
                                    onChangeText={setSiteRadius}
                                    containerClassName="mb-3"
                                />

                                <View className="flex-row gap-3 mb-2">
                                    <View className="flex-1">
                                        <Input
                                            label="Shift Start (HH:MM)"
                                            placeholder="09:00"
                                            value={shiftStart}
                                            onChangeText={setShiftStart}
                                            containerClassName="mb-3"
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Input
                                            label="Grace Buffer (Mins)"
                                            placeholder="30"
                                            keyboardType="numeric"
                                            value={bufferProps}
                                            onChangeText={setBufferProps}
                                            containerClassName="mb-3"
                                        />
                                    </View>
                                </View>

                                <Button
                                    title={isEditing ? "Update Site" : "Save Construction Site"}
                                    onPress={handleSaveSite}
                                    isLoading={isSaving}
                                    className="mt-2"
                                />
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* Map Picker Modal */}
            <Modal
                animationType="slide"
                transparent={false}
                visible={showMapPicker}
                onRequestClose={() => setShowMapPicker(false)}
            >
                <View className="flex-1 bg-white">
                    <View
                        style={{ top: Math.max(insets.top + 8, 16) }}
                        className="absolute left-4 right-4 z-10 flex-row justify-between items-center"
                    >
                        <TouchableOpacity
                            onPress={() => setShowMapPicker(false)}
                            className="bg-white w-10 h-10 rounded-full items-center justify-center shadow-lg border border-gray-200"
                        >
                            <Ionicons name="close" size={22} color="#1A1A1A" />
                        </TouchableOpacity>
                        <View className="bg-white/95 px-4 py-2 rounded-full shadow-lg border border-gray-200">
                            <Text className="font-extrabold text-secondary text-xs">Tap Map to Position Pin</Text>
                        </View>
                    </View>

                    <MapView
                        style={{ flex: 1 }}
                        initialRegion={mapRegion}
                        onPress={handleMapPress}
                    >
                        {(tempCoords || (siteLat && siteLong)) && (
                            <Marker
                                coordinate={tempCoords ? { latitude: tempCoords.lat, longitude: tempCoords.long } : { latitude: parseFloat(siteLat), longitude: parseFloat(siteLong) }}
                                title="Selected Site Pin"
                            />
                        )}
                    </MapView>

                    <View
                        style={{ bottom: Math.max(insets.bottom + 16, 24) }}
                        className="absolute w-full px-6"
                    >
                        <Button
                            title="Confirm Map Location"
                            onPress={confirmMapSelection}
                            disabled={!tempCoords}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}
