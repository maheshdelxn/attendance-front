import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput } from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import { api } from '../services/api';
import { useAuth } from '../../context/AuthContext';

export default function CameraScreen() {
    const router = useRouter();
    const { user } = useAuth();

    // Params from Site Check
    const params = useLocalSearchParams();
    const siteId = params.siteId as string;
    const siteName = params.siteName as string;
    const lat = params.lat as string;
    const long = params.long as string;

    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<CameraType>('front');
    const [photo, setPhoto] = useState<string | null>(null);
    const cameraRef = useRef<CameraView>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Late Logic
    const [isLate, setIsLate] = useState(false);

    useEffect(() => {
        const checkLateStatus = () => {
            const now = new Date();
            const currentHour = now.getHours();
            // Assuming 9:30 AM is late
            if (currentHour > 9 || (currentHour === 9 && now.getMinutes() > 30)) {
                setIsLate(true);
            }
        };
        checkLateStatus();
    }, []);

    if (!permission) return <View className="flex-1 bg-black" />;

    if (!permission.granted) {
        return (
            <View className="flex-1 items-center justify-center bg-background px-8">
                <Ionicons name="camera-outline" size={64} color="#1A1A1A" />
                <Text className="text-secondary text-xl font-bold mt-4 text-center">Camera Access Needed</Text>
                <Button title="Grant Permission" onPress={requestPermission} />
            </View>
        );
    }

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photoData = await cameraRef.current.takePictureAsync({
                    quality: 0.5,
                    base64: false,
                });
                if (photoData?.uri) {
                    setPhoto(photoData.uri);
                } else {
                    Alert.alert("Error", "Failed to capture photo.");
                }
            } catch (error) {
                Alert.alert("Error", "Camera capture failed");
            }
        }
    };

    const confirmAttendance = async () => {
        if (!user || (!user.id && !user._id)) {
            Alert.alert("Error", "User verification failed. Please relogin.");
            return;
        }

        setIsProcessing(true);
        try {
            const formData = new FormData();
            formData.append('userId', user.id || user._id); // Contract: userId
            formData.append('siteId', siteId);              // Contract: siteId
            formData.append('location', `${lat},${long}`);  // Contract: location "lat,lng"
            formData.append('type', 'Check-In'); // Extra useful info

            // Append File
            const filename = photo!.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `image/${match[1]}` : `image/jpeg`;

            formData.append('photo', {
                uri: photo,
                name: filename,
                type,
            } as any);

            await api.markAttendance(formData);

            setIsProcessing(false);
            router.replace('/worker/success'); // Create this or ensure it exists
        } catch (error: any) {
            setIsProcessing(false);
            console.error(error);
            Alert.alert("Upload Failed", error.message || "Could not mark attendance");
        }
    };

    if (photo) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <Image source={{ uri: photo }} className="flex-1 w-full" resizeMode="contain" />
                <View className="absolute bottom-0 w-full bg-white/10 p-8 rounded-t-[30px] backdrop-blur-md">
                    <Text className="text-white text-center font-bold text-lg mb-6">Confirm Selfie?</Text>
                    {isLate && (
                        <View className="mb-6 bg-yellow-500/20 p-4 rounded-xl border border-yellow-500/50 items-center">
                            <Text className="text-yellow-400 font-bold">⚠️ You are marking late (After 9:30 AM)</Text>
                        </View>
                    )}
                    <View className="flex-row gap-4">
                        <Button title="Retake" variant="outline" onPress={() => setPhoto(null)} style={{ flex: 1, borderColor: 'white' }} textStyle={{ color: 'white' }} />
                        <Button title="Submit" onPress={confirmAttendance} isLoading={isProcessing} style={{ flex: 1 }} />
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <CameraView style={{ flex: 1 }} facing={facing} ref={cameraRef}>
                <View className="flex-1 items-center justify-center">
                    <View className="w-64 h-80 border-4 border-primary/50 rounded-full bg-transparent" />
                    <Text className="text-white/80 bg-black/50 px-4 py-1 rounded-full mt-4 font-medium">Align your face</Text>
                </View>
                <View className="absolute bottom-0 w-full p-8 flex-row items-center justify-between bg-black/40">
                    <TouchableOpacity onPress={() => router.back()} className="w-12 h-12 items-center justify-center rounded-full bg-white/20">
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={takePicture} className="w-20 h-20 rounded-full bg-white items-center justify-center border-4 border-gray-300">
                        <View className="w-16 h-16 rounded-full bg-primary border-2 border-white" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setFacing(c => (c === 'back' ? 'front' : 'back'))} className="w-12 h-12 items-center justify-center rounded-full bg-white/20">
                        <Ionicons name="camera-reverse" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </CameraView>
        </View>
    );
}
