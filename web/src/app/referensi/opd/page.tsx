'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Search, Edit, Trash2, Plus, Loader2, X, Trash } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import SpreadsheetUpload from '@/components/SpreadsheetUpload';

export default function MasterOPDPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        id: 0,
        kode: '',
        nama: '',
        singkatan: ''
    });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('opds')
                .select('*')
                .order('kode', { ascending: true });

            if (searchTerm) {
                query = query.or(`nama.ilike.%${searchTerm}%,kode.ilike.%${searchTerm}%`);
            }

            const { data: opds, error } = await query;

            if (error) throw error;
            setData(opds || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpload = async (rows: any[]) => {
        setIsLoading(true);
        try {
            const mappedData = rows.map(row => {
                const getVal = (keys: string[]) => {
                    for (const k of keys) {
                        const val = row[k] || row[k.toLowerCase()] || row[k.toUpperCase()];
                        if (val !== undefined) return val;
                    }
                    return null;
                };

                return {
                    kode: getVal(['Kode', 'kode', 'KODE', 'Kode OPD']) || '',
                    nama: getVal(['Nama', 'nama', 'NAMA', 'Nama OPD', 'Uraian', 'URAIAN']) || '',
                    singkatan: getVal(['Singkatan', 'singkatan', 'SINGKATAN']) || ''
                };
            }).filter(item => item.nama && item.kode);

            if (mappedData.length === 0) {
                alert('Tidak ada data valid yang ditemukan via upload.');
                return;
            }

            const { error } = await supabase.from('opds').insert(mappedData);
            if (error) throw error;

            alert(`Berhasil mengimpor ${mappedData.length} OPD.`);
            fetchData();
        } catch (error) {
            console.error('Error importing data:', error);
            alert('Gagal mengimpor data: ' + (error as any).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearData = async () => {
        if (!confirm('PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data OPD? Tindakan ini akan menghapus semua RKA yang terkait!')) return;

        setIsLoading(true);
        try {
            const { error } = await supabase.from('opds').delete().gt('id', 0);
            if (error) throw error;
            alert('Semua data OPD berhasil dihapus.');
            fetchData();
        } catch (error) {
            alert('Gagal menghapus data: ' + (error as any).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (isEditing) {
                const { error } = await supabase
                    .from('opds')
                    .update({
                        kode: formData.kode,
                        nama: formData.nama,
                        singkatan: formData.singkatan
                    })
                    .eq('id', formData.id);
                if (error) throw error;
                alert('Data berhasil diperbarui');
            } else {
                const { error } = await supabase
                    .from('opds')
                    .insert([{
                        kode: formData.kode,
                        nama: formData.nama,
                        singkatan: formData.singkatan
                    }]);
                if (error) throw error;
                alert('Data berhasil disimpan');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error saving:', error);
            alert('Gagal menyimpan: ' + (error as any).message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus OPD ini?')) return;
        try {
            const { error } = await supabase.from('opds').delete().eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (error) {
            alert('Gagal menghapus: ' + (error as any).message);
        }
    };

    const handleAddNew = () => {
        setFormData({ id: 0, kode: '', nama: '', singkatan: '' });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const handleEdit = (item: any) => {
        setFormData({ ...item });
        setIsEditing(true);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Master OPD</h1>
                    <p className="text-gray-500 text-sm">Organisasi Perangkat Daerah</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="destructive" onClick={handleClearData} className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-100 border">
                        <Trash className="w-4 h-4 mr-2" />
                        Hapus Semua
                    </Button>
                    <Button onClick={handleAddNew}>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah OPD
                    </Button>
                    <SpreadsheetUpload onUpload={handleUpload} label="Import Excel" />
                </div>
            </div>

            <Card>
                <CardHeader className="py-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
                    <CardTitle className="text-base font-medium">Daftar OPD <span className="text-xs text-gray-400 font-normal ml-2">(Total: {data.length})</span></CardTitle>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari nama atau kode..."
                            className="w-full rounded-md border border-gray-300 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex justify-center items-center p-8 text-gray-400">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            Loading data...
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="font-semibold text-navy-900 w-[150px]">Kode</TableHead>
                                    <TableHead className="font-semibold text-navy-900">Nama OPD</TableHead>
                                    <TableHead className="font-semibold text-navy-900 w-[150px]">Singkatan</TableHead>
                                    <TableHead className="font-semibold text-navy-900 text-right w-[100px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-gray-50/50 group">
                                        <TableCell className="font-medium text-gray-700 align-top">{item.kode}</TableCell>
                                        <TableCell className="text-gray-900 align-top font-medium">{item.nama}</TableCell>
                                        <TableCell className="text-gray-600 align-top">{item.singkatan}</TableCell>
                                        <TableCell className="text-right align-top">
                                            <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-600" onClick={() => handleEdit(item)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600" onClick={() => handleDelete(item.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                            Belum ada data OPD. Silakan tambah atau import.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">{isEditing ? 'Edit OPD' : 'Tambah OPD Baru'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="h-5 w-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kode OPD</label>
                                <input
                                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                                    value={formData.kode}
                                    onChange={e => setFormData({ ...formData, kode: e.target.value })}
                                    placeholder="Contoh: 2.16.2.20.2.21.03.0000"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama OPD</label>
                                <input
                                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                                    value={formData.nama}
                                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                                    placeholder="Contoh: Dinas Komunikasi dan Informatika"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Singkatan (Opsional)</label>
                                <input
                                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                                    value={formData.singkatan}
                                    onChange={e => setFormData({ ...formData, singkatan: e.target.value })}
                                    placeholder="Contoh: DISKOMINFO"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                                <Button type="submit" disabled={isSaving} className="bg-navy-600 hover:bg-navy-700">
                                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
