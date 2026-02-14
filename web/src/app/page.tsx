'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart3, ShieldCheck, Zap, Layers } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="relative min-h-screen bg-slate-50 overflow-hidden text-slate-900">
            {/* Ornamen Background - Modern Minimalist */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-10 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-blue-600 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[50%] bg-emerald-500 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-6 pt-20 pb-20 relative z-10 font-sans">
                <div className="flex flex-col lg:flex-row items-center gap-12 min-h-[80vh] justify-center">

                    {/* Kolom Kiri: Copywriting */}
                    <div className="lg:w-1/2 text-center lg:text-left space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium animate-fade-in shadow-sm">
                            <Zap size={14} />
                            <span>Built with Next.js 15 & Supabase</span>
                        </div>

                        <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">
                            Transformasi Digital <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600">
                                Penganggaran Daerah
                            </span>
                        </h1>

                        <p className="text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                            Sistem manajemen RKA & RKPD yang cerdas. Monitoring real-time,
                            perhitungan koefisien otomatis, dan integrasi data Renja dalam satu platform modern.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                            <Link href="/login" className="px-8 py-4 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-200 flex items-center gap-2 group transform hover:scale-105">
                                Mulai Kelola RKA
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Link>

                        </div>

                        {/* Trust Badges */}
                        <div className="pt-8 border-t border-slate-200 flex flex-wrap justify-center lg:justify-start gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                            <div className="flex items-center gap-2 font-bold text-slate-400 hover:text-blue-600 transition-colors">
                                <BarChart3 size={18} /> RKPD 2026
                            </div>
                            <div className="flex items-center gap-2 font-bold text-slate-400 hover:text-blue-600 transition-colors">
                                <Layers size={18} /> SIPD CONNECTOR
                            </div>
                            <div className="flex items-center gap-2 font-bold text-slate-400 hover:text-blue-600 transition-colors">
                                <ShieldCheck size={18} /> E-KATALOG
                            </div>
                        </div>
                    </div>

                    {/* Kolom Kanan: Mockup UI */}
                    <div className="lg:w-1/2 w-full relative perspective-1000">
                        <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 overflow-hidden animate-float transform rotate-y-6 hover:rotate-y-0 transition-transform duration-700">
                            {/* Header Tabel Imitasi */}
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                    <div className="w-3 h-3 rounded-full bg-green-400" />
                                </div>
                                <div className="h-4 w-32 bg-slate-100 rounded-md" />
                            </div>

                            {/* Baris Monitoring dengan Traffic Light */}
                            <div className="space-y-4">
                                {[
                                    { label: "Penyediaan Gaji & Tunjangan", status: "🔵", val: "Balanced", color: "bg-blue-50 border-blue-100 text-blue-700" },
                                    { label: "Pengadaan Alat Tulis Kantor", status: "🔴", val: "Surplus (Sisa)", color: "bg-red-50 border-red-100 text-red-700" },
                                    { label: "Honorarium Narasumber", status: "🟢", val: "Deficit (Lebih)", color: "bg-green-50 border-green-100 text-green-700" }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl filter drop-shadow-sm">{item.status}</span>
                                            <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                                        </div>
                                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${item.color}`}>{item.val}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Decorative Graph Placeholder */}
                            <div className="mt-6 flex items-end gap-2 h-24 px-2">
                                {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
                                    <div key={i} className="flex-1 bg-slate-100 rounded-t-sm hover:bg-blue-100 transition-colors relative group">
                                        <div className="absolute bottom-0 w-full bg-blue-500 rounded-t-sm transition-all duration-500 group-hover:bg-blue-600" style={{ height: `${h}%` }}></div>
                                    </div>
                                ))}
                            </div>

                            {/* Floating Element: Smart Coefficient */}
                            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 animate-bounce-slow z-20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                        <Layers size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Auto-Coefficient</p>
                                        <p className="text-sm font-bold text-slate-800 font-mono">25 x 12 x 3 = 900</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Background blob for depth */}
                        <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-blue-100/50 to-purple-100/50 blur-3xl rounded-full opacity-60"></div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LandingPage;
