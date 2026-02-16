'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Printer, ChevronDown, ChevronRight, FileText } from 'lucide-react';

// Types for our hierarchy
interface AggregatedData {
    programs: Record<string, {
        kode: string;
        nama: string;
        kegiatans: Record<string, {
            kode: string;
            nama: string;
            subKegiatans: Record<string, {
                kode: string;
                nama: string;
                pagu_validasi: number;
                rincian: Record<string, {
                    kode_rekening: string;
                    uraian: string; // usually we might not have exact uraian map for rekening if it aggregates multiple, but we'll try
                    total: number;
                }>;
            }>;
        }>;
    }>;
}

export default function LaporanPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [reportData, setReportData] = useState<AggregatedData | null>(null);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const toggleExpand = (key: string) => {
        setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const fetchReportData = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Fetch RKA Headers (Renja) with full hierarchy
            const { data: renjaData, error: renjaError } = await supabase
                .from('rka_renja')
                .select(`
                    id,
                    tahun,
                    pagu_validasi,
                    master_sub_kegiatans!sub_kegiatan_kode (
                        kode, nama,
                        master_kegiatans!kegiatan_kode (
                            kode, nama,
                            master_programs!program_kode (
                                kode, nama
                            )
                        )
                    )
                `);

            if (renjaError) throw renjaError;

            // 2. Fetch All Rincian
            // Optimization: In a real app with huge data, we might filter by year or aggregate on DB side (RPC).
            // For now, client-side aggregation is fine for typical dataset sizes here.
            const { data: rincianData, error: rincianError } = await supabase
                .from('rka_rincian')
                .select('rka_id, kode_rekening, total, uraian');

            if (rincianError) throw rincianError;

            // 3. Process & Aggregate
            const processed: AggregatedData = { programs: {} };

            // Helper to safe-get or create
            // ... (We will iterate through Renja headers first)

            const rincianMap = new Map<number, any[]>();
            rincianData?.forEach(r => {
                if (!rincianMap.has(r.rka_id)) rincianMap.set(r.rka_id, []);
                rincianMap.get(r.rka_id)?.push(r);
            });

            renjaData?.forEach((header: any) => {
                const sub = header.master_sub_kegiatans;
                const keg = sub.master_kegiatans;
                const prog = keg.master_programs;

                // Program
                if (!processed.programs[prog.kode]) {
                    processed.programs[prog.kode] = { kode: prog.kode, nama: prog.nama, kegiatans: {} };
                }
                const pNode = processed.programs[prog.kode];

                // Kegiatan
                if (!pNode.kegiatans[keg.kode]) {
                    pNode.kegiatans[keg.kode] = { kode: keg.kode, nama: keg.nama, subKegiatans: {} };
                }
                const kNode = pNode.kegiatans[keg.kode];

                // Sub Kegiatan
                // We might have multiple RKA headers for same sub kegiatan? Usually unique per OPD/Year. 
                // Assuming unique here for simplicity, or we merge.
                // If multiple headers exist (e.g. Perubahan), we might need to handle ID collision.
                // Using sub.kode as key.
                if (!kNode.subKegiatans[sub.kode]) {
                    kNode.subKegiatans[sub.kode] = {
                        kode: sub.kode,
                        nama: sub.nama,
                        pagu_validasi: 0,
                        rincian: {}
                    };
                }
                const sNode = kNode.subKegiatans[sub.kode];
                sNode.pagu_validasi += (header.pagu_validasi || 0);

                // Aggregate Rincian
                const details = rincianMap.get(header.id) || [];
                details.forEach(d => {
                    const rekKode = d.kode_rekening || 'Tanpa Kode';
                    if (!sNode.rincian[rekKode]) {
                        sNode.rincian[rekKode] = {
                            kode_rekening: rekKode,
                            uraian: d.uraian || rekKode,
                            total: 0
                        };
                    } else if (d.uraian && !sNode.rincian[rekKode].uraian.includes(d.uraian)) {
                        // Append unique uraian values
                        sNode.rincian[rekKode].uraian += `, ${d.uraian}`;
                    }
                    sNode.rincian[rekKode].total += (d.total || 0);
                });
            });

            setReportData(processed);

        } catch (error) {
            console.error('Error report:', error);
            alert('Gagal memuat laporan');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-navy-900">Laporan Rekapitulasi</h1>
                    <p className="text-gray-500 text-sm">Resume Rencana Kerja dan Anggaran (Renja)</p>
                </div>
                <Button onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-2" />
                    Cetak Laporan
                </Button>
            </div>

            <Card className="print:shadow-none print:border-none">
                <CardHeader className="print:hidden">
                    <CardTitle>Rekapitulasi Per Kode Rekening</CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:p-6 print:p-0">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-8 h-8 animate-spin text-navy-600" />
                        </div>
                    ) : !reportData || Object.keys(reportData.programs).length === 0 ? (
                        <div className="text-center py-12 text-gray-500 border border-dashed rounded-lg">
                            Belum ada data anggaran yang tersedia.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.values(reportData.programs).map((prog) => (
                                <div key={prog.kode} className="border border-gray-200 rounded-lg overflow-hidden mb-6 break-inside-avoid">
                                    <div className="bg-navy-50 px-4 py-3 border-b border-navy-100 flex items-center gap-2">
                                        <div className="font-bold text-navy-900 bg-white px-2 py-0.5 rounded text-xs border border-navy-200">
                                            {prog.kode}
                                        </div>
                                        <div className="font-bold text-navy-800 text-sm uppercase">
                                            {prog.nama}
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-4">
                                        {Object.values(prog.kegiatans).map((keg) => (
                                            <div key={keg.kode} className="break-inside-avoid ml-0 sm:ml-4 border-l-2 border-gray-200 pl-4 py-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 rounded">{keg.kode}</span>
                                                    <h4 className="font-semibold text-gray-800 text-sm uppercase">{keg.nama}</h4>
                                                </div>

                                                <div className="space-y-3 mt-2">
                                                    {Object.values(keg.subKegiatans).map((sub) => {
                                                        const rincianKeys = Object.keys(sub.rincian);
                                                        const subTotalReal = Object.values(sub.rincian).reduce((a, b) => a + b.total, 0);

                                                        return (
                                                            <div key={sub.kode} className="bg-white border border-gray-100 rounded shadow-sm break-inside-avoid">
                                                                <button
                                                                    onClick={() => toggleExpand(sub.kode)}
                                                                    className="w-full text-left px-4 py-3 flex justify-between items-center hover:bg-gray-50/50 transition-colors"
                                                                >
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                                                                SUB: {sub.kode}
                                                                            </span>
                                                                        </div>
                                                                        <p className="font-medium text-sm text-gray-900 mb-1">{sub.nama}</p>
                                                                        {rincianKeys.length > 0 ? (
                                                                            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-flex items-center">
                                                                                {rincianKeys.length} Rekening Belanja
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-xs text-gray-400 italic">Belum ada rincian</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-right pl-4">
                                                                        <p className="text-sm font-bold text-navy-700">{formatCurrency(subTotalReal)}</p>
                                                                        <p className="text-[10px] text-gray-400">Pagu: {formatCurrency(sub.pagu_validasi)}</p>
                                                                        {/* <ChevronDown className={`w-4 h-4 ml-auto mt-1 text-gray-400 transition-transform ${expanded[sub.kode] ? 'rotate-180' : ''}`} /> */}
                                                                    </div>
                                                                </button>

                                                                {/* Always show in print, toggle in view */}
                                                                <div className={`${expanded[sub.kode] ? 'block' : 'hidden'} print:block border-t border-gray-100`}>
                                                                    {rincianKeys.length > 0 && (
                                                                        <table className="w-full text-xs text-left">
                                                                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                                                                <tr>
                                                                                    <th className="px-4 py-2 w-32">Kode Rekening</th>
                                                                                    <th className="px-4 py-2">Uraian</th>
                                                                                    <th className="px-4 py-2 text-right">Jumlah</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-gray-50">
                                                                                {Object.values(sub.rincian).map((r) => (
                                                                                    <tr key={r.kode_rekening}>
                                                                                        <td className="px-4 py-2 font-mono text-gray-600">{r.kode_rekening}</td>
                                                                                        <td className="px-4 py-2 text-gray-700">{r.uraian}</td>
                                                                                        <td className="px-4 py-2 text-right font-medium text-gray-900">{formatCurrency(r.total)}</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                            <tfoot className="bg-gray-50/50 font-bold text-gray-700">
                                                                                <tr>
                                                                                    <td colSpan={2} className="px-4 py-2 text-right">Total Sub Kegiatan</td>
                                                                                    <td className="px-4 py-2 text-right text-blue-700">{formatCurrency(subTotalReal)}</td>
                                                                                </tr>
                                                                            </tfoot>
                                                                        </table>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
