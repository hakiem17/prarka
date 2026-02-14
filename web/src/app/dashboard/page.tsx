'use client';

import React, { useEffect, useState } from 'react';
import {
    TrendingUp,
    Users,
    FileText,
    DollarSign,
    CheckCircle,
    Clock,
    Calendar,
    Activity,
    Database,
    Layers,
    LayoutDashboard
} from 'lucide-react';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { supabase } from '@/lib/supabaseClient';

const StatCard = ({ title, value, icon: Icon, color, description, loading }: any) => {
    // Map color string to classes
    const colorClasses: any = {
        green: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-600 dark:text-green-300', textDesc: 'text-green-700 dark:text-green-400' },
        blue: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-600 dark:text-blue-300', textDesc: 'text-blue-700 dark:text-blue-400' },
        indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900', text: 'text-indigo-600 dark:text-indigo-300', textDesc: 'text-indigo-700 dark:text-indigo-400' },
        purple: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-600 dark:text-purple-300', textDesc: 'text-purple-700 dark:text-purple-400' },
        orange: { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-600 dark:text-orange-300', textDesc: 'text-orange-700 dark:text-orange-400' },
    };

    const scheme = colorClasses[color] || colorClasses.blue;

    return (
        <Card className="hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
                <div className="flex items-center">
                    <div className={`flex-shrink-0 rounded-lg p-3 ${scheme.bg}`}>
                        <Icon className={`h-6 w-6 ${scheme.text}`} />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
                            <dd>
                                {loading ? (
                                    <div className="h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
                                ) : (
                                    <div className="text-xl font-bold text-navy-900 dark:text-gray-100">{value}</div>
                                )}
                            </dd>
                        </dl>
                    </div>
                </div>
            </CardContent>
            <div className="bg-gray-50/50 dark:bg-gray-800/50 px-6 py-3 border-t border-gray-100 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    <span className={scheme.textDesc}>{description}</span>
                </div>
            </div>
        </Card>
    );
};

const DashboardPage = () => {
    const [counts, setCounts] = useState({
        renja: 0,
        opd: 0,
        standarHarga: 0,
        rincian: 0,
        filledRenja: 0,
        totalPagu: 0,
        progress: 0
    });
    const [jadwalList, setJadwalList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. Fetch Count for RKPD (Renja)
                const { count: renjaCount } = await supabase
                    .from('rka_renja')
                    .select('*', { count: 'exact', head: true });

                // 2. Fetch Count for Master Data (OPD)
                const { count: opdCount } = await supabase
                    .from('opds')
                    .select('*', { count: 'exact', head: true });

                // 3. Fetch Count for Standar Harga (All types)
                const [ssh, sbu, hspk, asb] = await Promise.all([
                    supabase.from('ssh').select('*', { count: 'exact', head: true }),
                    supabase.from('sbu').select('*', { count: 'exact', head: true }),
                    supabase.from('hspk').select('*', { count: 'exact', head: true }),
                    supabase.from('asb').select('*', { count: 'exact', head: true })
                ]);
                const totalSH = (ssh.count || 0) + (sbu.count || 0) + (hspk.count || 0) + (asb.count || 0);

                // 4. Calculate Progress based on Budget (Pagu vs Rincian)
                const { data: renjaData, error: renjaError } = await supabase
                    .from('rka_renja')
                    .select('pagu_validasi');

                if (renjaError) console.error("Error fetching renja pagu:", renjaError);
                console.log("Renja Data Pagu:", renjaData);

                const { data: rincianData, error: rincianError } = await supabase
                    .from('rka_rincian')
                    .select('total');

                if (rincianError) console.error("Error fetching rincian total:", rincianError);
                console.log("Rincian Data Total:", rincianData);

                // Sum Total Pagu
                const totalPagu = renjaData?.reduce((sum, item) => sum + (item.pagu_validasi || 0), 0) || 0;

                // Sum Total Rincian
                const totalRincian = rincianData?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;

                console.log("Calculated Totals:", { totalPagu, totalRincian });

                const progressPercentage = totalPagu > 0 ? (totalRincian / totalPagu) * 100 : 0;

                // 5. Fetch Jadwal RKA
                const { data: jadwal } = await supabase
                    .from('rka_jadwal')
                    .select('*')
                    .order('mulai', { ascending: true })
                    .limit(5);

                setJadwalList(jadwal || []);

                setCounts({
                    renja: renjaCount || 0,
                    opd: opdCount || 0,
                    standarHarga: totalSH,
                    rincian: 0,
                    filledRenja: totalRincian, // Reusing field for visualization (Total Inputted)
                    totalPagu: totalPagu,      // New field for specific visualization
                    progress: progressPercentage
                });
            } catch (error) {
                console.error("Error fetching dashboard counts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('id-ID').format(num);
    };

    const formatCurrency = (num: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            notation: 'compact',
            compactDisplay: 'short'
        }).format(num);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short'
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white">Ringkasan Menu Utama</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Ikhtisar data dari seluruh modul aplikasi SIPD-RKA.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <Clock className="w-4 h-4" />
                    <span>Terakhir diupdate: <span className="font-semibold text-navy-900 dark:text-white">Hari ini</span></span>
                </div>
            </div>

            {/* Menu Resume Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. RKPD Card */}
                <StatCard
                    title="Menu RKPD"
                    value={formatNumber(counts.renja)}
                    icon={FileText}
                    color="blue"
                    description="Sub Kegiatan dalam Renja"
                    loading={loading}
                />

                {/* 2. Referensi Card */}
                <StatCard
                    title="Menu Referensi"
                    value={formatNumber(counts.opd)}
                    icon={Database}
                    color="indigo"
                    description="OPD / SKPD Terdaftar"
                    loading={loading}
                />

                {/* 3. Standar Harga Card */}
                <StatCard
                    title="Menu Standar Harga"
                    value={formatNumber(counts.standarHarga)}
                    icon={DollarSign}
                    color="purple"
                    description="Total Item (SSH, SBU, HSPK, ASB)"
                    loading={loading}
                />

                {/* 4. System / Pengaturan */}
                <StatCard
                    title="System Status"
                    value="Online"
                    icon={LayoutDashboard}
                    color="green"
                    description="Semua layanan berjalan normal"
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            Progres Input RKA
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80 flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-lg">
                            {loading ? (
                                <div className="text-gray-400 animate-pulse">Menghitung progres...</div>
                            ) : (
                                <CircularProgress
                                    value={counts.progress}
                                    label="Terisi"
                                    subLabel={`${formatCurrency(counts.filledRenja)} / ${formatCurrency(counts.totalPagu || 0)}`}
                                    size={240}
                                    color={counts.progress > 95 ? 'text-emerald-500' : counts.progress > 50 ? 'text-blue-500' : 'text-orange-500'}
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-1 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="w-5 h-5 text-orange-500" />
                            Jadwal Tahapan RKA
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flow-root">
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex gap-4 animate-pulse">
                                            <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : jadwalList.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    Belum ada jadwal tahapan yang aktif.
                                </div>
                            ) : (
                                <ul className="-mb-8">
                                    {jadwalList.map((item, index) => (
                                        <li key={item.id} className="relative pb-8">
                                            {index !== jadwalList.length - 1 && (
                                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></span>
                                            )}
                                            <div className="relative flex space-x-3">
                                                <div>
                                                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-gray-800 shadow-sm ${item.status === 'Selesai' ? 'bg-green-100 text-green-600' :
                                                            item.status === 'Aktif' ? 'bg-blue-100 text-blue-600' :
                                                                'bg-gray-100 text-gray-400'
                                                        }`}>
                                                        {item.status === 'Selesai' ? <CheckCircle className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                    <div>
                                                        <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">{item.tahapan}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            {formatDate(item.mulai)} - {formatDate(item.selesai)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right text-xs whitespace-nowrap">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${item.status === 'Aktif' ? 'bg-blue-100 text-blue-700' :
                                                                item.status === 'Selesai' ? 'bg-green-100 text-green-700' :
                                                                    'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {item.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DashboardPage;
