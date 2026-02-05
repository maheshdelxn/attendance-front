import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { api } from '../services/api';

export default function ReportsScreen() {
    const router = useRouter();
    const [dateRange, setDateRange] = useState('Month'); // Default to month
    const [selectedSite, setSelectedSite] = useState('All Sites');
    const [sites, setSites] = useState<any[]>([]);
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const [sitesData, summaryData] = await Promise.all([
                api.getSites(),
                api.getSummaryReport(dateRange.toLowerCase(), selectedSite)
            ]);
            setSites(sitesData || []);
            setReportData(summaryData);
        } catch (error) {
            console.error("Failed to load report data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange, selectedSite]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleExport = (format: 'PDF' | 'Excel') => {
        Alert.alert("Exporting...", `Generating ${format} report for ${selectedSite} (${dateRange})`);
        setTimeout(() => {
            Alert.alert("Export Complete", "The report has been saved to your downloads.");
        }, 1500);
    };

    const FilterChip = ({ label, active, onPress }: any) => (
        <TouchableOpacity
            onPress={onPress}
            className={`px-4 py-2 rounded-full border border-gray-200 mr-2 ${active ? 'bg-secondary' : 'bg-white'}`}
        >
            <Text className={`font-medium ${active ? 'text-white' : 'text-secondary'}`}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="bg-white px-6 pt-16 pb-4 border-b border-gray-100 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
                        <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                    </TouchableOpacity>
                    <Text className="text-secondary text-2xl font-bold">Reports</Text>
                </View>
                <TouchableOpacity onPress={onRefresh} className="w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-200">
                    <Ionicons name="refresh" size={20} color="#1A1A1A" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >

                {/* Filters */}
                <View className="mb-8">
                    <Text className="text-secondary font-bold mb-3">Time Period</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                        {['Today', 'Week', 'Month'].map(period => (
                            <FilterChip
                                key={period}
                                label={period}
                                active={dateRange.toLowerCase() === period.toLowerCase()}
                                onPress={() => setDateRange(period)}
                            />
                        ))}
                    </ScrollView>

                    <Text className="text-secondary font-bold mb-3">Site</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <FilterChip
                            label="All Sites"
                            active={selectedSite === 'All Sites'}
                            onPress={() => setSelectedSite('All Sites')}
                        />
                        {sites.map(site => (
                            <FilterChip
                                key={site._id}
                                label={site.name}
                                active={selectedSite === site._id}
                                onPress={() => setSelectedSite(site._id)}
                            />
                        ))}
                    </ScrollView>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#FFD700" className="mt-10" />
                ) : (
                    <>
                        <View className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6 flex-row items-center justify-between">
                            <View>
                                <Text className="text-secondary/60 text-[10px] font-bold uppercase tracking-widest mb-1">Total Present Today</Text>
                                <View className="flex-row items-baseline gap-2">
                                    <Text className="text-4xl font-extrabold text-secondary">
                                        {reportData?.attendanceCounts?.PRESENT || 0}
                                    </Text>
                                    <Text className="text-secondary/40 font-bold text-lg">Workers</Text>
                                </View>
                                <Text className="text-secondary/60 text-sm font-bold mt-2">
                                    {selectedSite === 'All Sites' ? 'Global View' : sites.find(s => s._id === selectedSite)?.name}
                                </Text>
                            </View>
                            <View className="items-end">
                                <View className="bg-green-100 px-3 py-1 rounded-full">
                                    <Text className="text-success text-[10px] font-bold uppercase">Dynamic</Text>
                                </View>
                            </View>
                        </View>

                        {/* Detailed Logs List */}
                        <Text className="text-secondary font-bold text-lg mb-4">Attendance Details</Text>
                        <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
                            {reportData?.logs?.length > 0 ? (
                                reportData.logs.map((log: any, index: number) => (
                                    <View
                                        key={log._id}
                                        className={`p-4 flex-row justify-between items-center ${index !== reportData.logs.length - 1 ? 'border-b border-gray-50' : ''}`}
                                    >
                                        <View className="flex-row items-center gap-3">
                                            <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100">
                                                <Text className="text-secondary font-bold">{log.user?.name?.charAt(0)}</Text>
                                            </View>
                                            <View>
                                                <Text className="text-secondary font-bold text-sm">{log.user?.name || 'Unknown'}</Text>
                                                <Text className="text-secondary/40 text-[10px]">{log.site?.name || 'No Site'}</Text>
                                            </View>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-secondary font-bold text-sm">
                                                {new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                            <Text className="text-success text-[10px] font-bold uppercase">Punched In</Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View className="p-8 items-center">
                                    <Ionicons name="calendar-outline" size={32} color="#CCC" />
                                    <Text className="text-secondary/40 text-xs mt-2">No records found for this selection.</Text>
                                </View>
                            )}
                        </View>

                        {/* Actions */}
                        <Text className="text-secondary font-bold mb-4">Export Report</Text>
                        <View className="gap-4">
                            <Button
                                title="Download Excel"
                                onPress={() => handleExport('Excel')}
                                variant="outline"
                                className="h-12"
                                icon={<Ionicons name="document-text-outline" size={18} color="#1A1A1A" />}
                            />
                            <Button
                                title="Download PDF"
                                onPress={() => handleExport('PDF')}
                                variant="outline"
                                className="h-12"
                                icon={<Ionicons name="print-outline" size={18} color="#1A1A1A" />}
                            />
                        </View>
                    </>
                )}

            </ScrollView>
        </View>
    );
}
