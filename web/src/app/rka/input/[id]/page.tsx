'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { ArrowLeft, Plus, Save, Trash2, Edit, Loader2, Search, X, FileSpreadsheet, FileText as FilePdf } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useDebounce } from 'use-debounce';

// Extend jsPDF for autotable
interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: { finalY: number };
    autoTable: (options: any) => void;
}

// Memoized Helper for Currency
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
};

// Memoized Row Component to prevent unnecessary re-renders
const RincianRow = memo(({ item, onEdit, onDelete }: { item: any, onEdit: (item: any) => void, onDelete: (id: number) => void }) => {
    return (
        <TableRow>
            <TableCell className="font-mono text-xs text-gray-500 border-r">{item.kode_rekening || '-'}</TableCell>
            <TableCell className="font-medium border-r">{item.uraian}</TableCell>
            <TableCell className="text-center border-r">
                {item.koefisien_multi ? (
                    <>
                        <div className="flex flex-col items-center">
                            <span>
                                {(item.koefisien_multi as any[]).map((k, idx) => (
                                    <span key={idx}>
                                        {idx > 0 && ' x '}
                                        {k.volume}
                                    </span>
                                ))}
                            </span>
                            {(item.koefisien_multi as any[]).length > 1 && (
                                <span className="text-xs text-gray-500">= {item.volume}</span>
                            )}
                        </div>
                    </>
                ) : item.koefisien ? (
                    <>
                        <span>{item.koefisien}</span>
                        {item.koefisien.includes(' x ') && (
                            <span className="text-xs text-gray-400 block">= {item.volume}</span>
                        )}
                    </>
                ) : (
                    item.volume
                )}
            </TableCell>
            <TableCell className="text-center border-r">
                {item.koefisien_multi ? (
                    (item.koefisien_multi as any[]).map(k => k.satuan).join(' ')
                ) : item.satuan}
            </TableCell>
            <TableCell className="text-right border-r font-mono">
                {formatCurrency(item.harga_satuan)}
            </TableCell>
            <TableCell className="text-center">-</TableCell>
            <TableCell className="text-right font-bold border-l">{formatCurrency(item.total)}</TableCell>
            <TableCell className="text-right whitespace-nowrap">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 mr-1"
                    onClick={() => onEdit(item)}
                >
                    <Edit className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onDelete(item.id)}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </TableCell>
        </TableRow>
    );
});
RincianRow.displayName = 'RincianRow';

