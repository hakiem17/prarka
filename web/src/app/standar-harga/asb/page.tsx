'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Search, Filter, Settings, Edit, Trash2, Plus, Loader2, X, Archive } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import SpreadsheetUpload from '@/components/SpreadsheetUpload';

export default function AsbPage() {
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
        uraian: '',
        spesifikasi: '',
        satuan: '',
        harga: 0,
        kode_rekening: '',
        tahun: new Date().getFullYear()
    });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: asb, error } = await supabase
                .from('asb')
                .select('*')
                .order('kode', { ascending: true })
                .limit(100);

            if (error) throw error;
            if (asb) setData(asb);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        if (term.length > 2) {
            setIsLoading(true);
            try {
                const { data: asb, error } = await supabase
                    .from('asb')
                    .select('*')
                    .or(`uraian.ilike.%${term}%,kode.ilike.%${term}%`)
                    .limit(50);

                if (error) throw error;
                if (asb) setData(asb);
            } catch (error) {
                console.error('Error searching:', error);
            } finally {
                setIsLoading(false);
            }
        } else if (term.length === 0) {
            fetchData();
        }
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
                    kode: getVal(['Kode', 'kode', 'KODE', 'Kode Barang', 'KODE BARANG']) || '',
                    uraian: getVal(['Uraian', 'uraian', 'URAIAN', 'Nama Item', 'Uraian Barang', 'URAIAN BARANG']) || '',
                    spesifikasi: getVal(['Spesifikasi', 'spesifikasi', 'SPESIFIKASI']) || '',
                    satuan: getVal(['Satuan', 'satuan', 'SATUAN']) || '',
                    harga: parseFloat(getVal(['Harga', 'harga', 'HARGA', 'Harga Satuan', 'HARGA SATUAN']) || 0),
                    kode_rekening: getVal(['Kode Rekening', 'kode_rekening', 'KODE REKENING']) || '',
                    tahun: new Date().getFullYear()
                };
            }).filter(item => item.uraian);

            const chunkSize = 100;
            for (let i = 0; i < mappedData.length; i += chunkSize) {
                const chunk = mappedData.slice(i, i + chunkSize);
                const { error } = await supabase.from('asb').insert(chunk);
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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (isEditing) {
                const { error } = await supabase
                    .from('asb')
                    .update({
                        kode: formData.kode,
                        uraian: formData.uraian,
                        spesifikasi: formData.spesifikasi,
                        satuan: formData.satuan,
                        harga: formData.harga,
                        kode_rekening: formData.kode_rekening
                    })
                    .eq('id', formData.id);
                if (error) throw error;
                alert('Data berhasil diperbarui');
            } else {
                const { error } = await supabase
                    .from('asb')
                    .insert([{
                        kode: formData.kode,
                        uraian: formData.uraian,
                        spesifikasi: formData.spesifikasi,
                        satuan: formData.satuan,
                        harga: formData.harga,
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
            const { error } = await supabase.from('asb').delete().eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (error) {
            alert('Gagal menghapus: ' + (error as any).message);
        }
    };

    const handleAddNew = () => {
        setFormData({
            id: 0, kode: '', uraian: '', spesifikasi: '',
            satuan: '', harga: 0, kode_rekening: '', tahun: new Date().getFullYear()
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Analisis Standar Belanja (ASB)</h1>
                    <p className="text-gray-500 text-sm">Referensi Analisis Standar Belanja</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleAddNew}>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Item
                    </Button>
                    <SpreadsheetUpload onUpload={handleUpload} label="Import Excel" />
                </div>
            </div>

            <Card>
                <CardHeader className="py-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
                    <CardTitle className="text-base font-medium">Data ASB</CardTitle>
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
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="font-semibold text-navy-900 w-[150px]">Kode</TableHead>
                                    <TableHead className="font-semibold text-navy-900">Uraian</TableHead>
                                    <TableHead className="font-semibold text-navy-900 w-[200px]">Spesifikasi</TableHead>
                                    <TableHead className="font-semibold text-navy-900 w-[100px]">Satuan</TableHead>
                                    <TableHead className="font-semibold text-navy-900 w-[150px]">Harga</TableHead>
                                    <TableHead className="font-semibold text-navy-900 text-right w-[100px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-gray-50/50 group">
                                        <TableCell className="font-medium text-gray-700 text-xs align-top">{item.kode}</TableCell>
                                        <TableCell className="text-gray-900 align-top">
                                            <div className="font-medium">{item.uraian}</div>
                                            {item.kode_rekening && <div className="text-xs text-gray-500 mt-1">Rek: {item.kode_rekening}</div>}
                                        </TableCell>
                                        <TableCell className="text-gray-600 text-xs align-top">{item.spesifikasi}</TableCell>
                                        <TableCell className="text-gray-600 text-xs align-top">{item.satuan}</TableCell>
                                        <TableCell className="text-gray-900 font-medium text-sm align-top">{formatCurrency(item.harga)}</TableCell>
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
                    )}
                </CardContent>
            </Card>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">{isEditing ? 'Edit Item ASB' : 'Tambah Item ASB'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="h-5 w-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Kode</label>
                                    <input className="w-full border rounded p-2" value={formData.kode} onChange={e => setFormData({ ...formData, kode: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Kode Rekening</label>
                                    <input className="w-full border rounded p-2" value={formData.kode_rekening} onChange={e => setFormData({ ...formData, kode_rekening: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-sm font-medium">Uraian</label>
                                    <textarea className="w-full border rounded p-2" rows={2} value={formData.uraian} onChange={e => setFormData({ ...formData, uraian: e.target.value })} required />
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
                                    <label className="text-sm font-medium">Harga</label>
                                    <input type="number" className="w-full border rounded p-2" value={formData.harga} onChange={e => setFormData({ ...formData, harga: parseFloat(e.target.value) })} required />
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
