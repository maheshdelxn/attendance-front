import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';

type ToastType = 'success' | 'error' | 'info';

// Global Singleton for outside-React calls
export const ToastManager = {
    show: (message: string, type: ToastType = 'info') => {
        if (_showToast) _showToast(message, type);
    },
    error: (message: string) => {
        if (_showToast) _showToast(message, 'error');
    },
    success: (message: string) => {
        if (_showToast) _showToast(message, 'success');
    }
};

let _showToast: (msg: string, t: ToastType) => void;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [message, setMessage] = useState('');
    const [type, setType] = useState<ToastType>('info');
    const [visible, setVisible] = useState(false);
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        _showToast = (msg: string, t: ToastType) => {
            setMessage(msg);
            setType(t);
            setVisible(true);

            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.delay(2500),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => setVisible(false));
        };
    }, [fadeAnim]);

    const getBackgroundColor = () => {
        switch (type) {
            case 'success': return '#4CAF50';
            case 'error': return '#F44336';
            default: return '#333333';
        }
    };

    return (
        <View style={{ flex: 1 }}>
            {children}
            {visible && (
                <Animated.View
                    style={[
                        styles.toastContainer,
                        { opacity: fadeAnim, backgroundColor: getBackgroundColor() }
                    ]}
                >
                    <Text style={styles.toastText}>{message}</Text>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        bottom: 50,
        left: 20,
        right: 20,
        padding: 16,
        borderRadius: 8,
        elevation: 10,
        zIndex: 9999,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    toastText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
});
