'use client';

import React from 'react';
import { User } from 'lucide-react';

export default function ProfilePage() {
    return (
        <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <User size={32} />
            </div>
            <h2 className="text-xl font-bold text-navy-900">Profil Saya</h2>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                Halaman ini akan menampilkan informasi profil pengguna yang sedang login.
            </p>
        </div>
    );
}
