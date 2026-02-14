import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table';

interface Props {
    totalBelanja: number;
}

const PenarikanDanaSection = ({ totalBelanja }: Props) => {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    return (
        <Card>
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
                <CardTitle className="text-lg">Rencana Penarikan Dana</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50">
                            <TableHead className="w-[50px]">No</TableHead>
                            <TableHead>Bulan</TableHead>
                            <TableHead className="text-right">Jumlah (Rp)</TableHead>
                            <TableHead className="text-right w-[150px]">Persentase</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {months.map((month, index) => (
                            <TableRow key={month}>
                                <TableCell className="text-center text-gray-500">{index + 1}</TableCell>
                                <TableCell className="font-medium">{month}</TableCell>
                                <TableCell className="text-right">
                                    <input
                                        type="text"
                                        className="w-full text-right bg-transparent border-b border-transparent focus:border-navy-500 focus:outline-none focus:ring-0 text-sm py-1 hover:border-gray-300 transition-colors"
                                        placeholder="0"
                                    />
                                </TableCell>
                                <TableCell className="text-right text-gray-500">0%</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <div className="p-4 border-t border-gray-100 bg-navy-50/50 flex justify-between items-center">
                    <span className="font-medium text-navy-900">Total Rencana Penarikan</span>
                    <span className="font-bold text-lg text-navy-900">Rp 0</span>
                </div>
            </CardContent>
        </Card>
    );
};

export default PenarikanDanaSection;
