'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from '../admin.module.css';
import { CalendarDays, Loader2 } from 'lucide-react';

type Row = {
    id: string;
    user_id: string;
    work_date: string;
    summary: string;
    details: string | null;
    created_at: string;
    profiles?: { full_name?: string; username?: string; email?: string } | { full_name?: string; username?: string; email?: string }[] | null;
};

function monthKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function AdminWorkflowPage() {
    const [month, setMonth] = useState(monthKey());
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const res = await fetch(`/api/workflows?month=${month}`);
            const data = await res.json();
            setRows(Array.isArray(data) ? data : []);
            setLoading(false);
        })();
    }, [month]);

    const months = useMemo(() => {
        const now = new Date();
        return Array.from({ length: 12 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            return {
                key: monthKey(d),
                label: d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
            };
        });
    }, []);

    const nameOf = (r: Row) => {
        const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
        return p?.full_name || p?.username || p?.email || r.user_id.slice(0, 8);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Workflow Harian Tim</h1>
                    <p style={{ color: '#94a3b8', marginTop: '0.35rem' }}>Laporan task harian yang diisi user saat absen pulang.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CalendarDays size={16} color="#94a3b8" />
                    <select className={styles.searchInput} style={{ maxWidth: '220px', paddingLeft: '1rem' }} value={month} onChange={e => setMonth(e.target.value)}>
                        {months.map(m => (
                            <option key={m.key} value={m.key}>{m.label}</option>
                        ))}
                    </select>
                </div>
            </header>

            <div className={styles.sectionCard} style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', padding: '2rem' }}>
                        <Loader2 size={18} className="animate-spin" /> Memuat data workflow...
                    </div>
                ) : rows.length === 0 ? (
                    <div style={{ color: '#64748b', padding: '2rem', textAlign: 'center' }}>Belum ada data workflow bulan ini.</div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.adminTable}>
                            <thead>
                                <tr><th>Karyawan</th><th>Tanggal</th><th>Ringkasan</th><th>Detail</th><th>Dikirim</th></tr>
                            </thead>
                            <tbody>
                                {rows.map(r => (
                                    <tr key={r.id}>
                                        <td>{nameOf(r)}</td>
                                        <td>{r.work_date}</td>
                                        <td style={{ fontWeight: 600 }}>{r.summary}</td>
                                        <td style={{ color: '#94a3b8' }}>{r.details || '—'}</td>
                                        <td>{new Date(r.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
