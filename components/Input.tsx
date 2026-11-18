import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerClassName?: string;
    isPassword?: boolean;
}

export default function Input({
    label,
    error,
    containerClassName,
    className,
    secureTextEntry,
    isPassword,
    ...props
}: InputProps) {
    const hasLabel = Boolean(label && label.trim().length > 0);
    const isPasswordField = Boolean(secureTextEntry || isPassword);
    const [isSecure, setIsSecure] = useState(isPasswordField);

    return (
        <View className={twMerge(clsx("mb-4", containerClassName))}>
            {hasLabel ? (
                <Text className="text-secondary font-bold text-xs uppercase tracking-wider mb-2 opacity-90">
                    {label}
                </Text>
            ) : null}
            <View className={twMerge(
                clsx(
                    "bg-white border-2 rounded-xl min-h-[52px] h-14 flex-row items-center px-4 shadow-sm",
                    error ? "border-danger bg-red-50/20" : "border-gray-200 focus:border-secondary"
                )
            )}>
                <TextInput
                    placeholderTextColor="#6B7280"
                    style={{ color: '#1A1A1A' }}
                    secureTextEntry={isPasswordField ? isSecure : false}
                    autoCapitalize={isPasswordField ? "none" : props.autoCapitalize}
                    autoCorrect={isPasswordField ? false : props.autoCorrect}
                    className={twMerge(clsx("text-base md:text-lg text-secondary font-semibold py-2 flex-1", className))}
                    {...props}
                />
                {isPasswordField && (
                    <TouchableOpacity
                        onPress={() => setIsSecure(!isSecure)}
                        activeOpacity={0.7}
                        className="p-1.5 -mr-1 items-center justify-center"
                    >
                        <Ionicons
                            name={isSecure ? "eye-off-outline" : "eye-outline"}
                            size={22}
                            color="#4B5563"
                        />
                    </TouchableOpacity>
                )}
            </View>
            {Boolean(error) && (
                <Text className="text-danger text-xs mt-1.5 font-bold">{error}</Text>
            )}
        </View>
    );
}
