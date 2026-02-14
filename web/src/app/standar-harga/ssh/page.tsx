'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Search, Filter, Settings, Edit, Trash2, Plus, Loader2, X, Save, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Trash } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import SpreadsheetUpload from '@/components/SpreadsheetUpload';

export default function SshPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        id: 0,
        kode_kelompok_barang: '',
        uraian_kelompok_barang: '',
        kode_barang: '',
        uraian_barang: '',
        spesifikasi: '',
        satuan: '',
        harga_satuan: 0,
        kode_rekening: '',
        tahun: new Date().getFullYear()
    });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const from = (currentPage - 1) * itemsPerPage;
            const to = from + itemsPerPage - 1;

            let query = supabase
                .from('ssh')
                .select('*', { count: 'exact' });

            if (searchTerm.length > 2) {
                query = query.or(`uraian_barang.ilike.%${searchTerm}%,kode_barang.ilike.%${searchTerm}%`);
            }

            const { data: ssh, count, error } = await query
                .order('kode_barang', { ascending: true })
                .range(from, to);

            if (error) throw error;

            if (ssh) setData(ssh);
            if (count !== null) setTotalItems(count);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, itemsPerPage, searchTerm]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        setCurrentPage(1); // Reset to first page on search
    };

    const handleUpload = async (rows: any[]) => {
        setIsLoading(true);
        try {
            // Map keys loosely
            const mappedData = rows.map(row => {
                const getVal = (keys: string[]) => {
                    for (const k of keys) {
                        const val = row[k] || row[k.toLowerCase()] || row[k.toUpperCase()];
                        if (val !== undefined) return val;
                    }
                    return null;
                };

                return {
                    kode_kelompok_barang: getVal(['Kode Kelompok', 'kode_kelompok_barang', 'KODE KELOMPOK', 'KODE KELOMPOK BARANG']) || '',
                    uraian_kelompok_barang: getVal(['Uraian Kelompok', 'uraian_kelompok_barang', 'URAIAN KELOMPOK', 'URAIAN KELOMPOK BARANG']) || '',
                    kode_barang: getVal(['Kode Barang', 'kode_barang', 'KODE BARANG']) || '',
                    uraian_barang: getVal(['Uraian Barang', 'uraian_barang', 'Nama Barang', 'URAIAN BARANG']) || '',
                    spesifikasi: getVal(['Spesifikasi', 'spesifikasi', 'SPESIFIKASI']) || '',
                    satuan: getVal(['Satuan', 'satuan', 'SATUAN']) || '',
                    harga_satuan: parseFloat(getVal(['Harga Satuan', 'harga', 'HARGA', 'Harga', 'HARGA SATUAN']) || 0),
                    kode_rekening: getVal(['Kode Rekening', 'kode_rekening', 'KODE REKENING']) || '',
                    tahun: new Date().getFullYear()
                };
            }).filter(item => item.uraian_barang); // Ensure valid rows

            // Batch insert (chunks of 100 to avoid payload limits)
            const chunkSize = 100;
            for (let i = 0; i < mappedData.length; i += chunkSize) {
                const chunk = mappedData.slice(i, i + chunkSize);
                const { error } = await supabase.from('ssh').insert(chunk);
                if (error) throw error;
            }

            alert(`Berhasil mengimpor ${mappedData.length} data.`);
            fetchData();
        } catch (error) {
            console.error('Error importing data:', error);
            alert('Gagal mengimpor data: ' + (error as any).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearData = async () => {
        if (!confirm('PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data SSH? Tindakan ini tidak dapat dibatalkan.')) return;

        setIsLoading(true);
        try {
            // Delete all rows
            const { error } = await supabase.from('ssh').delete().neq('id', 0); // Hack to delete all since we need a where clause usually, or just use a dummy one if RLS allows

            // If neq 0 doesn't work well without specific RLS, we might need another approach. 
            // Better approach for 'delete all' often requires RLS to allow it or a specific function.
            // Using 'gt 0' assuming IDs are positive integers.
            const { error: deleteError } = await supabase.from('ssh').delete().gt('id', 0);

            if (deleteError) throw deleteError;

            alert('Semua data berhasil dihapus.');
            setTotalItems(0);
            setData([]);
            setCurrentPage(1);
        } catch (error) {
            console.error('Error clearing data:', error);
            alert('Gagal menghapus data: ' + (error as any).message);
        } finally {
            setIsLoading(false);
            fetchData();
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (isEditing) {
                const { error } = await supabase
                    .from('ssh')
                    .update({
                        kode_kelompok_barang: formData.kode_kelompok_barang,
                        uraian_kelompok_barang: formData.uraian_kelompok_barang,
                        kode_barang: formData.kode_barang,
                        uraian_barang: formData.uraian_barang,
                        spesifikasi: formData.spesifikasi,
                        satuan: formData.satuan,
                        harga_satuan: formData.harga_satuan,
                        kode_rekening: formData.kode_rekening
                    })
                    .eq('id', formData.id);
                if (error) throw error;
                alert('Data berhasil diperbarui');
            } else {
                const { error } = await supabase
                    .from('ssh')
                    .insert([{
                        kode_kelompok_barang: formData.kode_kelompok_barang,
                        uraian_kelompok_barang: formData.uraian_kelompok_barang,
                        kode_barang: formData.kode_barang,
                        uraian_barang: formData.uraian_barang,
                        spesifikasi: formData.spesifikasi,
                        satuan: formData.satuan,
                        harga_satuan: formData.harga_satuan,
                        kode_rekening: formData.kode_rekening
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
        if (!confirm('Hapus data ini?')) return;
        try {
            const { error } = await supabase.from('ssh').delete().eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (error) {
            alert('Gagal menghapus: ' + (error as any).message);
        }
    };

    const handleAddNew = () => {
        setFormData({
            id: 0, kode_kelompok_barang: '', uraian_kelompok_barang: '',
            kode_barang: '', uraian_barang: '', spesifikasi: '',
            satuan: '', harga_satuan: 0, kode_rekening: '', tahun: new Date().getFullYear()
        });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const handleEdit = (item: any) => {
        setFormData({ ...item });
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Standar Satuan Harga (SSH)</h1>
                    <p className="text-gray-500 text-sm">Referensi Standar Harga Satuan</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="destructive" onClick={handleClearData} className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-100 border">
                        <Trash className="w-4 h-4 mr-2" />
                        Hapus Semua
                    </Button>
                    <Button onClick={handleAddNew}>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Item
                    </Button>
                    <SpreadsheetUpload onUpload={handleUpload} label="Import Excel" />
                </div>
            </div>

            <Card>
                <CardHeader className="py-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
                    <CardTitle className="text-base font-medium">Data SSH <span className="text-xs text-gray-400 font-normal ml-2">(Total: {totalItems})</span></CardTitle>
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari uraian atau kode..."
                                className="w-full rounded-md border border-gray-300 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>
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
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="font-semibold text-navy-900 w-[150px]">Kode Barang</TableHead>
                                        <TableHead className="font-semibold text-navy-900">Uraian Barang</TableHead>
                                        <TableHead className="font-semibold text-navy-900 w-[200px]">Spesifikasi</TableHead>
                                        <TableHead className="font-semibold text-navy-900 w-[100px]">Satuan</TableHead>
                                        <TableHead className="font-semibold text-navy-900 w-[150px]">Harga</TableHead>
                                        <TableHead className="font-semibold text-navy-900 text-right w-[100px]">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-gray-50/50 group">
                                            <TableCell className="font-medium text-gray-700 text-xs align-top">{item.kode_barang}</TableCell>
                                            <TableCell className="text-gray-900 align-top">
                                                <div className="font-medium">{item.uraian_barang}</div>
                                                <div className="text-xs text-gray-500 mt-1">Kelompok: {item.uraian_kelompok_barang} ({item.kode_rekening})</div>
                                            </TableCell>
                                            <TableCell className="text-gray-600 text-xs align-top">{item.spesifikasi}</TableCell>
                                            <TableCell className="text-gray-600 text-xs align-top">{item.satuan}</TableCell>
                                            <TableCell className="text-gray-900 font-medium text-sm align-top">{formatCurrency(item.harga_satuan)}</TableCell>
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
                                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                                Tidak ada data ditemukan.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            {/* Pagination Controls */}
                            <div className="flex items-center justify-end border-t border-gray-100 px-4 py-4 sm:px-6 gap-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-700">Items per page:</span>
                                    <select
                                        className="h-8 w-16 rounded-md border-gray-300 text-sm focus:ring-navy-500 focus:border-navy-500"
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>
                                <div className="text-sm text-gray-700">
                                    {totalItems > 0 ? (
                                        <>
                                            {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
                                        </>
                                    ) : '0 of 0'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages || totalItems === 0}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages || totalItems === 0}
                                    >
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">{isEditing ? 'Edit Item SSH' : 'Tambah Item SSH'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="h-5 w-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Kode Kelompok</label>
                                    <input className="w-full border rounded p-2" value={formData.kode_kelompok_barang} onChange={e => setFormData({ ...formData, kode_kelompok_barang: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Uraian Kelompok</label>
                                    <input className="w-full border rounded p-2" value={formData.uraian_kelompok_barang} onChange={e => setFormData({ ...formData, uraian_kelompok_barang: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Kode Barang</label>
                                    <input className="w-full border rounded p-2" value={formData.kode_barang} onChange={e => setFormData({ ...formData, kode_barang: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Kode Rekening</label>
                                    <input className="w-full border rounded p-2" value={formData.kode_rekening} onChange={e => setFormData({ ...formData, kode_rekening: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-sm font-medium">Uraian Barang</label>
                                    <textarea className="w-full border rounded p-2" rows={2} value={formData.uraian_barang} onChange={e => setFormData({ ...formData, uraian_barang: e.target.value })} required />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-sm font-medium">Spesifikasi</label>
                                    <textarea className="w-full border rounded p-2" rows={2} value={formData.spesifikasi} onChange={e => setFormData({ ...formData, spesifikasi: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Satuan</label>
                                    <input className="w-full border rounded p-2" value={formData.satuan} onChange={e => setFormData({ ...formData, satuan: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Harga Satuan</label>
                                    <input type="number" className="w-full border rounded p-2" value={formData.harga_satuan} onChange={e => setFormData({ ...formData, harga_satuan: parseFloat(e.target.value) })} required />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                                <Button type="submit" disabled={isSaving}>{isSaving ? 'Menyimpan...' : 'Simpan'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
