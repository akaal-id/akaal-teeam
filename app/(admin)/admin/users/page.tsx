'use client';
import React, { useState, useEffect } from 'react';
import styles from '../admin.module.css';
import { Trash2, Edit2, UserPlus, Search, X, Loader2 } from 'lucide-react';

interface UserProfile {
    id?: string;
    name: string;
    full_name?: string;
    email: string;
    username: string;
    role: string;
    status: string;
    bio: string;
    dob: string;
    password?: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

    // Fetch users from API
    const fetchUsers = async () => {
        setLoading(true);
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        if (Array.isArray(data)) {
            setUsers(data.map((u: any) => ({ ...u, name: u.full_name || u.name || '' })));
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const openModal = (user: UserProfile | null = null) => {
        setError('');
        setCurrentUser(user || { name: '', email: '', role: 'Employee', status: 'Active', bio: '', username: '', dob: '', password: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentUser(null);
        setError('');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setSaving(true);
        setError('');

        if (currentUser.id) {
            // Editing existing user (update profile table only, not auth)
            const res = await fetch(`/api/admin/users`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentUser)
            });
            if (res.ok) { await fetchUsers(); closeModal(); }
            else { const d = await res.json(); setError(d.error || 'Gagal menyimpan.'); }
        } else {
            // Creating new user via Auth
            if (!currentUser.password) { setError('Password wajib diisi untuk akun baru.'); setSaving(false); return; }
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...currentUser, name: currentUser.name })
            });
            const data = await res.json();
            if (data.success) { await fetchUsers(); closeModal(); }
            else { setError(data.error || 'Gagal membuat akun.'); }
        }
        setSaving(false);
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Manajemen Karyawan (Users)</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className={styles.searchContainer}>
                        <Search size={16} className={styles.searchIcon} />
                        <input type="text" className={styles.searchInput} placeholder="Cari nama / role / email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <button className={styles.primaryBtn} onClick={() => openModal()}><UserPlus size={16} /> Tambah User</button>
                </div>
            </header>

            <div className={styles.sectionCard} style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '1rem', color: '#94a3b8' }}>
                        <Loader2 size={20} className="animate-spin" /> Memuat data karyawan...
                    </div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.adminTable}>
                            <thead>
                                <tr>
                                    <th>Nama Karyawan</th>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Tgl Lahir</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Belum ada karyawan. Klik "Tambah User" untuk memulai.</td></tr>
                                ) : (
                                    filteredUsers.map((u, i) => (
                                        <tr key={u.id || i}>
                                            <td style={{ fontWeight: 600, color: 'var(--teal)' }}>{u.name || u.full_name}</td>
                                            <td style={{ color: '#94a3b8' }}>@{u.username}</td>
                                            <td>{u.email}</td>
                                            <td>{u.role}</td>
                                            <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{u.dob || '-'}</td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${u.status === 'Active' ? styles.statusActive : styles.statusInactive}`}>
                                                    {u.status}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className={`${styles.actionBtn} ${styles.actionBtnEdit}`} onClick={() => openModal({ ...u, name: u.full_name || u.name })} title="Edit Data"><Edit2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Create/Edit User */}
            {isModalOpen && currentUser && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>{currentUser.id ? 'Edit Detail Karyawan' : 'Buat Akun Karyawan Baru'}</h2>
                            <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={24} /></button>
                        </div>
                        {error && <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>{error}</div>}
                        <form onSubmit={handleSave}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Nama Lengkap</label>
                                    <input type="text" className={styles.inputField} value={currentUser.name} onChange={e => setCurrentUser({ ...currentUser, name: e.target.value })} required placeholder="Andi Saputra" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Username Login</label>
                                    <input type="text" className={styles.inputField} value={currentUser.username} onChange={e => setCurrentUser({ ...currentUser, username: e.target.value })} required placeholder="andi_akl" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Email Kantor</label>
                                    <input type="email" className={styles.inputField} value={currentUser.email} onChange={e => setCurrentUser({ ...currentUser, email: e.target.value })} required placeholder="user@akaal.team" disabled={!!currentUser.id} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Role / Jabatan</label>
                                    <input type="text" className={styles.inputField} value={currentUser.role} onChange={e => setCurrentUser({ ...currentUser, role: e.target.value })} required placeholder="Lead Developer" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Tanggal Lahir</label>
                                    <input type="date" className={styles.inputField} value={currentUser.dob} onChange={e => setCurrentUser({ ...currentUser, dob: e.target.value })} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Status Akun</label>
                                    <select className={styles.inputField} value={currentUser.status} onChange={e => setCurrentUser({ ...currentUser, status: e.target.value })}>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                                {!currentUser.id && (
                                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                        <label className={styles.label}>Password Awal <span style={{ color: '#ef4444' }}>*</span></label>
                                        <input type="password" className={styles.inputField} value={currentUser.password || ''} onChange={e => setCurrentUser({ ...currentUser, password: e.target.value })} placeholder="Minimal 6 karakter" required={!currentUser.id} />
                                    </div>
                                )}
                            </div>
                            <div className={styles.formGroup} style={{ marginTop: '1.5rem' }}>
                                <label className={styles.label}>Biografi / Deskripsi Pekerjaan</label>
                                <textarea className={styles.textArea} value={currentUser.bio} onChange={e => setCurrentUser({ ...currentUser, bio: e.target.value })} placeholder="Tuliskan deskripsi singkat atau biografi karyawan..." />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.secondaryBtn} onClick={closeModal}>Batal</button>
                                <button type="submit" className={styles.primaryBtn} style={{ borderRadius: '9999px', padding: '0.75rem 2rem' }} disabled={saving}>
                                    {saving ? 'Menyimpan...' : 'Simpan Akun'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
