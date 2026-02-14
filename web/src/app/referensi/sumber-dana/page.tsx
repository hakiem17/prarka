'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Plus, Search, Filter, Edit, Trash2, Loader2, X, Save, Check, Ban } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const ReferensiSumberDanaPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ id: 0, kode: '', nama: '', is_input: true });
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: sumberDana, error } = await supabase
                .from('master_sumber_dana')
                .select('*')
                .order('kode');

            if (error) throw error;
            if (sumberDana) setData(sumberDana);
        } catch (error) {
            console.error('Error fetching data:', error);
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
                const { error } = await supabase
                    .from('master_sumber_dana')
                    .update({
                        kode: formData.kode,
                        nama: formData.nama,
                        is_input: formData.is_input
                    })
                    .eq('id', formData.id);

                if (error) throw error;
                alert('Data berhasil diperbarui');
            } else {
                const { error } = await supabase
                    .from('master_sumber_dana')
                    .insert([{
                        kode: formData.kode,
                        nama: formData.nama,
                        is_input: formData.is_input
                    }]);

                if (error) throw error;
                alert('Data berhasil disimpan');
            }

            setIsModalOpen(false);
            setFormData({ id: 0, kode: '', nama: '', is_input: true });
            setIsEditing(false);
            fetchData();
        } catch (error) {
            console.error('Error saving data:', error);
            alert('Gagal menyimpan data: ' + (error as any).message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;

        try {
            const { error } = await supabase
                .from('master_sumber_dana')
                .delete()
                .eq('id', id);

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
            id: item.id,
            kode: item.kode || '',
            nama: item.nama,
            is_input: item.is_input ?? true
        });
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setFormData({ id: 0, kode: '', nama: '', is_input: true });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const filteredData = data.filter(item =>
        item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.kode && item.kode.includes(searchTerm))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Sumber Dana</h1>
                    <p className="text-gray-500 text-sm">Daftar Sumber Pendanaan Daerah</p>
                </div>
                <Button onClick={handleAddNew}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Sumber Dana
                </Button>
            </div>

            <Card>
                <CardHeader className="py-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
                    <CardTitle className="text-base font-medium">Data Sumber Dana</CardTitle>
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari sumber dana..."
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
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="w-[150px] text-navy-900 font-semibold">Kode Dana</TableHead>
                                    <TableHead className="text-navy-900 font-semibold">Sumber Dana</TableHead>
                                    <TableHead className="w-[100px] text-center text-navy-900 font-semibold">Set Input</TableHead>
                                    <TableHead className="w-[100px] text-right text-navy-900 font-semibold">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((item, index) => (
                                    <TableRow key={index} className="hover:bg-gray-50/50 group">
                                        <TableCell className="font-medium text-gray-900">
                                            {item.kode || '-'}
                                        </TableCell>
                                        <TableCell className="text-gray-700">
                                            {item.nama}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.is_input ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {item.is_input ? 'Ya' : 'Tidak'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
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
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredData.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                            Tidak ada data sumber dana yang ditemukan.
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
                                {isEditing ? 'Edit Sumber Dana' : 'Tambah Sumber Dana'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 focus:outline-none">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kode Dana</label>
                                    <input
                                        type="text"
                                        value={formData.kode}
                                        onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-navy-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Contoh: 1.2.01.08"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Kosongkan jika ingin auto-generated (tergantung sistem)</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sumber Dana</label>
                                    <textarea
                                        value={formData.nama}
                                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-navy-500 focus:border-transparent outline-none transition-all"
                                        placeholder="[Kategori] - Nama Sumber Dana..."
                                        rows={2}
                                        required
                                    />
                                </div>
                                <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-md border border-gray-100">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="is_input"
                                            type="checkbox"
                                            checked={formData.is_input}
                                            onChange={(e) => setFormData({ ...formData, is_input: e.target.checked })}
                                            className="focus:ring-navy-500 h-4 w-4 text-navy-600 border-gray-300 rounded"
                                        />
                                    </div>
                                    <div className="ml-0">
                                        <label htmlFor="is_input" className="text-sm font-medium text-gray-700">Set Input</label>
                                        <p className="text-xs text-gray-500">Centang jika sumber dana ini dapat digunakan untuk transaksi</p>
                                    </div>
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

export default ReferensiSumberDanaPage;
