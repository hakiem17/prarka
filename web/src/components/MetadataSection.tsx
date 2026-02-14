import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

const MetadataSection = () => {
    return (
        <Card>
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
                <CardTitle className="text-lg">Metadata Kegiatan</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Urusan Pemerintahan</label>
                            <div className="p-2.5 bg-gray-50 rounded-md border border-gray-200 text-sm text-gray-800">
                                1.02 - KESEHATAN
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Organisasi</label>
                            <div className="p-2.5 bg-gray-50 rounded-md border border-gray-200 text-sm text-gray-800">
                                1.02.0.00.0.00.01.00 - DINAS KESEHATAN
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Kegiatan</label>
                            <input type="text" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all" placeholder="Masukkan lokasi..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Pelaksanaan</label>
                            <div className="flex space-x-2">
                                <input type="text" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" placeholder="Mulai" />
                                <span className="text-gray-400 self-center">-</span>
                                <input type="text" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" placeholder="Selesai" />
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default MetadataSection;
