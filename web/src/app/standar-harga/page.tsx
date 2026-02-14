'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Database, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import Link from 'next/link';

export default function StandarHargaDashboard() {
    const [counts, setCounts] = useState({
        ssh: 0,
        sbu: 0,
        hspk: 0,
        asb: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const [sshRes, sbuRes, hspkRes, asbRes] = await Promise.all([
                    supabase.from('ssh').select('*', { count: 'exact', head: true }),
                    supabase.from('sbu').select('*', { count: 'exact', head: true }),
                    supabase.from('hspk').select('*', { count: 'exact', head: true }),
                    supabase.from('asb').select('*', { count: 'exact', head: true })
                ]);

                setCounts({
                    ssh: sshRes.count || 0,
                    sbu: sbuRes.count || 0,
                    hspk: hspkRes.count || 0,
                    asb: asbRes.count || 0
                });
            } catch (error) {
                console.error('Error fetching counts:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCounts();
    }, []);

    const cards = [
        { title: 'SSH', count: counts.ssh, icon: Database, color: 'text-blue-600', bg: 'bg-blue-50', link: '/standar-harga/ssh', desc: 'Standar Satuan Harga' },
        { title: 'SBU', count: counts.sbu, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', link: '/standar-harga/sbu', desc: 'Standar Biaya Umum' },
        { title: 'HSPK', count: counts.hspk, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50', link: '/standar-harga/hspk', desc: 'Harga Satuan Pokok Kegiatan' },
        { title: 'ASB', count: counts.asb, icon: PieChart, color: 'text-orange-600', bg: 'bg-orange-50', link: '/standar-harga/asb', desc: 'Analisis Standar Belanja' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Dashboard Standar Harga</h1>
                <p className="text-gray-500 text-sm">Ringkasan data standar harga yang telah diupload.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card) => (
                    <Link key={card.title} href={card.link}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-l-4" style={{ borderLeftColor: card.color.replace('text-', 'bg-').replace('-600', '-500') }}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">
                                    {card.title}
                                </CardTitle>
                                <div className={`p-2 rounded-full ${card.bg}`}>
                                    <card.icon className={`h-4 w-4 ${card.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold text-navy-900">{card.count.toLocaleString('id-ID')}</div>
                                        <p className="text-xs text-gray-400 mt-1">{card.desc}</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Informasi Upload</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-gray-600 space-y-2">
                        <p>Total Item Terupload: <strong>{(counts.ssh + counts.sbu + counts.hspk + counts.asb).toLocaleString('id-ID')}</strong></p>
                        <p>Gunakan menu di atas atau sidebar untuk mengelola data lebih detail.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
