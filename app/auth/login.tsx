import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { api } from '../services/api';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { login } = useAuth();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [loginStep, setLoginStep] = useState<'mobile' | 'password'>('mobile');
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const resetForm = () => {
        setName('');
        setMobile('');
        setPassword('');
        setLoginStep('mobile');
    };

    const handleLoginNext = () => {
        if (mobile.length !== 10) {
            Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number.");
            return;
        }
        setLoginStep('password');
    };

    const handleLoginSubmit = async () => {
        if (!password) {
            Alert.alert("Required", "Please enter your password.");
            return;
        }

        setIsLoading(true);
        try {
            const data = await api.login(mobile, password);
            setIsLoading(false);

            // data is { token, user: { id, name, role, status... } }
            if (data.user.status === 'PENDING') {
                Alert.alert("Account Pending", "Your account is awaiting admin approval. Please try again later.");
                return;
            }

            if (data.user.status === 'INACTIVE') {
                Alert.alert("Account Inactive", "Your account has been deactivated. Please contact support.");
                return;
            }

            await login(data.user, data.token);

            if (data.user.role === 'ADMIN') {
                router.replace('/admin');
            } else {
                router.replace('/worker');
            }
        } catch (error: any) {
            setIsLoading(false);
            Alert.alert("Login Failed", error.message || "Invalid credentials");
        }
    };

    const handleSignupSubmit = async () => {
        if (!name || mobile.length !== 10 || !password) {
            Alert.alert("Invalid Details", "Please fill all fields correctly.");
            return;
        }

        setIsLoading(true);
        try {
            await api.register({
                name,
                mobile,
                password,
                role: 'WORKER' // Workers register themselves
            });
            setIsLoading(false);
            Alert.alert("Registration Successful", "Please wait for Admin approval. You can login once approved.");
            setMode('login');
            resetForm();
        } catch (error: any) {
            setIsLoading(false);
            Alert.alert("Registration Failed", error.message || "Something went wrong");
        }
    };

    return (
        <View className="flex-1 bg-background">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Brand Banner */}
                    <View
                        style={{ paddingTop: Math.max(insets.top + 16, 32) }}
                        className="bg-primary items-center justify-center rounded-b-[40px] shadow-md pb-8 px-6 mb-6"
                    >
                        <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-3 shadow-md border-2 border-secondary">
                            <Text className="text-4xl">👷</Text>
                        </View>
                        <Text className="text-3xl font-extrabold text-secondary tracking-tight">BuildSafe</Text>
                        <Text className="text-secondary font-bold text-sm mt-0.5 opacity-80">
                            {mode === 'login' ? 'Worker & Admin Portal' : 'New Worker Registration'}
                        </Text>

                        {/* Top Segmented Switcher for Clean UX */}
                        <View className="flex-row bg-secondary/10 p-1 rounded-full mt-5 w-64">
                            <TouchableOpacity
                                onPress={() => { setMode('login'); resetForm(); }}
                                className={`flex-1 py-1.5 rounded-full items-center ${mode === 'login' ? 'bg-secondary' : ''}`}
                            >
                                <Text className={`text-xs font-bold ${mode === 'login' ? 'text-primary' : 'text-secondary'}`}>
                                    Sign In
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => { setMode('signup'); resetForm(); }}
                                className={`flex-1 py-1.5 rounded-full items-center ${mode === 'signup' ? 'bg-secondary' : ''}`}
                            >
                                <Text className={`text-xs font-bold ${mode === 'signup' ? 'text-primary' : 'text-secondary'}`}>
                                    Register
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="px-6 md:px-8 flex-1 justify-between">
                        {mode === 'login' && (
                            <View>
                                {loginStep === 'mobile' ? (
                                    <>
                                        <Text className="text-secondary text-2xl font-extrabold mb-1">Welcome Back</Text>
                                        <Text className="text-secondary/70 font-medium text-sm mb-6">Enter your registered mobile number to proceed</Text>
                                        <Input
                                            label="Mobile Number"
                                            placeholder="Enter 10-digit number"
                                            keyboardType="phone-pad"
                                            maxLength={10}
                                            value={mobile}
                                            onChangeText={setMobile}
                                            containerClassName="mb-6"
                                        />
                                        <Button title="Continue" onPress={handleLoginNext} isLoading={isLoading} />
                                    </>
                                ) : (
                                    <>
                                        <TouchableOpacity
                                            onPress={() => setLoginStep('mobile')}
                                            className="mb-4 flex-row items-center py-1"
                                        >
                                            <Text className="text-secondary font-bold text-sm">← Change Mobile Number</Text>
                                        </TouchableOpacity>
                                        <Text className="text-secondary text-2xl font-extrabold mb-1">Enter Password</Text>
                                        <Text className="text-secondary/70 font-medium text-sm mb-6">For mobile: +91 {mobile}</Text>

                                        <Input
                                            label="Password"
                                            placeholder="Enter your password"
                                            secureTextEntry
                                            value={password}
                                            onChangeText={setPassword}
                                            containerClassName="mb-6"
                                        />
                                        <Button title="Login" onPress={handleLoginSubmit} isLoading={isLoading} />
                                    </>
                                )}
                            </View>
                        )}

                        {mode === 'signup' && (
                            <View>
                                <Text className="text-secondary text-2xl font-extrabold mb-1">Create Account</Text>
                                <Text className="text-secondary/70 font-medium text-sm mb-6">Workers register here for site admin approval</Text>

                                <Input
                                    label="Full Name"
                                    placeholder="e.g. Rahul Sharma"
                                    value={name}
                                    onChangeText={setName}
                                    containerClassName="mb-4"
                                />

                                <Input
                                    label="Mobile Number"
                                    placeholder="10-digit mobile number"
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    value={mobile}
                                    onChangeText={setMobile}
                                    containerClassName="mb-4"
                                />

                                <Input
                                    label="Set Password"
                                    placeholder="Enter a secure password"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                    containerClassName="mb-6"
                                />

                                <Button title="Submit Registration" onPress={handleSignupSubmit} isLoading={isLoading} />
                            </View>
                        )}

                        {/* High Contrast Bottom Switcher */}
                        <View className="mt-8 flex-row items-center justify-center py-4">
                            <Text className="text-secondary/80 font-medium text-sm">
                                {mode === 'login' ? "Don't have an account? " : "Already registered? "}
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setMode(mode === 'login' ? 'signup' : 'login');
                                    resetForm();
                                }}
                                className="py-1 px-1"
                            >
                                <Text className="text-secondary font-extrabold text-sm underline">
                                    {mode === 'login' ? 'Sign Up' : 'Sign In'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
