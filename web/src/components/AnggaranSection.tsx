import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

interface Props {
    items: any[];
    setItems: (items: any[]) => void;
}

const AnggaranSection = ({ items, setItems }: Props) => {
    return (
        <Card>
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Rincian Anggaran</CardTitle>
                <Button size="sm" className="h-8">
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Rincian
                </Button>
            </CardHeader>
            <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center justify-center text-gray-500">
                    <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Plus className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Belum ada rincian anggaran</h3>
                    <p className="text-sm max-w-sm mb-6">Mulailah dengan menambahkan komponen belanja dari Standar Harga Satuan (SSH/SBU/HSPK/ASB).</p>
                    <Button variant="outline">
                        Pilih dari Standar Harga
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default AnggaranSection;
