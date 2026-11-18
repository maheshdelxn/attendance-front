import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
    textClassName?: string;
    icon?: React.ReactNode;
}

export default function Button({
    title,
    onPress,
    variant = 'primary',
    isLoading = false,
    disabled = false,
    className,
    textClassName,
    icon,
}: ButtonProps) {
    const baseStyles = "min-h-[52px] h-14 rounded-xl items-center justify-center flex-row px-5 shadow-sm active:opacity-90";

    const variants = {
        primary: "bg-primary border border-primary/20", // Safety Yellow
        secondary: "bg-secondary", // Asphalt Black
        outline: "bg-transparent border-2 border-secondary",
        danger: "bg-danger",
    };

    const textStyles = {
        primary: "text-secondary font-bold text-base md:text-lg",
        secondary: "text-primary font-bold text-base md:text-lg",
        outline: "text-secondary font-bold text-base md:text-lg",
        danger: "text-white font-bold text-base md:text-lg",
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || isLoading}
            activeOpacity={0.8}
            className={twMerge(
                clsx(
                    baseStyles,
                    variants[variant],
                    (disabled || isLoading) && "opacity-50",
                    className
                )
            )}
        >
            {isLoading ? (
                <ActivityIndicator color={variant === 'secondary' ? '#FFD700' : '#1A1A1A'} />
            ) : (
                <>
                    {icon && <View className="mr-2.5 items-center justify-center">{icon}</View>}
                    <Text className={twMerge(clsx(textStyles[variant], textClassName))}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}
