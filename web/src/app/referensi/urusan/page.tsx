'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { Plus, Search, Filter, Edit, Trash2, Loader2, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const UrusanPage = () => {
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ id: '', kode: '', nama: '' });
    const [isEditing, setIsEditing] = useState(false);

    // Data State
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Fetch data from Supabase
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: urusans, error } = await supabase
                .from('master_urusans')
                .select('*')
                .order('kode');

            if (error) throw error;
            if (urusans) setData(urusans);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Gagal mengambil data: ' + (error as any).message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (isEditing) {
                // Update existing
                const { error } = await supabase
                    .from('master_urusans')
                    .update({ kode: formData.kode, nama: formData.nama })
                    .eq('kode', formData.id); // Assuming 'kode' is the primary or unique key we use for identification

                if (error) throw error;
                alert('Data berhasil diperbarui');
            } else {
                // Create new
                const { error } = await supabase
                    .from('master_urusans')
                    .insert([{ kode: formData.kode, nama: formData.nama }]);

                if (error) throw error;
                alert('Data berhasil disimpan');
            }

            setIsModalOpen(false);
            setFormData({ id: '', kode: '', nama: '' });
            setIsEditing(false);
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Error saving data:', error);
            alert('Gagal menympan data: ' + (error as any).message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (kode: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;

        try {
            const { error } = await supabase
                .from('master_urusans')
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
        setFormData({ id: item.kode, kode: item.kode, nama: item.nama });
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setFormData({ id: '', kode: '', nama: '' });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const filteredData = data.filter(item =>
        item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kode.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Master Urusan</h1>
                    <p className="text-gray-500 text-sm">Daftar Urusan Pemerintahan</p>
                </div>
                <Button onClick={handleAddNew}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Urusan
                </Button>
            </div>

            <Card>
                <CardHeader className="py-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
                    <CardTitle className="text-base font-medium">Data Urusan</CardTitle>
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari urusan..."
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
                        <Table>
                            <TableBody>
                                {filteredData.map((item) => (
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
                                {filteredData.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                                            Tidak ada data urusan yang ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Modal Input */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-200">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">
                                {isEditing ? 'Edit Urusan' : 'Tambah Urusan'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 focus:outline-none">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kode Urusan</label>
                                    <input
                                        type="text"
                                        value={formData.kode}
                                        onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-navy-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Contoh: 1"
                                        required
                                        disabled={isEditing} // Disable editing key for now to simplify
                                    />
                                    {isEditing && <p className="text-xs text-gray-500 mt-1">Kode tidak dapat diubah</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Urusan</label>
                                    <input
                                        type="text"
                                        value={formData.nama}
                                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-navy-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Contoh: URUSAN PEMERINTAHAN WAJIB..."
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

export default UrusanPage;
