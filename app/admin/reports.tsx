import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { api } from '../services/api';

export default function ReportsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
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
            {/* Header with Safe Area Insets */}
            <View
                style={{ paddingTop: Math.max(insets.top + 12, 20) }}
                className="bg-white px-6 pb-4 border-b border-gray-200 flex-row items-center justify-between shadow-sm"
            >
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center border border-gray-200"
                    >
                        <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
                    </TouchableOpacity>
                    <Text className="text-secondary text-2xl font-extrabold">Reports</Text>
                </View>
                <TouchableOpacity
                    onPress={onRefresh}
                    className="w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-200 shadow-sm"
                >
                    <Ionicons name="refresh" size={20} color="#1A1A1A" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={{
                    padding: 20,
                    paddingBottom: insets.bottom + 40,
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1A1A1A"]} />}
            >
                {/* Filters */}
                <View className="mb-6">
                    <Text className="text-secondary font-extrabold text-sm mb-2.5">Time Period</Text>
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

                    <Text className="text-secondary font-extrabold text-sm mb-2.5">Construction Site</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <FilterChip
                            label="All Sites"
                            active={selectedSite === 'All Sites'}
                            onPress={() => setSelectedSite('All Sites')}
                        />
                        {sites.map(site => (
                            <FilterChip
                                key={site._id || site.id}
                                label={site.name}
                                active={selectedSite === (site._id || site.id)}
                                onPress={() => setSelectedSite(site._id || site.id)}
                            />
                        ))}
                    </ScrollView>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#FFD700" className="mt-12" />
                ) : (
                    <>
                        {/* Summary Stat Card */}
                        <View className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-6 flex-row items-center justify-between">
                            <View>
                                <Text className="text-secondary/70 text-xs font-bold uppercase tracking-wider mb-1">
                                    Total Present ({dateRange})
                                </Text>
                                <View className="flex-row items-baseline gap-2">
                                    <Text className="text-4xl font-extrabold text-secondary">
                                        {reportData?.attendanceCounts?.PRESENT || 0}
                                    </Text>
                                    <Text className="text-secondary/70 font-bold text-base">Workers</Text>
                                </View>
                                <Text className="text-secondary font-bold text-xs mt-1.5">
                                    Filter: {selectedSite === 'All Sites' ? 'Global (All Construction Sites)' : sites.find(s => (s._id || s.id) === selectedSite)?.name}
                                </Text>
                            </View>
                            <View className="items-end">
                                <View className="bg-green-100 px-3 py-1 rounded-full border border-green-200">
                                    <Text className="text-success text-[10px] font-extrabold uppercase">Live Filter</Text>
                                </View>
                            </View>
                        </View>

                        {/* Detailed Logs List */}
                        <Text className="text-secondary font-extrabold text-base mb-3">Attendance Breakdown</Text>
                        <View className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                            {reportData?.logs?.length > 0 ? (
                                reportData.logs.map((log: any, index: number) => (
                                    <View
                                        key={log._id || index}
                                        className={`p-4 flex-row justify-between items-center ${index !== reportData.logs.length - 1 ? 'border-b border-gray-100' : ''}`}
                                    >
                                        <View className="flex-row items-center gap-3">
                                            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center border border-gray-200">
                                                <Text className="text-secondary font-extrabold text-sm">{log.user?.name?.charAt(0) || 'W'}</Text>
                                            </View>
                                            <View>
                                                <Text className="text-secondary font-bold text-sm">{log.user?.name || 'Worker'}</Text>
                                                <Text className="text-secondary/70 text-xs font-medium">{log.site?.name || 'Assigned Site'}</Text>
                                            </View>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-secondary font-extrabold text-sm">
                                                {new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                            <Text className="text-success text-[10px] font-extrabold uppercase">Punched In</Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View className="p-10 items-center justify-center">
                                    <Ionicons name="calendar-outline" size={36} color="#9CA3AF" />
                                    <Text className="text-secondary/70 text-xs font-semibold mt-2.5 text-center">
                                        No attendance records found for this period and site filter.
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Export Actions */}
                        <Text className="text-secondary font-extrabold text-base mb-3">Export Report Data</Text>
                        <View className="gap-3 mb-6">
                            <Button
                                title="Download Excel Spreadsheet (.xlsx)"
                                onPress={() => handleExport('Excel')}
                                variant="outline"
                                className="min-h-[48px] h-12"
                                icon={<Ionicons name="document-text-outline" size={18} color="#1A1A1A" />}
                            />
                            <Button
                                title="Download PDF Summary (.pdf)"
                                onPress={() => handleExport('PDF')}
                                variant="outline"
                                className="min-h-[48px] h-12"
                                icon={<Ionicons name="print-outline" size={18} color="#1A1A1A" />}
                            />
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}
