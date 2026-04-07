'use client';

import React, { useEffect, useState, useMemo } from 'react';
import styles from '../admin.module.css';
import { Clock, Loader2, Search, User } from 'lucide-react';

interface Profile {
    id: string;
    full_name?: string;
    username?: string;
    email?: string;
}

interface AttRow {
    id: string;
    user_id: string;
    date: string;
    clock_in: string;
    clock_out: string | null;
    status: string;
    profiles?: Profile | Profile[] | null;
}

export default function AdminKehadiranPage() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [rows, setRows] = useState<AttRow[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingAtt, setLoadingAtt] = useState(true);
    const [userId, setUserId] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        (async () => {
            setLoadingUsers(true);
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (Array.isArray(data)) {
                setUsers(data.map((u: Profile & { name?: string }) => ({ ...u, full_name: u.full_name || u.name })));
            }
            setLoadingUsers(false);
        })();
    }, []);

    const fetchAttendance = async () => {
        setLoadingAtt(true);
        const params = new URLSearchParams();
        if (userId) params.set('user_id', userId);
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        params.set('limit', '500');
        const res = await fetch(`/api/admin/attendance?${params.toString()}`);
        const data = await res.json();
        if (Array.isArray(data)) setRows(data);
        else setRows([]);
        setLoadingAtt(false);
    };

    useEffect(() => {
        fetchAttendance();
    }, [userId, from, to]);

    const profileName = (r: AttRow) => {
        const p = r.profiles;
        const one = Array.isArray(p) ? p[0] : p;
        return one?.full_name || one?.username || one?.email || r.user_id.slice(0, 8) + '…';
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(r => {
            const name = profileName(r).toLowerCase();
            const email = (Array.isArray(r.profiles) ? r.profiles[0]?.email : r.profiles?.email) || '';
            return name.includes(q) || email.toLowerCase().includes(q) || r.date.includes(q);
        });
    }, [rows, search]);

    const formatTime = (iso: string | null) => {
        if (!iso) return '—';
        return new Date(iso).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
    };

    const statusClass = (s: string) => {
        if (s === 'Hadir' || s === 'Selesai') return styles.statusActive;
        if (s === 'Terlambat' || s === 'Pulang Awal') return styles.statusPending;
        return styles.statusInactive;
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Kehadiran karyawan</h1>
                    <p style={{ color: '#94a3b8', marginTop: '0.35rem', fontSize: '0.95rem' }}>
                        Data dari tabel <code style={{ color: 'var(--teal)' }}>attendance</code> — filter per orang atau rentang tanggal.
                    </p>
                </div>
            </header>

            <div className={styles.sectionCard} style={{ marginBottom: '1rem' }}>
                <div className={styles.formGrid} style={{ alignItems: 'flex-end' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.35rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                            Karyawan
                        </label>
                        <select
                            className={styles.searchInput}
                            style={{ paddingLeft: '1rem', width: '100%', maxWidth: '320px' }}
                            value={userId}
                            onChange={e => setUserId(e.target.value)}
                            disabled={loadingUsers}
                        >
                            <option value="">Semua</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.full_name || u.username || u.email || u.id}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.35rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                            Dari tanggal
                        </label>
                        <input type="date" className={styles.searchInput} style={{ paddingLeft: '1rem' }} value={from} onChange={e => setFrom(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.35rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                            Sampai tanggal
                        </label>
                        <input type="date" className={styles.searchInput} style={{ paddingLeft: '1rem' }} value={to} onChange={e => setTo(e.target.value)} />
                    </div>
                    <button type="button" className={styles.secondaryBtn} onClick={() => void fetchAttendance()}>
                        Muat ulang
                    </button>
                </div>

                <div style={{ marginTop: '1rem', position: 'relative' }}>
                    <Search size={16} className={styles.searchIcon} style={{ top: '0.85rem' }} />
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Cari nama, email, atau tanggal…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: '2.5rem', maxWidth: '400px' }}
                    />
                </div>
            </div>

            <div className={styles.sectionCard} style={{ padding: 0, overflow: 'hidden' }}>
                {loadingAtt ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.75rem', color: '#94a3b8' }}>
                        <Loader2 size={20} className="animate-spin" /> Memuat kehadiran…
                    </div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.adminTable}>
                            <thead>
                                <tr>
                                    <th>Karyawan</th>
                                    <th>Tanggal</th>
                                    <th>Masuk</th>
                                    <th>Pulang</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                                            Tidak ada data untuk filter ini.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map(r => (
                                        <tr key={r.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <User size={16} color="#64748b" />
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{profileName(r)}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                            {(Array.isArray(r.profiles) ? r.profiles[0]?.email : r.profiles?.email) || ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{r.date}</td>
                                            <td>{formatTime(r.clock_in)}</td>
                                            <td>{r.clock_out ? formatTime(r.clock_out) : '—'}</td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${statusClass(r.status)}`}>{r.status}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '1rem' }}>
                <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                Maks. 500 baris per permintaan. Sesuaikan filter tanggal bila perlu.
            </p>
        </div>
    );
}
