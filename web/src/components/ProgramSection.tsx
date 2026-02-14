import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

const ProgramSection = () => {
    return (
        <Card>
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
                <CardTitle className="text-lg">Program & Kegiatan</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                    <div className="p-3 bg-navy-50 rounded-md border border-navy-100 text-sm text-navy-800 font-medium">
                        1.02.01 - PROGRAM PENUNJANG URUSAN PEMERINTAHAN DAERAH KABUPATEN/KOTA
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kegiatan</label>
                    <div className="p-3 bg-white rounded-md border border-gray-300 text-sm text-gray-800">
                        1.02.01.2.02 - Penyediaan Jasa Penunjang Urusan Pemerintahan Daerah
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sub Kegiatan</label>
                    <div className="p-3 bg-white rounded-md border border-gray-300 text-sm text-gray-800">
                        1.02.01.2.02.01 - Penyediaan Jasa Surat Menyurat
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProgramSection;
