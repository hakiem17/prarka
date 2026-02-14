'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { Plus, X, Save, Edit, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const BidangUrusanPage = () => {
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ id: '', kode: '', nama: '', urusan_kode: '' });
    const [isEditing, setIsEditing] = useState(false);

    // Data State
    const [groups, setGroups] = useState<any[]>([]);
    const [urusans, setUrusans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch data from Supabase
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch Bidang Urusan joined with Urusan
            const { data: bidangs, error } = await supabase
                .from('master_bidang_urusans')
                .select(`
                    kode,
                    nama,
                    urusan_kode,
                    master_urusans (
                        kode,
                        nama
                    )
                `)
                .order('kode');

            if (error) throw error;

            if (bidangs) {
                // Grouping logic: Group by Urusan
                const grouped = bidangs.reduce((acc: any, curr: any) => {
                    const urusan = curr.master_urusans;
                    const urusanKey = urusan ? urusan.kode : 'UNKNOWN';
                    const urusanTitle = urusan ? `${urusan.kode} ${urusan.nama}` : 'Uncategorized';

                    if (!acc[urusanKey]) {
                        acc[urusanKey] = {
                            title: urusanTitle,
                            items: []
                        };
                    }

                    acc[urusanKey].items.push({
                        kode: curr.kode,
                        nama: curr.nama,
                        urusan_kode: curr.urusan_kode
                    });

                    return acc;
                }, {});

                const sortedGroups = Object.keys(grouped).sort().map(key => grouped[key]);
                setGroups(sortedGroups);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchUrusans = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('master_urusans')
                .select('kode, nama')
                .order('kode');

            if (error) throw error;
            if (data) setUrusans(data);
        } catch (error) {
            console.error('Error fetching urusans:', error);
        }
    }, []);

    useEffect(() => {
        fetchData();
        fetchUrusans();
    }, [fetchData, fetchUrusans]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (isEditing) {
                const { error } = await supabase
                    .from('master_bidang_urusans')
                    .update({
                        kode: formData.kode,
                        nama: formData.nama,
                        urusan_kode: formData.urusan_kode
                    })
                    .eq('kode', formData.id);

                if (error) throw error;
                alert('Data berhasil diperbarui');
            } else {
                const { error } = await supabase
                    .from('master_bidang_urusans')
                    .insert([{
                        kode: formData.kode,
                        nama: formData.nama,
                        urusan_kode: formData.urusan_kode
                    }]);

                if (error) throw error;
                alert('Data berhasil disimpan');
            }

            setIsModalOpen(false);
            setFormData({ id: '', kode: '', nama: '', urusan_kode: '' });
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
                .from('master_bidang_urusans')
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
            urusan_kode: item.urusan_kode
        });
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setFormData({ id: '', kode: '', nama: '', urusan_kode: '' });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Bidang Urusan</h1>
                    <p className="text-gray-500 text-sm">Dinas Komunikasi, Informatika, Statistik, dan Persandian</p>
                </div>
                <Button onClick={handleAddNew}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Bidang
                </Button>
            </div>

            <Card>
                <CardHeader className="py-4 border-b border-gray-100 bg-gray-50/50">
                    <CardTitle className="text-base font-medium">Data Bidang Urusan</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex justify-center items-center p-8 text-gray-400">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            Loading data...
                        </div>
                    ) : groups.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            Tidak ada data Bidang Urusan. Pastikan database Master Data sudah terisi.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {groups.map((group, index) => (
                                <div key={index} className="bg-white">
                                    <div className="bg-navy-50/30 px-6 py-3 border-b border-gray-100">
                                        <h3 className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                                            {group.title}
                                        </h3>
                                    </div>
                                    <Table>
                                        <TableBody>
                                            {group.items.map((item: any) => (
                                                <TableRow key={item.kode} className="hover:bg-gray-50/50 group">
                                                    <TableCell className="w-[100px] font-medium text-navy-700 align-top">
                                                        <span className="bg-white text-navy-700 py-1 px-2 rounded text-xs font-bold border border-gray-200 shadow-sm block w-fit">
                                                            {item.kode}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-gray-700 align-middle">
                                                        {item.nama}
                                                    </TableCell>
                                                    <TableCell className="w-[100px] text-right">
                                                        <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 hover:text-blue-600"
                                                                onClick={() => handleEdit(item)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 hover:text-red-600"
                                                                onClick={() => handleDelete(item.kode)}
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
                    )}
                </CardContent>
            </Card>

            {/* Modal Input */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-200">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">
                                {isEditing ? 'Edit Bidang Urusan' : 'Tambah Bidang Urusan'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 focus:outline-none">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Urusan Induk</label>
                                    <select
                                        value={formData.urusan_kode}
                                        onChange={(e) => setFormData({ ...formData, urusan_kode: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-navy-500 focus:border-transparent outline-none transition-all bg-white"
                                        required
                                    >
                                        <option value="">Pilih Urusan</option>
                                        {urusans.map((u) => (
                                            <option key={u.kode} value={u.kode}>
                                                {u.kode} - {u.nama}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kode Bidang</label>
                                    <input
                                        type="text"
                                        value={formData.kode}
                                        onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-navy-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Contoh: 2.19"
                                        required
                                        disabled={isEditing}
                                    />
                                    {isEditing && <p className="text-xs text-gray-500 mt-1">Kode tidak dapat diubah</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bidang Urusan</label>
                                    <input
                                        type="text"
                                        value={formData.nama}
                                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-navy-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Contoh: URUSAN PEMERINTAHAN BIDANG ..."
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

export default BidangUrusanPage;
