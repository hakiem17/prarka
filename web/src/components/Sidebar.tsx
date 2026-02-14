'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Home,
    Database,
    FileText,
    DollarSign,
    Settings,
    LogOut,
    ChevronDown,
    ChevronRight,
    LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils'; // Using our new utility

const Sidebar = ({ isOpen, toggleSidebar }: any) => {
    const pathname = usePathname();
    const router = useRouter();

    // State for collapsible menus
    const [openMenus, setOpenMenus] = useState<any>({
        referensi: false,
        rkpd: true, // Default open for ease of access
        standarHarga: false,
        pengaturan: false
    });

    // Auto-expand menus based on current path
    React.useEffect(() => {
        if (pathname.startsWith('/referensi')) {
            setOpenMenus((prev: any) => ({ ...prev, referensi: true }));
        } else if (pathname.startsWith('/rkpd')) {
            setOpenMenus((prev: any) => ({ ...prev, rkpd: true }));
        } else if (pathname.startsWith('/standar-harga')) {
            setOpenMenus((prev: any) => ({ ...prev, standarHarga: true }));
        } else if (pathname.startsWith('/pengaturan')) {
            setOpenMenus((prev: any) => ({ ...prev, pengaturan: true }));
        }
    }, [pathname]);

    const toggleMenu = (menu: string) => {
        setOpenMenus((prev: any) => ({
            ...prev,
            [menu]: !prev[menu]
        }));
    };

    const handleLogout = () => {
        // Clear token
        localStorage.removeItem('token');
        router.push('/login');
    };

    const isActive = (path: string) => pathname === path;
    const isParentActive = (pathPrefix: string) => pathname.startsWith(pathPrefix);

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-gray-900/50 z-40 lg:hidden transition-opacity duration-300",
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={toggleSidebar}
            ></div>

            {/* Sidebar Content */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 bg-navy-900 text-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-y-auto lg:shadow-none border-r border-navy-800",
                isOpen ? 'translate-x-0' : '-translate-x-full'
            )}>
                {/* Brand Section */}
                <div className="flex items-center h-20 px-6 bg-navy-950 border-b border-navy-800/50">
                    <div className="flex items-center space-x-3 w-full">
                        <div className="h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/50">
                            <LayoutDashboard className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-white text-base font-bold tracking-wide leading-none">SIPD-RKA</h1>
                            <p className="text-navy-300 text-[10px] mt-1 font-medium tracking-wider uppercase">Planning System</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-y-auto h-[calc(100vh-5rem)] py-6 px-4 space-y-8 scrollbar-thin scrollbar-thumb-navy-700 scrollbar-track-transparent">
                    {/* Main Menu Group */}
                    <div>
                        <h3 className="text-xs font-bold text-navy-400 uppercase tracking-widest mb-4 px-3">Main Menu</h3>
                        <nav className="space-y-1">
                            <Link
                                href="/dashboard"
                                className={cn(
                                    "group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                                    isActive('/dashboard')
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                                        : 'text-navy-100 hover:bg-navy-800 hover:text-white'
                                )}
                            >
                                <Home className={cn(
                                    "mr-3 h-5 w-5 transition-colors",
                                    isActive('/dashboard') ? 'text-white' : 'text-navy-300 group-hover:text-white'
                                )} />
                                Dashboard
                            </Link>

                            {/* RKPD */}
                            <div className="pt-1">
                                <button
                                    onClick={() => toggleMenu('rkpd')}
                                    className={cn(
                                        "w-full group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none",
                                        isParentActive('/rkpd') ? 'bg-navy-800 text-white' : 'text-navy-100 hover:bg-navy-800 hover:text-white'
                                    )}
                                >
                                    <div className="flex items-center">
                                        <FileText className={cn("mr-3 h-5 w-5 transition-colors", isParentActive('/rkpd') ? 'text-blue-400' : 'text-navy-300 group-hover:text-white')} />
                                        RKPD
                                    </div>
                                    {openMenus.rkpd ? (
                                        <ChevronDown className="h-4 w-4 text-navy-400" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-navy-400" />
                                    )}
                                </button>
                                {openMenus.rkpd && (
                                    <div className="mt-1 space-y-1 pl-11 pr-2 animate-in slide-in-from-top-2 duration-200">
                                        <Link href="/rkpd/renja" className={cn("block px-3 py-2 text-sm font-medium rounded-lg transition-colors border-l-2", isActive('/rkpd/renja') ? 'border-blue-500 text-white bg-white/5' : 'border-transparent text-navy-300 hover:text-white hover:bg-white/5')}>
                                            RENJA
                                        </Link>
                                        <Link href="/rkpd/jadwal" className="block px-3 py-2 text-sm font-medium text-navy-300 rounded-lg border-l-2 border-transparent hover:text-white hover:bg-white/5 transition-colors">
                                            Jadwal
                                        </Link>
                                        <Link href="/rkpd/laporan" className="block px-3 py-2 text-sm font-medium text-navy-300 rounded-lg border-l-2 border-transparent hover:text-white hover:bg-white/5 transition-colors">
                                            Laporan
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </nav>
                    </div>

                    {/* Data Master Group */}
                    <div>
                        <h3 className="text-xs font-bold text-navy-400 uppercase tracking-widest mb-4 px-3">Data Master</h3>
                        <nav className="space-y-1">
                            <div>
                                <button
                                    onClick={() => toggleMenu('referensi')}
                                    className={cn(
                                        "w-full group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none",
                                        isParentActive('/referensi') ? 'bg-navy-800 text-white' : 'text-navy-100 hover:bg-navy-800 hover:text-white'
                                    )}
                                >
                                    <div className="flex items-center">
                                        <Database className={cn("mr-3 h-5 w-5 transition-colors", isParentActive('/referensi') ? 'text-blue-400' : 'text-navy-300 group-hover:text-white')} />
                                        Referensi
                                    </div>
                                    {openMenus.referensi ? (
                                        <ChevronDown className="h-4 w-4 text-navy-400" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-navy-400" />
                                    )}
                                </button>
                                {openMenus.referensi && (
                                    <div className="mt-1 space-y-1 pl-11 pr-2 animate-in slide-in-from-top-2 duration-200">
                                        {['OPD', 'Urusan', 'Bidang Urusan', 'Program', 'Kegiatan', 'Sub Kegiatan', 'Sumber Dana'].map((item) => {
                                            const slug = item.toLowerCase().replace(/ /g, '-');
                                            const path = `/referensi/${slug}`;
                                            return (
                                                <Link key={slug} href={path} className={cn("block px-3 py-2 text-sm font-medium rounded-lg transition-colors border-l-2", isActive(path) ? 'border-blue-500 text-white bg-white/5' : 'border-transparent text-navy-300 hover:text-white hover:bg-white/5')}>
                                                    {item}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="pt-1">
                                <button
                                    onClick={() => toggleMenu('standarHarga')}
                                    className={cn(
                                        "w-full group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none",
                                        isParentActive('/standar-harga') ? 'bg-navy-800 text-white' : 'text-navy-100 hover:bg-navy-800 hover:text-white'
                                    )}
                                >
                                    <div className="flex items-center">
                                        <DollarSign className={cn("mr-3 h-5 w-5 transition-colors", isParentActive('/standar-harga') ? 'text-blue-400' : 'text-navy-300 group-hover:text-white')} />
                                        Standar Harga
                                    </div>
                                    {openMenus.standarHarga ? (
                                        <ChevronDown className="h-4 w-4 text-navy-400" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-navy-400" />
                                    )}
                                </button>
                                {openMenus.standarHarga && (
                                    <div className="mt-1 space-y-1 pl-11 pr-2 animate-in slide-in-from-top-2 duration-200">
                                        {['SSH', 'HSPK', 'ASB', 'SBU'].map((item) => {
                                            const slug = item.toLowerCase();
                                            const path = `/standar-harga/${slug}`;
                                            return (
                                                <Link key={slug} href={path} className={cn("block px-3 py-2 text-sm font-medium rounded-lg transition-colors border-l-2", isActive(path) ? 'border-blue-500 text-white bg-white/5' : 'border-transparent text-navy-300 hover:text-white hover:bg-white/5')}>
                                                    {item}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </nav>
                    </div>

                    {/* Settings Group */}
                    <div>
                        <h3 className="text-xs font-bold text-navy-400 uppercase tracking-widest mb-4 px-3">System</h3>
                        <nav className="space-y-1">
                            <div>
                                <button
                                    onClick={() => toggleMenu('pengaturan')}
                                    className={cn(
                                        "w-full group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none",
                                        isParentActive('/pengaturan') ? 'bg-navy-800 text-white' : 'text-navy-100 hover:bg-navy-800 hover:text-white'
                                    )}
                                >
                                    <div className="flex items-center">
                                        <Settings className={cn("mr-3 h-5 w-5 transition-colors", isParentActive('/pengaturan') ? 'text-blue-400' : 'text-navy-300 group-hover:text-white')} />
                                        Pengaturan
                                    </div>
                                    {openMenus.pengaturan ? (
                                        <ChevronDown className="h-4 w-4 text-navy-400" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-navy-400" />
                                    )}
                                </button>
                                {openMenus.pengaturan && (
                                    <div className="mt-1 space-y-1 pl-11 pr-2 animate-in slide-in-from-top-2 duration-200">
                                        <Link href="/pengaturan/users" className={cn("block px-3 py-2 text-sm font-medium rounded-lg transition-colors border-l-2", isActive('/pengaturan/users') ? 'border-blue-500 text-white bg-white/5' : 'border-transparent text-navy-300 hover:text-white hover:bg-white/5')}>
                                            Manajemen User
                                        </Link>
                                        <Link href="/pengaturan/profile" className={cn("block px-3 py-2 text-sm font-medium rounded-lg transition-colors border-l-2", isActive('/pengaturan/profile') ? 'border-blue-500 text-white bg-white/5' : 'border-transparent text-navy-300 hover:text-white hover:bg-white/5')}>
                                            Profil Saya
                                        </Link>
                                        <Link href="/pengaturan/aplikasi" className={cn("block px-3 py-2 text-sm font-medium rounded-lg transition-colors border-l-2", isActive('/pengaturan/aplikasi') ? 'border-blue-500 text-white bg-white/5' : 'border-transparent text-navy-300 hover:text-white hover:bg-white/5')}>
                                            Aplikasi
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-400 rounded-xl hover:bg-red-500/10 hover:text-red-300 transition-colors group mt-2"
                            >
                                <LogOut className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-300 transition-colors" />
                                Keluar Aplikasi
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
