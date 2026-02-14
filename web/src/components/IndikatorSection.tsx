import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

interface Props {
    totalBelanja: number;
}

const IndikatorSection = ({ totalBelanja }: Props) => {
    return (
        <Card>
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Indikator Kinerja</CardTitle>
                <Button size="sm" variant="outline" className="h-8">
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Indikator
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50">
                            <TableHead className="w-[150px]">Jenis</TableHead>
                            <TableHead>Tolok Ukur</TableHead>
                            <TableHead className="w-[150px]">Target</TableHead>
                            <TableHead className="w-[100px]">Satuan</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-medium text-gray-700">Capaian</TableCell>
                            <TableCell>Terlaksananya Administrasi Surat Menyurat</TableCell>
                            <TableCell>100</TableCell>
                            <TableCell>Persen</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-medium text-gray-700">Keluaran</TableCell>
                            <TableCell>Jumlah Surat yang Didistribusikan</TableCell>
                            <TableCell>1200</TableCell>
                            <TableCell>Dokumen</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-medium text-gray-700">Hasil</TableCell>
                            <TableCell>Kelancaran Administrasi Perkantoran</TableCell>
                            <TableCell>100</TableCell>
                            <TableCell>Persen</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex justify-end">
                    <div className="text-sm">
                        <span className="text-gray-500 mr-2">Total Pagu Indikatif:</span>
                        <span className="font-bold text-navy-800">Rp {totalBelanja.toLocaleString('id-ID')}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default IndikatorSection;
