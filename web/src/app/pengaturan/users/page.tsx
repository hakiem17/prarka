'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Loader2, Plus, User, Lock, Mail, AlertCircle, Trash2 } from 'lucide-react'; // Added Trash2

export default function UsersPage() {
    const [isLoading, setIsLoading] = useState(false);

    // User Management State
    const [users, setUsers] = useState<any[]>([]);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', confirmPassword: '' });
    const [isCreatingUser, setIsCreatingUser] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/users');
            const data = await res.json();

            if (data.users) {
                setUsers(data.users);
            } else if (data.error) {
                console.error('Error fetching users:', data.error);
                // alert('Gagal memuat users: ' + data.error);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newUser.password !== newUser.confirmPassword) {
            alert('Password tidak cocok!');
            return;
        }

        setIsCreatingUser(true);
        try {
            const res = await fetch('/api/auth/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: newUser.email,
                    password: newUser.password
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Gagal membuat user');
            }

            alert('User berhasil dibuat!');
            setIsAddUserOpen(false);
            setNewUser({ email: '', password: '', confirmPassword: '' });
            fetchUsers();

        } catch (error: any) {
            console.error('Create User Error:', error);
            alert(error.message);
        } finally {
            setIsCreatingUser(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-navy-900">Manajemen Pengguna</h2>
                    <p className="text-sm text-gray-500">Tambah dan kelola akses pengguna aplikasi.</p>
                </div>
                <Button onClick={() => setIsAddUserOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah User
                </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-6 h-6 animate-spin text-navy-600" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Dibuat Pada</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                        Tidak ada data user atau Anda tidak memiliki akses admin.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                    <User size={14} />
                                                </div>
                                                {user.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                Aktif
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" title="Hapus User (Belum Implementasi)">
                                                <Trash2 size={14} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Add User Modal */}
            {isAddUserOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-navy-900 mb-4">Tambah User Baru</h3>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="bg-blue-50 p-3 rounded text-sm text-blue-700 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <p>User akan dibuat langsung di Supabase Auth.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <input
                                        type="email"
                                        className="w-full pl-9 border rounded p-2"
                                        required
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                        placeholder="email@instansi.go.id"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <input
                                        type="password"
                                        className="w-full pl-9 border rounded p-2"
                                        required
                                        minLength={6}
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                        placeholder="Minimal 6 karakter"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Konfirmasi Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <input
                                        type="password"
                                        className="w-full pl-9 border rounded p-2"
                                        required
                                        value={newUser.confirmPassword}
                                        onChange={e => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                                        placeholder="Ulangi password"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>Batal</Button>
                                <Button type="submit" disabled={isCreatingUser}>
                                    {isCreatingUser ? 'Menambahkan...' : 'Tambah User'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
