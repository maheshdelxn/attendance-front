import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Modal, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { api } from '../services/api';

export default function SitesManagement() {
    const router = useRouter();
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
            {/* Header */}
            <View className="bg-white px-6 pt-16 pb-4 border-b border-gray-100 flex-row justify-between items-center">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
                        <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                    </TouchableOpacity>
                    <Text className="text-secondary text-2xl font-bold">Manage Sites</Text>
                </View>
                <TouchableOpacity
                    onPress={openAddModal}
                    className="w-10 h-10 bg-primary rounded-full items-center justify-center shadow-lg"
                >
                    <Ionicons name="add" size={24} color="#1A1A1A" />
                </TouchableOpacity>
            </View>

            {/* List */}
            <FlatList
                data={sites}
                renderItem={renderSiteCard}
                keyExtractor={item => item._id}
                contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View className="items-center py-10">
                        {loading ? (
                            <ActivityIndicator size="large" color="#FFD700" />
                        ) : (
                            <Text className="text-secondary/40 font-medium">No sites found.</Text>
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
                <View className="flex-1 justify-end bg-black/50">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="flex-1 justify-end"
                    >
                        <View className="bg-white rounded-t-[30px] p-8 h-[80%]">
                            <View className="flex-row justify-between items-center mb-8">
                                <Text className="text-secondary text-2xl font-bold">
                                    {isEditing ? 'Edit Site' : 'Add New Site'}
                                </Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Ionicons name="close-circle" size={30} color="#ccc" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 100 }}
                            >
                                <Input
                                    label="Site Name"
                                    placeholder="e.g. City Center Mall"
                                    value={siteName}
                                    onChangeText={setSiteName}
                                    containerClassName="mb-4"
                                />

                                <View className="flex-row gap-4">
                                    <View className="flex-1">
                                        <Input
                                            label="Latitude"
                                            placeholder="18.5204"
                                            keyboardType="numeric"
                                            value={siteLat}
                                            onChangeText={setSiteLat}
                                            containerClassName="mb-4"
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Input
                                            label="Longitude"
                                            placeholder="73.8567"
                                            keyboardType="numeric"
                                            value={siteLong}
                                            onChangeText={setSiteLong}
                                            containerClassName="mb-4"
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={handleGetCurrentLocation}
                                    className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200 flex-row items-center justify-center gap-2"
                                    disabled={isLocating}
                                >
                                    {isLocating ? (
                                        <ActivityIndicator size="small" color="#1A1A1A" />
                                    ) : (
                                        <Ionicons name="location" size={20} color="#FFD700" />
                                    )}
                                    <Text className="text-secondary font-bold">
                                        {isLocating ? 'Fetching...' : 'Get Current Location'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => setShowMapPicker(true)} className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200 flex-row items-center justify-center gap-2">
                                    <Ionicons name="map" size={20} color="#1A1A1A" />
                                    <Text className="text-secondary font-bold">Pick on Map</Text>
                                </TouchableOpacity>

                                <Input
                                    label="Geofence Radius (meters)"
                                    placeholder="e.g. 500"
                                    keyboardType="numeric"
                                    value={siteRadius}
                                    onChangeText={setSiteRadius}
                                    containerClassName="mb-4"
                                />

                                <View className="flex-row gap-4">
                                    <View className="flex-1">
                                        <Input
                                            label="Shift Start (HH:MM)"
                                            placeholder="09:00"
                                            value={shiftStart}
                                            onChangeText={setShiftStart}
                                            containerClassName="mb-4"
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Input
                                            label="Buffer (Mins)"
                                            placeholder="30"
                                            keyboardType="numeric"
                                            value={bufferProps}
                                            onChangeText={setBufferProps}
                                            containerClassName="mb-4"
                                        />
                                    </View>
                                </View>

                                <Button
                                    title={isEditing ? "Update Site" : "Create Site"}
                                    onPress={handleSaveSite}
                                    isLoading={isSaving}
                                    className="mb-8"
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
                    <View className="absolute top-10 left-4 z-10 w-full flex-row justify-between pr-8">
                        <TouchableOpacity onPress={() => setShowMapPicker(false)} className="bg-white p-2 rounded-full shadow-md">
                            <Ionicons name="close" size={24} color="#1A1A1A" />
                        </TouchableOpacity>
                        <View className="bg-white px-4 py-2 rounded-full shadow-md">
                            <Text className="font-bold text-secondary">Tap to Select Location</Text>
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
                                title="Selected Location"
                            />
                        )}
                    </MapView>

                    <View className="absolute bottom-10 w-full px-6">
                        <Button
                            title="Confirm Location"
                            onPress={confirmMapSelection}
                            disabled={!tempCoords}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}
