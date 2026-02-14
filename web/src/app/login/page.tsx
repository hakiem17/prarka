'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, User, Loader2, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const LoginPage = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Priority Check: Hardcoded Admin for Development
            if (formData.email === 'admin' && formData.password === 'admin') {
                // Simulate network delay for UX
                await new Promise(resolve => setTimeout(resolve, 800));
                localStorage.setItem('token', 'dummy-token');
                router.push('/dashboard');
                return;
            }

            // Real Auth Attempt
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email.trim(),
                password: formData.password,
            });

            if (error) {
                // Determine user-friendly error
                if (error.message.includes('Invalid login credentials')) {
                    setError('Email atau password salah. Silakan coba lagi.');
                } else {
                    setError(error.message);
                }
                return;
            }

            if (data.user) {
                // Successful login
                router.push('/dashboard');
            }

        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Terjadi kesalahan saat login.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white font-sans">
            {/* Left Side: Brand / Hero */}
            <div className="hidden lg:flex w-1/2 bg-navy-900 relative overflow-hidden flex-col justify-between p-12 text-white">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] bg-blue-500 rounded-full blur-[150px]" />
                    <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-purple-500 rounded-full blur-[150px]" />
                </div>

                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-sm font-medium mb-8">
                        <ShieldCheck size={14} className="text-emerald-400" />
                        <span>Sistem Informasi Perencanaan Daerah</span>
                    </div>
                    <h1 className="text-5xl font-bold leading-tight mb-6">
                        Kelola Anggaran <br />
                        <span className="text-blue-400">Lebih Transparan</span> & <br />Akuntabel.
                    </h1>
                    <p className="text-my-blue-100 text-lg opacity-80 max-w-md">
                        Platform terintegrasi untuk penyusunan RKA, monitoring Renja, dan pelaporan realisasi anggaran dalam satu dashboard yang intuitif.
                    </p>
                </div>

                <div className="relative z-10 space-y-4 opacity-70">
                    <div className="flex items-center gap-4 text-sm font-medium">
                        <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
                        <span>Pemerintah Kabupaten Hulu Sungai Tengah</span>
                    </div>
                    <p className="text-xs">&copy; 2026 Diskominfosp. All rights reserved.</p>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50 relative">
                {/* Back to Home Button */}
                <Link
                    href="/"
                    className="absolute top-8 left-8 flex items-center gap-2 text-sm text-slate-500 hover:text-navy-700 transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Kembali
                </Link>

                <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100 animate-fade-in">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-navy-900">Selamat Datang</h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Silakan masuk menggunakan akun yang terdaftar
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                                    Email / Username
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="text"
                                        autoComplete="email"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm bg-slate-50 focus:bg-white"
                                        placeholder="admin"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                                    Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        required
                                        className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm bg-slate-50 focus:bg-white"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <div className="flex justify-end mt-2">
                                    <Link href="#" className="text-xs font-medium text-blue-600 hover:text-blue-500">
                                        Lupa password?
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 border border-red-100 animate-pulse">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-navy-700 hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-navy-200"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                                ) : (
                                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                        <ArrowRight className="h-5 w-5 text-navy-500 group-hover:text-navy-400 transition-colors" aria-hidden="true" />
                                    </span>
                                )}
                                {isLoading ? 'Memproses...' : 'Masuk ke Dashboard'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-xs text-slate-500">
                        <p>Belum punya akun? Hubungi Administrator Diskominfosp.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
