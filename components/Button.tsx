import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { clsx } from 'clsx';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
    icon?: React.ReactNode;
}

export default function Button({
    title,
    onPress,
    variant = 'primary',
    isLoading = false,
    disabled = false,
    className,
    icon,
}: ButtonProps) {
    const baseStyles = "h-14 rounded-xl items-center justify-center flex-row shadow-sm active:opacity-90";

    const variants = {
        primary: "bg-primary", // Safety Yellow
        secondary: "bg-secondary", // Asphalt Black
        outline: "bg-transparent border-2 border-secondary",
        danger: "bg-danger",
    };

    const textStyles = {
        primary: "text-secondary font-bold text-lg",
        secondary: "text-primary font-bold text-lg",
        outline: "text-secondary font-bold text-lg",
        danger: "text-white font-bold text-lg",
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || isLoading}
            className={clsx(
                baseStyles,
                variants[variant],
                (disabled || isLoading) && "opacity-60",
                className
            )}
        >
            {isLoading ? (
                <ActivityIndicator color={variant === 'secondary' ? '#FFD700' : '#1A1A1A'} />
            ) : (
                <>
                    {icon && <View className="mr-2">{icon}</View>}
                    <Text className={clsx(textStyles[variant])}>{title}</Text>
                </>
            )}
        </TouchableOpacity>
    );
}
