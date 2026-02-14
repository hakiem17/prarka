'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { Plus, Search, Filter, Edit, Trash2, Loader2, X, Save } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const ReferensiProgramPage = () => {
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ id: '', kode: '', nama: '', bidang_urusan_kode: '' });
    const [isEditing, setIsEditing] = useState(false);

    // Data State
    const [searchTerm, setSearchTerm] = useState('');
    const [groups, setGroups] = useState<any[]>([]);
    const [bidangUrusans, setBidangUrusans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch data from Supabase
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch Programs joined with Bidang Urusan
            const { data: programs, error } = await supabase
                .from('master_programs')
                .select(`
                    kode,
                    nama,
                    bidang_urusan_kode,
                    master_bidang_urusans (
                        kode,
                        nama
                    )
                `)
                .order('kode');

            if (error) throw error;

            if (programs) {
                // Grouping logic: Group by Bidang Urusan
                const grouped = programs.reduce((acc: any, curr: any) => {
                    const bidang = curr.master_bidang_urusans;
                    // Fallback in case of missing relation
                    const bidangKey = bidang ? bidang.kode : 'UNKNOWN';
                    const bidangTitle = bidang ? `${bidang.kode} ${bidang.nama}` : 'Uncategorized';

                    if (!acc[bidangKey]) {
                        acc[bidangKey] = {
                            bidang: bidangTitle,
                            programs: []
                        };
                    }

                    acc[bidangKey].programs.push({
                        kode: curr.kode,
                        nama: curr.nama,
                        bidang_urusan_kode: curr.bidang_urusan_kode
                    });

                    return acc;
                }, {});

                // Convert to array and sort by Bidang Kode
                const sortedGroups = Object.keys(grouped).sort().map(key => grouped[key]);
                setGroups(sortedGroups);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchBidangUrusans = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('master_bidang_urusans')
                .select('kode, nama')
                .order('kode');

            if (error) throw error;
            if (data) setBidangUrusans(data);
        } catch (error) {
            console.error('Error fetching bidang urusans:', error);
        }
    }, []);

    useEffect(() => {
        fetchData();
        fetchBidangUrusans();
    }, [fetchData, fetchBidangUrusans]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (isEditing) {
                const { error } = await supabase
                    .from('master_programs')
                    .update({
                        kode: formData.kode,
                        nama: formData.nama,
                        bidang_urusan_kode: formData.bidang_urusan_kode
                    })
                    .eq('kode', formData.id);

                if (error) throw error;
                alert('Data berhasil diperbarui');
            } else {
                const { error } = await supabase
                    .from('master_programs')
                    .insert([{
                        kode: formData.kode,
                        nama: formData.nama,
                        bidang_urusan_kode: formData.bidang_urusan_kode
                    }]);

                if (error) throw error;
                alert('Data berhasil disimpan');
            }

            setIsModalOpen(false);
            setFormData({ id: '', kode: '', nama: '', bidang_urusan_kode: '' });
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
                .from('master_programs')
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
            bidang_urusan_kode: item.bidang_urusan_kode
        });
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setFormData({ id: '', kode: '', nama: '', bidang_urusan_kode: '' });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    // Filter logic
    const filteredData = groups.map(group => ({
        ...group,
        programs: group.programs.filter((p: any) =>
            p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.kode.includes(searchTerm) ||
            group.bidang.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(group => group.programs.length > 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Referensi Program</h1>
                    <p className="text-gray-500 text-sm">Daftar Program Urusan Pemerintahan Daerah</p>
                </div>
                <Button onClick={handleAddNew}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Program
                </Button>
            </div>

            <Card>
                <CardHeader className="py-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
                    <CardTitle className="text-base font-medium">Data Program</CardTitle>
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari program..."
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
                                {filteredData.map((group, index) => (
                                    <div key={index} className="bg-white">
                                        <div className="bg-navy-50/30 px-6 py-3 border-b border-gray-100">
                                            <h3 className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                                                {group.bidang}
                                            </h3>
                                        </div>
                                        <Table>
                                            <TableBody>
                                                {group.programs.map((program: any) => (
                                                    <TableRow key={program.kode} className="hover:bg-gray-50/50 group">
                                                        <TableCell className="w-[120px] font-medium text-navy-700 align-top">
                                                            <span className="bg-white text-navy-700 py-1 px-2 rounded text-xs font-bold border border-gray-200 shadow-sm block w-fit">
                                                                {program.kode}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-gray-700 align-middle">
                                                            {program.nama}
                                                        </TableCell>
                                                        <TableCell className="w-[100px] text-right">
                                                            <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 hover:text-blue-600"
                                                                    onClick={() => handleEdit(program)}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 hover:text-red-600"
                                                                    onClick={() => handleDelete(program.kode)}
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
                            {filteredData.length === 0 && !isLoading && (
                                <div className="p-8 text-center text-gray-500">
                                    Tidak ada data program yang ditemukan.
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
                                {isEditing ? 'Edit Program' : 'Tambah Program'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 focus:outline-none">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bidang Urusan Induk</label>
                                    <select
                                        value={formData.bidang_urusan_kode}
                                        onChange={(e) => setFormData({ ...formData, bidang_urusan_kode: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-navy-500 focus:border-transparent outline-none transition-all bg-white"
                                        required
                                    >
                                        <option value="">Pilih Bidang Urusan</option>
                                        {bidangUrusans.map((b) => (
                                            <option key={b.kode} value={b.kode}>
                                                {b.kode} - {b.nama}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kode Program</label>
                                    <input
                                        type="text"
                                        value={formData.kode}
                                        onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-navy-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Contoh: 2.19.01"
                                        required
                                        disabled={isEditing}
                                    />
                                    {isEditing && <p className="text-xs text-gray-500 mt-1">Kode tidak dapat diubah</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Program</label>
                                    <input
                                        type="text"
                                        value={formData.nama}
                                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-navy-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Contoh: PROGRAM PENUNJANG URUSAN..."
                                        required
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

export default ReferensiProgramPage;
