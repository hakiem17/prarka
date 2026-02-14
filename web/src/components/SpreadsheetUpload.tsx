'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Upload, Loader2, FileSpreadsheet } from 'lucide-react';

interface SpreadsheetUploadProps {
    onUpload: (data: any[]) => Promise<void>;
    templateUrl?: string; // Optional URL to download template
    label?: string;
}

const SpreadsheetUpload: React.FC<SpreadsheetUploadProps> = ({ onUpload, templateUrl, label = 'Import Data' }) => {
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        try {
            const data = await parseExcel(file);
            await onUpload(data);
        } catch (error) {
            console.error('Error processing file:', error);
            alert('Gagal memproses file: ' + (error as any).message);
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const parseExcel = (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0]; // Assume first sheet
                    const sheet = workbook.Sheets[sheetName];

                    // Smart Header Detection
                    // 1. Get sheet data as array of arrays (raw)
                    const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

                    let headerRowIndex = 0;
                    let maxMatchCount = 0;

                    const commonKeys = ['kode', 'uraian', 'harga', 'satuan', 'spesifikasi', 'rekening'];

                    // Scan first 20 rows to find the best header row
                    for (let i = 0; i < Math.min(aoa.length, 20); i++) {
                        const row = aoa[i];
                        if (!row || row.length === 0) continue;

                        let matchCount = 0;
                        row.forEach((cell: any) => {
                            if (typeof cell === 'string') {
                                const val = cell.toLowerCase();
                                if (commonKeys.some(k => val.includes(k))) {
                                    matchCount++;
                                }
                            }
                        });

                        // If this row has more matches, or same matches but is earlier (unlikely for headers, usually headers are lower but we want the distinct one)
                        // Actually headers are usually the *first* row that matches multiple keys.
                        if (matchCount > maxMatchCount) {
                            maxMatchCount = matchCount;
                            headerRowIndex = i;
                        }
                    }

                    // If we found a good candidate (at least 2 matches), use it. otherwise default to 0
                    const range = maxMatchCount >= 1 ? headerRowIndex : 0;

                    console.log(`Detected header at row ${range} with ${maxMatchCount} matches.`);

                    // 2. Parse again with the detected header row
                    const jsonData = XLSX.utils.sheet_to_json(sheet, { range: range });
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsBinaryString(file);
        });
    };

    return (
        <div className="flex items-center space-x-2">
            <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
            />
            <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="bg-white border-dashed border-2 border-gray-300 hover:border-navy-500 hover:bg-navy-50 text-gray-600 hover:text-navy-700 transition-colors"
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <Upload className="w-4 h-4 mr-2" />
                )}
                {label}
            </Button>
            {templateUrl && (
                <a
                    href={templateUrl}
                    download
                    className="text-xs text-blue-600 hover:underline flex items-center"
                >
                    <FileSpreadsheet className="w-3 h-3 mr-1" />
                    Template
                </a>
            )}
        </div>
    );
};

export default SpreadsheetUpload;
