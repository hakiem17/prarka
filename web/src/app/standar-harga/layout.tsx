'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Menu, Bell, Search } from 'lucide-react';

export default function StandarHargaLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex justify-between items-center py-4 px-6 bg-white shadow-sm z-10 no-print">
                    <div className="flex items-center">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-gray-500 focus:outline-none lg:hidden mr-4"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <h1 className="text-xl font-semibold text-gray-800">Tahun Anggaran 2027</h1>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="relative hidden md:block">
                            <input
                                type="text"
                                className="bg-gray-100 rounded-full px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-sm"
                                placeholder="Cari data..."
                            />
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        </div>
                        <button className="text-gray-500 hover:text-gray-700 relative">
                            <Bell className="h-6 w-6" />
                            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                        </button>
                        <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold">
                                A
                            </div>
                            <span className="text-sm font-medium text-gray-700 hidden md:block">Administrator</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
