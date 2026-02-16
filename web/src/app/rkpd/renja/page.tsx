'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, Filter, MoreHorizontal, CheckCircle, Plus, Loader2, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const RenjaPage = () => {
    const [opds, setOpds] = useState<any[]>([]);
    const [selectedOpdId, setSelectedOpdId] = useState<string>('');
    const [year, setYear] = useState(2027);

    // Data hierarchy
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch OPDs for selection
    useEffect(() => {
        const fetchOpds = async () => {
            const { data } = await supabase.from('opds').select('*').order('kode');
            if (data && data.length > 0) {
                setOpds(data);
                setSelectedOpdId(data[0].id.toString());
            }
        };
        fetchOpds();
    }, []);

    const fetchData = useCallback(async () => {
        if (!selectedOpdId) return;
        setIsLoading(true);
        try {
            // 1. Fetch RKA Headers
            const { data: rkaData, error } = await supabase
                .from('rka_renja')
                .select(`
                    id, 
                    sub_kegiatan_kode, 
                    pagu_validasi, 
                    created_at,
                    master_sub_kegiatans!sub_kegiatan_kode (
                        kode, nama, kegiatan_kode,
                        master_kegiatans!kegiatan_kode (
                            kode, nama, program_kode,
                            master_programs!program_kode (
                                kode, nama, bidang_urusan_kode,
                                master_bidang_urusans!bidang_urusan_kode (
                                    kode, nama, urusan_kode,
                                    master_urusans!urusan_kode (
                                        kode, nama
                                    )
                                )
                            )
                        )
                    )
                `)
                .eq('opd_id', selectedOpdId)
                .eq('tahun', year);

            if (error) throw error;

            // 1b. Fetch Rincian Sums separately to avoid massive payload or complex joining 
            // (Client-side aggregation for now, assuming not too many rows per OPD)
            const rkaIds = rkaData.map((d: any) => d.id);
            let rincianMap: Record<number, number> = {};

            if (rkaIds.length > 0) {
                const { data: rincianData } = await supabase
                    .from('rka_rincian')
                    .select('rka_id, total')
                    .in('rka_id', rkaIds);

                if (rincianData) {
                    rincianData.forEach((r: any) => {
                        rincianMap[r.rka_id] = (rincianMap[r.rka_id] || 0) + (r.total || 0);
                    });
                }
            }

            // 2. Transform flattened data into hierarchy
            // Structure: Urusan -> Program -> Kegiatan -> Sub Kegiatan (RKA)
            const hierarchy: any = {};

            rkaData?.forEach((item: any) => {
                const sub = item.master_sub_kegiatans;
                const keg = sub.master_kegiatans;
                const prog = keg.master_programs;
                const bidang = prog.master_bidang_urusans;
                const urusan = bidang.master_urusans;

                // Level 1: Urusan
                if (!hierarchy[urusan.kode]) {
                    hierarchy[urusan.kode] = { ...urusan, programs: {} };
                }

                // Level 2: Program
                if (!hierarchy[urusan.kode].programs[prog.kode]) {
                    hierarchy[urusan.kode].programs[prog.kode] = { ...prog, kegiatans: {} };
                }

                // Level 3: Kegiatan
                if (!hierarchy[urusan.kode].programs[prog.kode].kegiatans[keg.kode]) {
                    hierarchy[urusan.kode].programs[prog.kode].kegiatans[keg.kode] = { ...keg, subKegiatans: [] };
                }

                // Level 4: Sub Kegiatan (RKA Item)
                hierarchy[urusan.kode].programs[prog.kode].kegiatans[keg.kode].subKegiatans.push({
                    id: item.id, // RKA ID
                    kode: sub.kode,
                    nama: sub.nama,
                    paguValidasi: item.pagu_validasi || 0,
                    status: item.status || 'Draft',
                    totalRincian: rincianMap[item.id] || 0,
                    totalRealisasi: 0,
                    persentase: 0
                });
            });

            // Convert objects to arrays for rendering with SORTING
            const processedData = Object.values(hierarchy)
                .sort((a: any, b: any) => a.kode.localeCompare(b.kode))
                .map((u: any) => ({
                    ...u,
                    programs: Object.values(u.programs)
                        .sort((a: any, b: any) => a.kode.localeCompare(b.kode))
                        .map((p: any) => ({
                            ...p,
                            kegiatans: Object.values(p.kegiatans)
                                .sort((a: any, b: any) => a.kode.localeCompare(b.kode))
                                .map((k: any) => ({
                                    ...k,
                                    subKegiatans: k.subKegiatans.sort((a: any, b: any) => a.kode.localeCompare(b.kode))
                                }))
                        }))
                }));

            setData(processedData);

        } catch (error) {
            console.error('Error fetching Renja:', error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedOpdId, year]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    };

    // Add Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Edit Pagu Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRka, setEditingRka] = useState<any>(null); // { id, nama, paguValidasi }
    const [editPaguValue, setEditPaguValue] = useState<string>('');

    const [subKegiatanSearch, setSubKegiatanSearch] = useState('');
    const [masterSubKegiatans, setMasterSubKegiatans] = useState<any[]>([]);
    const [isSearchingSub, setIsSearchingSub] = useState(false);

    // Fetch Master Sub Kegiatans for Modal
    const searchSubKegiatans = useCallback(async (term: string) => {
        setIsSearchingSub(true);
        try {
            let query = supabase
                .from('master_sub_kegiatans')
                .select('kode, nama')
                .limit(20);

            if (term) {
                query = query.or(`nama.ilike.%${term}%,kode.ilike.%${term}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            setMasterSubKegiatans(data || []);
        } catch (error) {
            console.error('Error searching sub kegiatans:', error);
        } finally {
            setIsSearchingSub(false);
        }
    }, []);

    useEffect(() => {
        if (isAddModalOpen) {
            searchSubKegiatans('');
        }
    }, [isAddModalOpen, searchSubKegiatans]);

    const handleSaveSubKegiatan = async (subKegiatanKode: string) => {
        if (!selectedOpdId) {
            alert('Pilih OPD terlebih dahulu!');
            return;
        }

        try {
            // Check if already exists
            const { data: existing } = await supabase
                .from('rka_renja')
                .select('id')
                .eq('opd_id', selectedOpdId)
                .eq('sub_kegiatan_kode', subKegiatanKode)
                .eq('tahun', year)
                .single();

            if (existing) {
                alert('Sub Kegiatan ini sudah ada di Renja OPD ini.');
                return;
            }


            const payload = {
                opd_id: parseInt(selectedOpdId),
                sub_kegiatan_kode: subKegiatanKode,
                tahun: year,
                status: 'Draft',
                pagu_validasi: 0
            };

            // Insert new RKA Header
            const { error } = await supabase.from('rka_renja').insert(payload);

            if (error) throw error;


            alert('Berhasil menambahkan Sub Kegiatan');
            setIsAddModalOpen(false);
            fetchData(); // Refresh list

        } catch (error) {
            console.error('Error adding sub kegiatan:', error);
            alert('Gagal menambahkan: ' + (error as any).message);
        }
    };

    const handleEditPaguClick = (sub: any) => {
        setEditingRka({
            id: sub.id,
            nama: sub.kode + ' - ' + sub.nama,
            pagu: sub.paguValidasi
        });
        setEditPaguValue(sub.paguValidasi.toString());
        setIsEditModalOpen(true);
    };

    const handleSavePagu = async () => {
        if (!editingRka) return;

        try {
            const newVal = parseFloat(editPaguValue);
            if (isNaN(newVal) || newVal < 0) {
                alert('Nilai Pagu tidak valid');
                return;
            }

            const { error } = await supabase
                .from('rka_renja')
                .update({ pagu_validasi: newVal })
                .eq('id', editingRka.id);

            if (error) throw error;

            setIsEditModalOpen(false);
            fetchData(); // Refresh to show new value
        } catch (error) {
            console.error('Error update pagu:', error);
            alert('Gagal mengupdate pagu');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Rencana Kerja (RENJA)</h1>
                    <p className="text-gray-500 text-sm">Tahun Anggaran {year}</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                        value={selectedOpdId}
                        onChange={(e) => setSelectedOpdId(e.target.value)}
                    >
                        {opds.map(opd => (
                            <option key={opd.id} value={opd.id}>{opd.nama}</option>
                        ))}
                    </select>
                    <Button onClick={() => setIsAddModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Sub Kegiatan
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden border-none shadow-sm min-h-[400px]">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64 text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin mr-2" />
                            Memuat data Renja...
                        </div>
                    ) : !data || data.length === 0 ? (
                        <div className="flex flex-col justify-center items-center h-64 text-gray-500">
                            <p className="mb-4">Belum ada Sub Kegiatan yang ditambahkan pada OPD ini.</p>
                            <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Mulai Buat RKA
                            </Button>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-white border-b border-gray-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3 font-bold w-[50px] text-center">Aksi</th>
                                    <th scope="col" className="px-6 py-3 font-bold min-w-[400px]">Sub Kegiatan</th>
                                    <th scope="col" className="px-4 py-3 font-bold text-right w-[150px]">Pagu Validasi</th>
                                    <th scope="col" className="px-4 py-3 font-bold text-right w-[150px]">Total Rincian</th>
                                    <th scope="col" className="px-4 py-3 font-bold text-right w-[150px]">Total Realisasi</th>
                                    <th scope="col" className="px-4 py-3 font-bold text-right w-[100px]">Persentase</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {data.map((urusan: any) => (
                                    <React.Fragment key={urusan.kode}>
                                        {/* Level 1: Urusan */}
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <td colSpan={6} className="px-6 py-3 font-bold text-navy-900">
                                                {urusan.kode} - {urusan.nama}
                                            </td>
                                        </tr>

                                        {urusan.programs.map((program: any) => (
                                            <React.Fragment key={program.kode}>
                                                {/* Level 2: Program */}
                                                <tr className="bg-white hover:bg-white border-b border-gray-100">
                                                    <td colSpan={6} className="px-6 py-2 font-semibold text-navy-800 pl-10">
                                                        {program.kode} - {program.nama}
                                                    </td>
                                                </tr>

                                                {program.kegiatans.map((kegiatan: any) => (
                                                    <React.Fragment key={kegiatan.kode}>
                                                        {/* Level 3: Kegiatan */}
                                                        <tr className="bg-white hover:bg-white border-b border-gray-100">
                                                            <td colSpan={6} className="px-6 py-2 font-medium text-navy-700 pl-14 italic">
                                                                {kegiatan.kode} - {kegiatan.nama}
                                                            </td>
                                                        </tr>

                                                        {/* Level 4: Sub Kegiatan */}
                                                        {kegiatan.subKegiatans.map((sub: any) => (
                                                            <tr key={sub.id} className="hover:bg-blue-50/30 transition-colors group">
                                                                <td className="px-6 py-3 text-center">
                                                                    <div className="flex justify-center items-center gap-2">
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-md">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-3 pl-20">
                                                                    <div className="flex items-center gap-2">
                                                                        <Link
                                                                            href={`/rka/input/${sub.id}`}
                                                                            className="text-blue-600 font-medium hover:underline text-sm block"
                                                                        >
                                                                            {sub.kode} <br />
                                                                            <span className="text-gray-600 font-normal">{sub.nama}</span>
                                                                        </Link>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-right text-gray-900 font-medium whitespace-nowrap cursor-pointer hover:bg-yellow-50" onClick={() => handleEditPaguClick(sub)}>
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <span>{formatCurrency(sub.paguValidasi)}</span>
                                                                        <div className="opacity-0 group-hover:opacity-100 text-blue-500">
                                                                            <MoreHorizontal className="w-4 h-4" />
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                                                                    {(() => {
                                                                        const diff = sub.paguValidasi - sub.totalRincian;
                                                                        let colorClass = 'text-gray-900';
                                                                        let label = '';
                                                                        let labelColor = 'text-gray-500';

                                                                        if (sub.paguValidasi > sub.totalRincian) {
                                                                            colorClass = 'text-red-600';
                                                                            label = `Sisa: ${formatCurrency(diff)}`;
                                                                            labelColor = 'text-red-500';
                                                                        } else if (sub.paguValidasi < sub.totalRincian) {
                                                                            colorClass = 'text-green-600';
                                                                            label = `Lebih: ${formatCurrency(Math.abs(diff))}`;
                                                                            labelColor = 'text-green-500';
                                                                        } else {
                                                                            colorClass = 'text-blue-600';
                                                                            label = 'Sesuai';
                                                                            labelColor = 'text-blue-500';
                                                                        }

                                                                        return (
                                                                            <div className="flex flex-col items-end">
                                                                                <span className={colorClass}>{formatCurrency(sub.totalRincian)}</span>
                                                                                {sub.paguValidasi > 0 && (
                                                                                    <span className={`text-[10px] ${labelColor} font-normal`}>
                                                                                        {label}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </td>
                                                                <td className="px-4 py-3 text-right text-gray-500 font-medium whitespace-nowrap">
                                                                    {formatCurrency(sub.totalRealisasi)}
                                                                </td>
                                                                <td className="px-4 py-3 text-right text-gray-500 font-medium whitespace-nowrap">
                                                                    {sub.persentase.toFixed(0)} %
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </React.Fragment>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>

            {/* Add Sub Kegiatan Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Pilih Sub Kegiatan</h3>
                            <button onClick={() => setIsAddModalOpen(false)}><X className="h-5 w-5 text-gray-400" /></button>
                        </div>

                        <div className="p-4 border-b bg-white">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari kode atau nama sub kegiatan..."
                                    className="w-full rounded-md border border-gray-300 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                                    value={subKegiatanSearch}
                                    onChange={(e) => {
                                        setSubKegiatanSearch(e.target.value);
                                        // Debounce could be added here
                                        if (e.target.value.length > 2 || e.target.value.length === 0) {
                                            searchSubKegiatans(e.target.value);
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {isSearchingSub ? (
                                <div className="text-center py-8 text-gray-500">Mencari...</div>
                            ) : masterSubKegiatans.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">Tidak ada data ditemukan.</div>
                            ) : (
                                masterSubKegiatans.map(item => (
                                    <div
                                        key={item.kode}
                                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors flex justify-between items-center"
                                        onClick={() => handleSaveSubKegiatan(item.kode)}
                                    >
                                        <div>
                                            <div className="font-bold text-navy-800 text-sm">{item.kode}</div>
                                            <div className="text-sm text-gray-700">{item.nama}</div>
                                        </div>
                                        <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                                            Pilih
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
                            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Batal</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Pagu Modal */}
            {isEditModalOpen && editingRka && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Edit Pagu Validasi</h3>
                            <button onClick={() => setIsEditModalOpen(false)}><X className="h-5 w-5 text-gray-400" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Sub Kegiatan</label>
                                <p className="text-sm font-medium text-gray-900">{editingRka.nama}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pagu Validasi (Rp)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    value={editPaguValue}
                                    onChange={(e) => setEditPaguValue(e.target.value)}
                                />
                                <p className="text-xs text-gray-500 mt-1">Input angka tanpa pemisah ribuan</p>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Batal</Button>
                            <Button onClick={handleSavePagu} className="bg-navy-700 hover:bg-navy-800">Simpan</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RenjaPage;
