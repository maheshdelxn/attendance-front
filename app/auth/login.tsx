import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { api } from '../services/api';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
    const router = useRouter();
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
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View className="h-[30%] bg-primary items-center justify-center rounded-b-[40px] shadow-lg mb-8 pt-10">
                        <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-4 shadow-sm border-2 border-secondary">
                            <Text className="text-4xl">👷</Text>
                        </View>
                        <Text className="text-3xl font-bold text-secondary">BuildSafe</Text>
                        <Text className="text-secondary/70 font-medium">{mode === 'login' ? 'Secure Login' : 'New Account'}</Text>
                    </View>

                    <View className="px-8 flex-1">
                        {mode === 'login' && (
                            <View>
                                {loginStep === 'mobile' ? (
                                    <>
                                        <Text className="text-secondary text-2xl font-bold mb-6">Welcome Back</Text>
                                        <Input
                                            label="Mobile Number"
                                            placeholder="Enter your 10-digit number"
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
                                        <TouchableOpacity onPress={() => setLoginStep('mobile')} className="mb-6">
                                            <Text className="text-secondary/60 text-base font-medium">← Change Mobile Number</Text>
                                        </TouchableOpacity>
                                        <Text className="text-secondary text-2xl font-bold mb-2">Enter Password</Text>
                                        <Text className="text-gray-500 mb-8">For +91 {mobile}</Text>

                                        <Input
                                            label="Password"
                                            placeholder="Enter your password"
                                            secureTextEntry
                                            value={password}
                                            onChangeText={setPassword}
                                            containerClassName="mb-8"
                                        />
                                        <Button title="Login" onPress={handleLoginSubmit} isLoading={isLoading} />
                                    </>
                                )}
                            </View>
                        )}

                        {mode === 'signup' && (
                            <View>
                                <Text className="text-secondary text-2xl font-bold mb-6">Create Account</Text>

                                <Input
                                    label="Full Name"
                                    placeholder="e.g. Rahul Sharma"
                                    value={name}
                                    onChangeText={setName}
                                    containerClassName="mb-4"
                                />

                                <Input
                                    label="Mobile Number"
                                    placeholder="10-digit number"
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    value={mobile}
                                    onChangeText={setMobile}
                                    containerClassName="mb-4"
                                />

                                <Input
                                    label="Password"
                                    placeholder="Set a strong password"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                    containerClassName="mb-8"
                                />

                                <Button title="Register" onPress={handleSignupSubmit} isLoading={isLoading} />
                            </View>
                        )}

                        <View className="mt-8 flex-row justify-center pb-8">
                            <Text className="text-gray-500">{mode === 'login' ? "Don't have an account? " : "Already have an account? "}</Text>
                            <TouchableOpacity onPress={() => {
                                setMode(mode === 'login' ? 'signup' : 'login');
                                resetForm();
                            }}>
                                <Text className="text-primary font-bold">{mode === 'login' ? 'Sign Up' : 'Login'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
