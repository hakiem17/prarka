'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Menu, Bell, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    // Generate breadcrumbs from pathname
    const generateBreadcrumbs = () => {
        const paths = pathname.split('/').filter(p => p);
        const breadcrumbs = [{ label: 'Home', href: '/dashboard' }];

        let currentPath = '';
        paths.forEach((path, index) => {
            currentPath += `/${path}`;
            // Skip dashboard if it's already first
            if (path === 'dashboard' && index === 0) return;

            // Format label (capitalize, replace hyphens)
            const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
            breadcrumbs.push({ label, href: currentPath });
        });

        return breadcrumbs;
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans transition-colors duration-300">
            <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
                {/* Sticky Header */}
                <header className="sticky top-0 z-20 flex flex-col bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
                    <div className="flex justify-between items-center py-3 px-6 h-16">
                        <div className="flex items-center">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="text-gray-500 hover:text-navy-700 focus:outline-none lg:hidden mr-4 transition-colors"
                            >
                                <Menu className="h-6 w-6" />
                            </button>

                            {/* Desktop Breadcrumbs (Top Level) */}
                            <h2 className="text-lg font-bold text-navy-900 dark:text-gray-100 hidden md:block">
                                Tahun Anggaran 2026
                            </h2>
                        </div>

                        <div className="flex items-center space-x-5">
                            <ThemeToggle />
                            <div className="relative hidden md:block group">
                                <input
                                    type="text"
                                    className="bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:bg-white dark:focus:bg-gray-600 focus:text-gray-900 dark:focus:text-gray-100 w-64 transition-all duration-200 border border-transparent focus:border-navy-200 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100"
                                    placeholder="Cari kegiatan..."
                                />
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500 group-focus-within:text-navy-500 dark:group-focus-within:text-navy-400 transition-colors" />
                            </div>

                            <button className="text-gray-400 hover:text-navy-700 relative transition-colors focus:outline-none">
                                <Bell className="h-6 w-6" />
                                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
                            </button>

                            <div className="flex items-center space-x-3 pl-3 border-l border-gray-200 dark:border-gray-700">
                                <div className="text-right hidden md:block">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Administrator</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Super Admin</p>
                                </div>
                                <div className="h-9 w-9 rounded-full bg-navy-100 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 flex items-center justify-center text-navy-800 dark:text-navy-100 font-bold shadow-sm cursor-pointer hover:bg-navy-200 dark:hover:bg-navy-700 transition-colors">
                                    A
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Sub-header / Breadcrumb Bar */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between shadow-sm z-10 transition-colors duration-300">
                    <Breadcrumb items={generateBreadcrumbs()} />
                </div>

                {/* Main Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6 scroll-smooth transition-colors duration-300">
                    {children}
                </main>
            </div>
        </div>
    );
}