export default function RkaInputPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [header, setHeader] = useState<any>(null);
    const [rincian, setRincian] = useState<any[]>([]);

    // Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [standarType, setStandarType] = useState('ssh'); // ssh, sbu, hspk, asb
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 800); // Debounce search
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Search Pagination State
    const [searchPage, setSearchPage] = useState(1);
    const [totalSearchResults, setTotalSearchResults] = useState(0);
    const SEARCH_LIMIT = 50;

    // Form State for Adding Item
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [koefisienList, setKoefisienList] = useState<{ volume: number; satuan: string }[]>([
        { volume: 0, satuan: '' }
    ]);
    const [finalSatuan, setFinalSatuan] = useState(''); // Allow overriding the final unit
    const [ppn, setPpn] = useState(0); // 0 or 11
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    // Memoize total calculation
    const totalRincian = useMemo(() => {
        return rincian.reduce((sum, item) => sum + (item.total || 0), 0);
    }, [rincian]);

    // Search Function - Triggered by debounced term or type change
    const handleSearch = useCallback(async (page = 1) => {
        if (!debouncedSearchTerm || debouncedSearchTerm.length < 3) {
            if (debouncedSearchTerm.length === 0) setSearchResults([]);
            return;
        }
        setIsSearching(true);
        setSearchResults([]);

        try {
            const from = (page - 1) * SEARCH_LIMIT;
            const to = from + SEARCH_LIMIT - 1;

            let table = standarType;
            let query = supabase
                .from(table)
                .select('*', { count: 'exact' })
                .range(from, to);

            // Adjust search columns based on table structure
            if (table === 'ssh') {
                query = query.ilike('uraian_barang', `%${debouncedSearchTerm}%`);
            } else {
                query = query.ilike('uraian', `%${debouncedSearchTerm}%`);
            }

            const { data, error, count } = await query;
            if (error) throw error;

            setTotalSearchResults(count || 0);
            setSearchPage(page);

            // Map to common structure
            const mapped = data?.map(item => ({
                id: item.id,
                kode: item.kode || item.kode_barang || item.kode_kelompok_barang,
                kode_rekening: item.kode_rekening || '',
                uraian: item.uraian || item.uraian_barang,
                spesifikasi: item.spesifikasi || '',
                satuan: item.satuan,
                harga: item.harga || item.harga_satuan,
                source: table
            }));

            setSearchResults(mapped || []);

        } catch (error) {
            console.error('Search error:', error);
            alert('Gagal mencari data');
        } finally {
            setIsSearching(false);
        }
    }, [debouncedSearchTerm, standarType]);

    // Trigger search when dependencies change
    useEffect(() => {
        handleSearch(1); // Reset to page 1 on new search term/type
    }, [handleSearch]);

    // Handle Item Selection
    const handleSelectItem = (item: any) => {
        setSelectedItem(item);
        const initialUnit = item.satuan || '';
        setKoefisienList([{ volume: 1, satuan: initialUnit }]);
        setFinalSatuan(initialUnit);
        setPpn(0);
    };

    // Auto-updates to Final Satuan are intentionally disabled to respect manual edits.
    // User can click "Reset ke gabungan" in UI if needed.

    // Handle Edit Click
    const handleEditItem = useCallback((item: any) => {
        setIsEditing(true);
        setEditId(item.id);

        // Pre-fill selectedItem with current data so the right panel shows up
        setSelectedItem({
            id: item.id,
            kode_rekening: item.kode_rekening,
            uraian: item.uraian,
            harga: item.harga_satuan,
            satuan: item.satuan, // Default base unit
            source: item.jenis_belanja
        });

        // Parse koefisien data
        if (item.koefisien_multi) {
            setKoefisienList(item.koefisien_multi);
        } else {
            // Try to parse from string "25 x 12" and "Orang Kali"
            const volParts = (item.koefisien || '').split(' x ').map((s: string) => s.trim());
            const unitParts = (item.satuan || '').split(' ').map((s: string) => s.trim());

            // Heuristic: if we have "x" separators, try to reconstruct
            if (volParts.length > 1) {
                const list = volParts.map((v: string, i: number) => ({
                    volume: parseFloat(v) || 1,
                    satuan: unitParts[i] || ''
                }));
                setKoefisienList(list);
            } else {
                // Check if koefisien has a description that isn't just volume
                // If existing data has volume=10, koefisien="10 Orang", ensure consistency
                // For now, fall back to single item
                setKoefisienList([{
                    volume: item.volume,
                    satuan: item.satuan
                }]);
            }
        }

        setFinalSatuan(item.satuan || '');
        // For now defaulting PPN to 0 since we don't store the rate explicitly yet
        setPpn(0); // or calculate from total/volume/harga

        setIsAddModalOpen(true);
    }, []);

    // Handle Delete Click
    const handleDeleteItem = useCallback(async (id: number) => {
        if (!confirm('Apakah anda yakin ingin menghapus data ini?')) return;

        try {
            const { error } = await supabase.from('rka_rincian').delete().eq('id', id);
            if (error) throw error;

            setRincian(prevRincian => prevRincian.filter(item => item.id !== id));
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Gagal menghapus data');
        }
    }, []);

    // Save Rincian (Create or Update)
    const handleSaveRincian = async () => {
        // Calculate derived values
        const totalVolume = koefisienList.reduce((acc, curr) => acc * (curr.volume || 1), 1);

        // Construct string with ONLY numbers: "20 x 1"
        const koefisienString = koefisienList.map(k => k.volume).join(' x ');

        // Construct string with ONLY units: "Rim Tahun"
        const autoSatuan = koefisienList.map(k => k.satuan).filter(Boolean).join(' ');
        const saveSatuan = autoSatuan || finalSatuan;

        if (!selectedItem || totalVolume <= 0) {
            alert('Mohon lengkapi data volume');
            return;
        }

        try {
            const harga = parseFloat(selectedItem.harga);
            const total = (harga * totalVolume) + ((harga * totalVolume) * (ppn / 100));

            const payload = {
                rka_id: parseInt(id),
                uraian: selectedItem.uraian,
                volume: totalVolume,
                satuan: finalSatuan, // Use the user-edited/confirmed unit
                harga_satuan: harga,
                koefisien: koefisienString, // Store format "25 x 12"
                koefisien_multi: koefisienList, // Store structured data
                total: total,
                jenis_belanja: (selectedItem.source || 'MANUAL').toUpperCase(),
                kode_rekening: selectedItem.kode_rekening || ''
            };

            if (isEditing && editId) {
                // Update
                const { data, error } = await supabase
                    .from('rka_rincian')
                    .update(payload)
                    .eq('id', editId)
                    .select()
                    .single();
                if (error) throw error;
                setRincian(prevRincian => prevRincian.map(item => item.id === editId ? data : item));
                // alert('Berhasil mengubah rincian!');
            } else {
                // Insert
                const { data, error } = await supabase
                    .from('rka_rincian')
                    .insert(payload)
                    .select()
                    .single();
                if (error) throw error;
                setRincian(prevRincian => [...prevRincian, data]);
                // alert('Berhasil menambahkan rincian!');
            }

            handleCloseModal();
            // fetchData(); // No longer needed, state updated directly

        } catch (error) {
            console.error('Error saving rincian:', error);
            alert('Gagal menyimpan rincian');
        }
    };

    // Close Modal Handler matches existing but resets edit state
    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setSelectedItem(null);
        setSearchResults([]);
        setIsEditing(false);
        setEditId(null);
        setSearchTerm('');
    };

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch Header
            const { data: headerData, error: headerError } = await supabase
                .from('rka_renja')
                .select(`
                    *,
                    master_sub_kegiatans!sub_kegiatan_kode (
                        kode, nama,
                        master_kegiatans!kegiatan_kode (
                            kode, nama,
                            master_programs!program_kode (
                                kode, nama
                            )
                        )
                    ),
                    opds!opd_id (nama)
                `)
                .eq('id', id)
                .single();

            if (headerError) throw headerError;
            setHeader(headerData);

            // Fetch Rincian
            const { data: rincianData, error: rincianError } = await supabase
                .from('rka_rincian')
                .select('*')
                .eq('rka_id', id)
                .order('created_at', { ascending: true });

            if (rincianError) throw rincianError;
            setRincian(rincianData || []);

        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Gagal mengambil data RKA');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchData();
    }, [id, fetchData]);

    // EXPORT FUNCTIONS
    const handleExportExcel = () => {
        if (!header || rincian.length === 0) return;

        const subKegiatanName = header.master_sub_kegiatans?.nama || 'Sub-Kegiatan';
        const fileName = `RKA_Rincian_${subKegiatanName.replace(/\s+/g, '_')}.xlsx`;

        // 1. Prepare Header Info Rows
        const headerInfo = [
            ['Tahun Anggaran', header.tahun],
            ['Perangkat Daerah', header.opds?.nama],
            ['Program', `${header.master_sub_kegiatans?.master_kegiatans?.master_programs?.kode} - ${header.master_sub_kegiatans?.master_kegiatans?.master_programs?.nama}`],
            ['Kegiatan', `${header.master_sub_kegiatans?.master_kegiatans?.kode} - ${header.master_sub_kegiatans?.master_kegiatans?.nama}`],
            ['Sub Kegiatan', `${header.master_sub_kegiatans?.kode} - ${header.master_sub_kegiatans?.nama}`],
            ['Pagu Validasi', formatCurrency(header.pagu_validasi || 0)],
            [], // spacer
            ['DAFTAR RINCIAN BELANJA']
        ];

        // 2. Prepare Data Rows
        const tableHeader = ['No', 'Kode Rekening', 'Uraian', 'Volume', 'Satuan', 'Harga Satuan', 'PPN', 'Total'];
        const tableBody = rincian.map((item, index) => [
            index + 1,
            item.kode_rekening || '-',
            item.uraian,
            item.koefisien ? `${item.koefisien} = ${item.volume}` : item.volume,
            item.satuan,
            item.harga_satuan,
            '-',
            item.total
        ]);

        // 3. Create Worksheet
        const wsData = [...headerInfo, [], tableHeader, ...tableBody];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // 4. Create Workbook and Download
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Rincian Belanja');
        XLSX.writeFile(wb, fileName);
    };

    const handleExportPDF = async () => {
        if (!header || rincian.length === 0) return;

        try {
            // Dynamically import libraries to avoid SSR/Build issues
            const jsPDF = (await import('jspdf')).default;
            const autoTableModule = await import('jspdf-autotable');
            // Handle different import structures (CJS vs ESM result)
            const autoTable = (autoTableModule as any).default || autoTableModule;

            console.log('PDF Export Debug:', {
                jsPDFType: typeof jsPDF,
                autoTableModuleType: typeof autoTableModule,
                autoTableType: typeof autoTable,
                autoTableKeys: Object.keys(autoTableModule)
            });

            if (typeof autoTable !== 'function') {
                console.error('autoTable is not a function', autoTable);
                alert('Gagal memuat modul PDF generator (autoTable error).');
                return;
            }

            const doc = new jsPDF('l', 'mm', 'a4');
            const subKegiatanName = header.master_sub_kegiatans?.nama || 'Sub-Kegiatan';

            // Header Title
            doc.setFontSize(14);
            doc.text('RENCANA KERJA DAN ANGGARAN SATUAN KERJA PERANGKAT DAERAH', 14, 15);
            doc.setFontSize(10);
            doc.text(`Tahun Anggaran: ${header.tahun}`, 14, 22);

            // Meta Info Container
            const startY = 30;
            doc.setFontSize(9);
            doc.text(`Perangkat Daerah: ${header.opds?.nama}`, 14, startY);
            doc.text(`Program: ${header.master_sub_kegiatans?.master_kegiatans?.master_programs?.kode} - ${header.master_sub_kegiatans?.master_kegiatans?.master_programs?.nama}`, 14, startY + 5);
            doc.text(`Kegiatan: ${header.master_sub_kegiatans?.master_kegiatans?.kode} - ${header.master_sub_kegiatans?.master_kegiatans?.nama}`, 14, startY + 10);
            doc.text(`Sub Kegiatan: ${header.master_sub_kegiatans?.kode} - ${header.master_sub_kegiatans?.nama}`, 14, startY + 15);
            doc.text(`Pagu Indikatif: ${formatCurrency(header.pagu_validasi || 0)}`, 14, startY + 20);

            // Table
            autoTable(doc, {
                startY: startY + 25,
                head: [['No', 'Kode Rekening', 'Uraian', 'Koefisien', 'Satuan', 'Harga Satuan', 'Total']],
                body: rincian.map((item, index) => [
                    index + 1,
                    item.kode_rekening || '',
                    item.uraian,
                    item.koefisien || item.volume,
                    item.satuan,
                    formatCurrency(item.harga_satuan),
                    formatCurrency(item.total)
                ]),
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [41, 128, 185] }, // Blue header
            });

            // Footer Summary
            const lastAutoTable = (doc as any).lastAutoTable; // Access internal state if needed, or calculate Y manually
            const finalY = lastAutoTable ? lastAutoTable.finalY + 10 : startY + 50;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`Total Anggaran: ${formatCurrency(totalRincian)}`, 14, finalY);

            doc.save(`RKA_Rincian_${subKegiatanName.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error('Export PDF Error:', error);
            alert('Gagal mengexport PDF. Silakan coba lagi.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-navy-900">Rincian Belanja</h1>
                    <p className="text-gray-500 text-sm">Input detail anggaran untuk Sub Kegiatan</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-navy-600" />
                </div>
            ) : header && (
                <>
                    {/* Header Info */}
                    <Card className="bg-navy-50 border-navy-100">
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase">Perangkat Daerah</h3>
                                    <p className="font-medium text-navy-900">{header.opds?.nama}</p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase">Tahun Anggaran</h3>
                                    <p className="font-medium text-navy-900">{header.tahun}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase">Program</h3>
                                    <p className="font-medium text-navy-900">
                                        {header.master_sub_kegiatans?.master_kegiatans?.master_programs?.kode} - {header.master_sub_kegiatans?.master_kegiatans?.master_programs?.nama}
                                    </p>
                                </div>
                                <div className="md:col-span-2">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase">Kegiatan</h3>
                                    <p className="font-medium text-navy-900">
                                        {header.master_sub_kegiatans?.master_kegiatans?.kode} - {header.master_sub_kegiatans?.master_kegiatans?.nama}
                                    </p>
                                </div>
                                <div className="md:col-span-2">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase">Sub Kegiatan</h3>
                                    <p className="text-lg font-bold text-navy-900">
                                        {header.master_sub_kegiatans?.kode} - {header.master_sub_kegiatans?.nama}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-navy-200 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase">Pagu Validasi</h3>
                                    <p className="text-xl font-bold text-navy-700">{formatCurrency(header.pagu_validasi || 0)}</p>
                                </div>
                                <div className="text-right">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase">Total Rincian</h3>
                                    <p className="text-xl font-bold text-green-600">
                                        {formatCurrency(totalRincian)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rincian Table */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Daftar Rincian Belanja</CardTitle>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleExportExcel} className="hidden sm:flex" disabled={rincian.length === 0}>
                                    <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                                    Export Excel
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleExportPDF} className="hidden sm:flex" disabled={rincian.length === 0}>
                                    <FilePdf className="w-4 h-4 mr-2 text-red-600" />
                                    Export PDF
                                </Button>
                                <Button onClick={() => setIsAddModalOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Tambah Rincian
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead rowSpan={2} className="w-[150px] align-middle border-r">Kode Rekening</TableHead>
                                        <TableHead rowSpan={2} className="align-middle border-r">Uraian</TableHead>
                                        <TableHead colSpan={4} className="text-center border-b">Rincian Perhitungan</TableHead>
                                        <TableHead rowSpan={2} className="w-[150px] text-right align-middle border-l">Jumlah (Rp)</TableHead>
                                        <TableHead rowSpan={2} className="w-[50px] align-middle"></TableHead>
                                    </TableRow>
                                    <TableRow>
                                        <TableHead className="w-[120px] text-center border-r">Koefisien / Volume</TableHead>
                                        <TableHead className="w-[100px] text-center border-r">Satuan</TableHead>
                                        <TableHead className="w-[150px] text-center border-r">Harga</TableHead>
                                        <TableHead className="w-[100px] text-center">PPN</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rincian.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                                Belum ada rincian belanja. Klik "Tambah Rincian" untuk memulai.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        rincian.map((item) => (
                                            <RincianRow
                                                key={item.id}
                                                item={item}
                                                onEdit={handleEditItem}
                                                onDelete={handleDeleteItem}
                                            />
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Modal Placeholder */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-0 overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-navy-900">Tambah Komponen Belanja</h3>
                            <button onClick={handleCloseModal}><X className="w-5 h-5 text-gray-400 hover:text-red-500" /></button>
                        </div>

                        <div className="flex flex-1 overflow-hidden">

                            {/* Left Side: Search & List */}
                            <div className={`flex-1 flex flex-col border-r ${selectedItem ? 'hidden md:flex' : 'flex'}`}>
                                <div className="p-4 border-b space-y-3 bg-white">
                                    <div className="flex gap-2">
                                        <select
                                            className="border rounded-md px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-navy-500"
                                            value={standarType}
                                            onChange={(e) => setStandarType(e.target.value)}
                                        >
                                            <option value="ssh">SSH (Barang)</option>
                                            <option value="sbu">SBU (Umum)</option>
                                            <option value="hspk">HSPK (Pokok)</option>
                                            <option value="asb">ASB (Analisis)</option>
                                        </select>
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Cari uraian..."
                                                className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    {isSearching && <p className="text-xs text-blue-500">Mencari data...</p>}
                                </div>

                                <div className="flex-1 overflow-y-auto p-0">
                                    {searchResults.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400 text-sm">
                                            {searchTerm ? 'Tidak ditemukan.' : 'Ketik nama barang/jasa untuk mencari.'}
                                        </div>
                                    ) : (
                                        <div className="divide-y">
                                            {searchResults.map((item) => (
                                                <div
                                                    key={`${item.source}-${item.id}`}
                                                    className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${selectedItem?.id === item.id ? 'bg-blue-100 border-l-4 border-blue-600' : ''}`}
                                                    onClick={() => handleSelectItem(item)}
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded uppercase">{item.source}</span>
                                                        <span className="text-sm font-bold text-gray-900">{formatCurrency(item.harga)}</span>
                                                    </div>
                                                    <h4 className="font-medium text-gray-800 text-sm mb-1">{item.uraian}</h4>
                                                    <p className="text-xs text-gray-500">{item.spesifikasi}</p>
                                                    <div className="mt-2 text-xs text-gray-400">Satuan: {item.satuan}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Pagination Controls */}
                                {totalSearchResults > SEARCH_LIMIT && (
                                    <div className="p-3 border-t bg-gray-50 flex items-center justify-between text-xs">
                                        <span className="text-gray-500">
                                            Showing {((searchPage - 1) * SEARCH_LIMIT) + 1} - {Math.min(searchPage * SEARCH_LIMIT, totalSearchResults)} of {totalSearchResults}
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={searchPage === 1 || isSearching}
                                                onClick={() => handleSearch(searchPage - 1)}
                                                className="h-7 px-2"
                                            >
                                                Prev
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={(searchPage * SEARCH_LIMIT) >= totalSearchResults || isSearching}
                                                onClick={() => handleSearch(searchPage + 1)}
                                                className="h-7 px-2"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Side: Form Input */}
                            {selectedItem && (
                                <div className="w-full md:w-[400px] bg-gray-50 flex flex-col border-l shadow-[rgba(0,0,0,0.1)_0px_0px_10px]">
                                    <div className="p-6 flex-1 overflow-y-auto">
                                        <h4 className="font-bold text-lg mb-4 text-navy-900">Detail Rincian</h4>

                                        <div className="space-y-4">
                                            <div className="bg-white p-4 rounded border">
                                                <label className="block text-xs text-gray-500 mb-1">Uraian Barang/Jasa</label>
                                                <p className="font-medium text-sm">{selectedItem.uraian}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white p-4 rounded border">
                                                    <label className="block text-xs text-gray-500 mb-1">Harga Satuan</label>
                                                    <p className="font-bold text-navy-700">{formatCurrency(selectedItem.harga)}</p>
                                                </div>
                                                <div className="bg-white p-4 rounded border">
                                                    <label className="block text-xs text-gray-500 mb-1">Satuan</label>
                                                    <p className="font-medium">{selectedItem.satuan}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-1">Koefisien / Volume</label>
                                                <div className="space-y-2">
                                                    {koefisienList.map((k, index) => (
                                                        <div key={index} className="flex gap-2 items-center">
                                                            <div className="flex-1">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    placeholder="Vol"
                                                                    className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                                                    value={k.volume}
                                                                    onChange={(e) => {
                                                                        const val = parseFloat(e.target.value);
                                                                        const newList = [...koefisienList];
                                                                        newList[index].volume = isNaN(val) ? 0 : val;
                                                                        setKoefisienList(newList);
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="flex-1">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Satuan (Orang/Bln)"
                                                                    className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                                                    value={k.satuan}
                                                                    onChange={(e) => {
                                                                        const newList = [...koefisienList];
                                                                        newList[index].satuan = e.target.value;
                                                                        setKoefisienList(newList);
                                                                    }}
                                                                />
                                                            </div>
                                                            {koefisienList.length > 1 && (
                                                                <button
                                                                    onClick={() => {
                                                                        const newList = koefisienList.filter((_, i) => i !== index);
                                                                        setKoefisienList(newList);
                                                                    }}
                                                                    className="text-red-500 hover:bg-red-50 p-1 rounded"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-blue-600 text-xs w-full border border-dashed border-blue-200"
                                                        onClick={() => setKoefisienList([...koefisienList, { volume: 1, satuan: '' }])}
                                                    >
                                                        <Plus className="w-3 h-3 mr-1" /> Tambah Koefisien
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Final Data Preview/Adjustment */}
                                            <div className="bg-gray-100 p-3 rounded text-sm space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600">Total Volume:</span>
                                                    <span className="font-bold">{koefisienList.reduce((acc, curr) => acc * (curr.volume || 1), 1)}</span>
                                                </div>
                                                <div className="flex justify-between items-center gap-2">
                                                    <span className="text-gray-600 whitespace-nowrap">Satuan Akhir:</span>
                                                    <input
                                                        type="text"
                                                        className="flex-1 border-b border-gray-300 bg-transparent text-right font-medium focus:border-blue-500 focus:outline-none"
                                                        value={finalSatuan}
                                                        onChange={(e) => setFinalSatuan(e.target.value)}
                                                        placeholder="Satuan (Manually edit if needed)"
                                                    />
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <span className="text-xs text-gray-400 italic cursor-pointer hover:text-blue-500"
                                                        onClick={() => setFinalSatuan(koefisienList.map(k => k.satuan).join(' '))}
                                                    >
                                                        (Reset ke gabungan)
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-1">PPN</label>
                                                <select
                                                    className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500"
                                                    value={ppn}
                                                    onChange={(e) => setPpn(parseInt(e.target.value))}
                                                >
                                                    <option value={0}>0% (Tanpa PPN)</option>
                                                    <option value={11}>11% (PPN 11%)</option>
                                                </select>
                                            </div>

                                            <div className="bg-green-50 p-4 rounded border border-green-200 mt-6">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm text-gray-600">Subtotal</span>
                                                    <span className="font-bold text-gray-800">{formatCurrency(selectedItem.harga * koefisienList.reduce((acc, curr) => acc * (curr.volume || 1), 1))}</span>
                                                </div>
                                                {ppn > 0 && (
                                                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-green-200">
                                                        <span className="text-sm text-gray-600">PPN ({ppn}%)</span>
                                                        <span className="font-bold text-gray-800">
                                                            {formatCurrency(
                                                                (selectedItem.harga * koefisienList.reduce((acc, curr) => acc * (curr.volume || 1), 1)) * (ppn / 100)
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center pt-1">
                                                    <span className="font-bold text-nav-900">Total Anggaran</span>
                                                    <span className="font-bold text-xl text-green-700">
                                                        {formatCurrency(
                                                            (selectedItem.harga * koefisienList.reduce((acc, curr) => acc * (curr.volume || 1), 1)) * (1 + ppn / 100)
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 border-t bg-white flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setSelectedItem(null)}>Batal</Button>
                                        <Button onClick={handleSaveRincian} className="bg-navy-700 hover:bg-navy-800">
                                            <Save className="w-4 h-4 mr-2" />
                                            Simpan Rincian
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
}
