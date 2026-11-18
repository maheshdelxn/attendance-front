import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import { api } from '../services/api';
import { useAuth } from '../../context/AuthContext';

export default function CameraScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
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
            const now = new Date();
            router.replace({
                pathname: '/worker/success',
                params: {
                    siteName,
                    date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            });
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
                <View
                    style={{ paddingBottom: Math.max(insets.bottom + 20, 32) }}
                    className="absolute bottom-0 w-full bg-secondary/90 px-6 pt-6 rounded-t-[32px] border-t border-white/20"
                >
                    <Text className="text-white text-center font-extrabold text-xl mb-4">Confirm Photo Proof?</Text>
                    {isLate && (
                        <View className="mb-5 bg-amber-500/20 px-4 py-3 rounded-xl border border-amber-400/50 flex-row items-center gap-2">
                            <Ionicons name="warning" size={18} color="#FBBF24" />
                            <Text className="text-amber-300 font-bold text-xs flex-1">
                                Flagged: Marking after 09:30 AM (Late arrival)
                            </Text>
                        </View>
                    )}
                    <View className="flex-row gap-3">
                        <Button
                            title="Retake"
                            variant="outline"
                            onPress={() => setPhoto(null)}
                            className="flex-1 border-white/60 bg-white/10"
                            textClassName="text-white font-extrabold"
                        />
                        <Button
                            title="Submit Proof"
                            onPress={confirmAttendance}
                            isLoading={isProcessing}
                            className="flex-1"
                        />
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <CameraView style={{ flex: 1 }} facing={facing} ref={cameraRef}>
                {/* Top Cancel Bar */}
                <View
                    style={{ top: Math.max(insets.top + 8, 16) }}
                    className="absolute left-4 z-20"
                >
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-11 h-11 bg-black/60 rounded-full items-center justify-center border border-white/20"
                    >
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Face Oval Guide */}
                <View className="flex-1 items-center justify-center">
                    <View className="w-64 h-80 border-4 border-primary/70 rounded-full bg-transparent" />
                    <View className="bg-black/70 px-4 py-1.5 rounded-full mt-4 border border-white/20">
                        <Text className="text-white font-bold text-xs">Position your face inside the oval</Text>
                    </View>
                </View>

                {/* Bottom Shutter Controls */}
                <View
                    style={{ paddingBottom: Math.max(insets.bottom + 20, 32) }}
                    className="absolute bottom-0 w-full px-8 pt-6 flex-row items-center justify-between bg-black/60 border-t border-white/10"
                >
                    <View className="w-12 h-12" />
                    <TouchableOpacity
                        onPress={takePicture}
                        activeOpacity={0.8}
                        className="w-20 h-20 rounded-full bg-white items-center justify-center border-4 border-gray-300 shadow-xl"
                    >
                        <View className="w-16 h-16 rounded-full bg-primary border-2 border-white items-center justify-center">
                            <Ionicons name="camera" size={26} color="#1A1A1A" />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setFacing(c => (c === 'back' ? 'front' : 'back'))}
                        className="w-12 h-12 items-center justify-center rounded-full bg-white/20 border border-white/20"
                    >
                        <Ionicons name="camera-reverse" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </CameraView>
        </View>
    );
}
