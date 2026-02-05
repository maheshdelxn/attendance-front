import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { clsx } from 'clsx';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerClassName?: string;
}

export default function Input({
    label,
    error,
    containerClassName,
    className,
    ...props
}: InputProps) {
    return (
        <View className={clsx("mb-4", containerClassName)}>
            {label && (
                <Text className="text-secondary font-bold text-sm mb-2 uppercase tracking-wider opacity-80">
                    {label}
                </Text>
            )}
            <View className={clsx(
                "bg-white border-2 rounded-xl h-14 justify-center px-4",
                error ? "border-danger" : "border-gray-200 focus:border-secondary"
            )}>
                <TextInput
                    placeholderTextColor="#9CA3AF"
                    className={clsx("text-lg text-secondary font-medium", className)}
                    {...props}
                />
            </View>
            {error && (
                <Text className="text-danger text-xs mt-1 font-medium">{error}</Text>
            )}
        </View>
    );
}
