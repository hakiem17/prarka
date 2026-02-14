'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { Plus, Search, Filter, Edit, Trash2, Loader2, X, Save } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const ReferensiSubKegiatanPage = () => {
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        kode: '',
        nama: '',
        kegiatan_kode: '',
        kinerja: '',
        satuan: ''
    });
    const [isEditing, setIsEditing] = useState(false);

    // Data State
    const [searchTerm, setSearchTerm] = useState('');
    const [groups, setGroups] = useState<any[]>([]);
    const [kegiatans, setKegiatans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch data from Supabase
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch Sub Kegiatans joined with parents
            const { data: subKegiatans, error } = await supabase
                .from('master_sub_kegiatans')
                .select(`
                    kode,
                    nama,
                    kinerja,
                    satuan,
                    kegiatan_kode,
                    master_kegiatans (
                        kode,
                        nama,
                        master_programs (
                            kode,
                            nama,
                            master_bidang_urusans (
                                kode,
                                nama
                            )
                        )
                    )
                `)
                .order('kode');

            if (error) throw error;

            if (subKegiatans) {
                // Grouping logic: Bidang -> Program -> Kegiatan -> Sub Kegiatan
                const grouped: Record<string, any> = {};

                subKegiatans.forEach((sub: any) => {
                    const kegiatan = sub.master_kegiatans;
                    const program = kegiatan?.master_programs;
                    const bidang = program?.master_bidang_urusans;

                    // Skip if relationships are missing
                    if (!kegiatan || !program || !bidang) return;

                    const bidangKey = bidang.kode;
                    const programKey = program.kode;
                    const kegiatanKey = kegiatan.kode;

                    // Level 1: Bidang
                    if (!grouped[bidangKey]) {
                        grouped[bidangKey] = {
                            bidang: `${bidang.kode} ${bidang.nama}`,
                            programs: {}
                        };
                    }

                    // Level 2: Program
                    if (!grouped[bidangKey].programs[programKey]) {
                        grouped[bidangKey].programs[programKey] = {
                            program: `${program.kode} ${program.nama}`,
                            kegiatans: {}
                        };
                    }

                    // Level 3: Kegiatan
                    if (!grouped[bidangKey].programs[programKey].kegiatans[kegiatanKey]) {
                        grouped[bidangKey].programs[programKey].kegiatans[kegiatanKey] = {
                            kegiatan: `${kegiatan.kode} ${kegiatan.nama}`,
                            subKegiatans: []
                        };
                    }

                    // Level 4: Sub Kegiatan
                    grouped[bidangKey].programs[programKey].kegiatans[kegiatanKey].subKegiatans.push({
                        kode: sub.kode,
                        nama: sub.nama,
                        kinerja: sub.kinerja,
                        satuan: sub.satuan,
                        kegiatan_kode: sub.kegiatan_kode
                    });
                });

                // Transform to array
                const result = Object.keys(grouped).sort().map(bidangKey => {
                    const bidangGroup = grouped[bidangKey];
                    const programsArray = Object.keys(bidangGroup.programs).sort().map(progKey => {
                        const progGroup = bidangGroup.programs[progKey];
                        const kegiatansArray = Object.keys(progGroup.kegiatans).sort().map(kegKey =>
                            progGroup.kegiatans[kegKey]
                        );
                        return {
                            program: progGroup.program,
                            kegiatans: kegiatansArray
                        };
                    });
                    return {
                        bidang: bidangGroup.bidang,
                        programs: programsArray
                    };
                });

                setGroups(result);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchKegiatans = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('master_kegiatans')
                .select('kode, nama')
                .order('kode');

            if (error) throw error;
            if (data) setKegiatans(data);
        } catch (error) {
            console.error('Error fetching kegiatans:', error);
        }
    }, []);

    useEffect(() => {
        fetchData();
        fetchKegiatans();
    }, [fetchData, fetchKegiatans]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (isEditing) {
                const { error } = await supabase
                    .from('master_sub_kegiatans')
                    .update({
                        kode: formData.kode,
                        nama: formData.nama,
                        kegiatan_kode: formData.kegiatan_kode,
                        kinerja: formData.kinerja,
                        satuan: formData.satuan
                    })
                    .eq('kode', formData.id);

                if (error) throw error;
                alert('Data berhasil diperbarui');
            } else {
                const { error } = await supabase
                    .from('master_sub_kegiatans')
                    .insert([{
                        kode: formData.kode,
                        nama: formData.nama,
                        kegiatan_kode: formData.kegiatan_kode,
                        kinerja: formData.kinerja,
                        satuan: formData.satuan
                    }]);

                if (error) throw error;
                alert('Data berhasil disimpan');
            }

            setIsModalOpen(false);
            setFormData({ id: '', kode: '', nama: '', kegiatan_kode: '', kinerja: '', satuan: '' });
            setIsEditing(false);
            fetchData();
        } catch (error) {
            console.error('Error saving data:', error);
            alert('Gagal menyimpan data: ' + (error as any).message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (kode: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;

        try {
            const { error } = await supabase
                .from('master_sub_kegiatans')
                .delete()
                .eq('kode', kode);

            if (error) throw error;
            alert('Data berhasil dihapus');
            fetchData();
        } catch (error) {
            console.error('Error deleting data:', error);
            alert('Gagal menghapus data: ' + (error as any).message);
        }
    };

    const handleEdit = (item: any) => {
        setFormData({
            id: item.kode,
            kode: item.kode,
            nama: item.nama,
            kegiatan_kode: item.kegiatan_kode,
            kinerja: item.kinerja || '',
            satuan: item.satuan || ''
        });
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setFormData({ id: '', kode: '', nama: '', kegiatan_kode: '', kinerja: '', satuan: '' });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    // Filter logic
    const filteredData = groups.map(group => ({
        ...group,
        programs: group.programs.map((prog: any) => ({
            ...prog,
            kegiatans: prog.kegiatans.map((keg: any) => ({
                ...keg,
                subKegiatans: keg.subKegiatans.filter((sub: any) =>
                    sub.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    sub.kode.includes(searchTerm) ||
                    keg.kegiatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    prog.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    group.bidang.toLowerCase().includes(searchTerm.toLowerCase())
                )
            })).filter((keg: any) => keg.subKegiatans.length > 0)
        })).filter((prog: any) => prog.kegiatans.length > 0)
    })).filter(group => group.programs.length > 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Referensi Sub Kegiatan</h1>
                    <p className="text-gray-500 text-sm">Daftar Sub Kegiatan Anggaran</p>
                </div>
                <Button onClick={handleAddNew}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Sub Kegiatan
                </Button>
            </div>

            <Card>
                <CardHeader className="py-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
                    <CardTitle className="text-base font-medium">Data Sub Kegiatan</CardTitle>
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari sub kegiatan..."
                                className="w-full rounded-md border border-gray-300 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex justify-center items-center p-8 text-gray-400">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            Loading data...
                        </div>
                    ) : (
                        <>
                            <div className="divide-y divide-gray-100">
                                {filteredData.map((group, gIdx) => (
                                    <div key={gIdx} className="bg-white">
                                        <div className="bg-navy-50/50 px-6 py-3 border-b border-gray-100">
                                            <h3 className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                                                {group.bidang}
                                            </h3>
                                        </div>
                                        {group.programs.map((prog: any, pIdx: number) => (
                                            <div key={pIdx}>
                                                <div className="bg-gray-50 px-6 py-2 border-b border-gray-100">
                                                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                        {prog.program}
                                                    </h4>
                                                </div>
                                                {prog.kegiatans.map((keg: any, kIdx: number) => (
                                                    <div key={kIdx} className="border-b border-gray-50 last:border-0">
                                                        <div className="bg-white px-6 py-2 border-b border-gray-100 pl-10">
                                                            <h5 className="text-sm font-medium text-navy-700">
                                                                {keg.kegiatan}
                                                            </h5>
                                                        </div>
                                                        <Table>
                                                            <TableBody>
                                                                {keg.subKegiatans.map((sub: any) => (
                                                                    <TableRow key={sub.kode} className="hover:bg-gray-50/50 group">
                                                                        <TableCell className="w-[180px] font-medium text-navy-700 align-top">
                                                                            <span className="bg-white text-navy-700 py-1 px-2 rounded text-xs font-bold border border-gray-200 shadow-sm block w-fit">
                                                                                {sub.kode}
                                                                            </span>
                                                                        </TableCell>
                                                                        <TableCell className="text-gray-700 align-middle">
                                                                            <div>
                                                                                <div className="font-medium">{sub.nama}</div>
                                                                                {(sub.kinerja || sub.satuan) && (
                                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                                        {sub.kinerja && `Kinerja: ${sub.kinerja}`}
                                                                                        {sub.kinerja && sub.satuan && ' | '}
                                                                                        {sub.satuan && `Satuan: ${sub.satuan}`}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="w-[100px] text-right">
                                                                            <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-8 w-8 hover:text-blue-600"
                                                                                    onClick={() => handleEdit(sub)}
                                                                                >
                                                                                    <Edit className="h-4 w-4" />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-8 w-8 hover:text-red-600"
                                                                                    onClick={() => handleDelete(sub.kode)}
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                            {filteredData.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    Tidak ada data sub kegiatan yang ditemukan.
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Modal Input */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-200">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">
                                {isEditing ? 'Edit Sub Kegiatan' : 'Tambah Sub Kegiatan'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 focus:outline-none">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kegiatan Induk</label>
                                    <select
                                        value={formData.kegiatan_kode}
                                        onChange={(e) => setFormData({ ...formData, kegiatan_kode: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-navy-500 focus:border-transparent outline-none transition-all bg-white"
                                        required
                                    >
                                        <option value="">Pilih Kegiatan</option>
                                        {kegiatans.map((k) => (
                                            <option key={k.kode} value={k.kode}>
                                                {k.kode} - {k.nama}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kode Sub Kegiatan</label>
                                    <input
                                        type="text"
                                        value={formData.kode}
                                        onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-navy-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Contoh: 2.19.01.2.01.0001"
                                        required
                                        disabled={isEditing}
                                    />
                                    {isEditing && <p className="text-xs text-gray-500 mt-1">Kode tidak dapat diubah</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sub Kegiatan</label>
                                    <textarea
                                        value={formData.nama}
                                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-navy-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Nama Sub Kegiatan..."
                                        rows={2}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Indikator Kinerja</label>
                                    <input
                                        type="text"
                                        value={formData.kinerja}
                                        onChange={(e) => setFormData({ ...formData, kinerja: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-navy-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Contoh: Jumlah Laporan..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label>
                                    <input
                                        type="text"
                                        value={formData.satuan}
                                        onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-navy-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Contoh: Dokumen, Orang/Bulan"
                                    />
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 border-t border-gray-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={isSaving}
                                >
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Simpan
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReferensiSubKegiatanPage;
