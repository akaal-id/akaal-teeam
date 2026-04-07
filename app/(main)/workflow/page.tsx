'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from '../task/page.module.css';
import { CalendarDays, Loader2, ListChecks } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

type WorkflowRow = {
    id: string;
    work_date: string;
    summary: string;
    details: string | null;
    created_at: string;
};

function monthKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function WorkflowPage() {
    const { user } = useUser();
    const [month, setMonth] = useState(monthKey());
    const [rows, setRows] = useState<WorkflowRow[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRows = async () => {
        if (!user?.id) return;
        setLoading(true);
        const res = await fetch(`/api/workflows?user_id=${user.id}&month=${month}`);
        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    useEffect(() => {
        void fetchRows();
    }, [user?.id, month]);

    const months = useMemo(() => {
        const now = new Date();
        return Array.from({ length: 12 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = monthKey(d);
            const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            return { key, label };
        });
    }, []);

    return (
        <div className={styles.taskContainer}>
            <header className={styles.headerAction}>
                <div>
                    <h1 className={styles.headerTitle}>Workflow Harian</h1>
                    <p className={styles.subtitle}>Ringkasan pekerjaan harian yang dikirim saat absen pulang.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <CalendarDays size={16} color="#94a3b8" />
                    <select className={styles.shadcnSelect} value={month} onChange={e => setMonth(e.target.value)}>
                        {months.map(m => (
                            <option key={m.key} value={m.key}>{m.label}</option>
                        ))}
                    </select>
                </div>
            </header>

            <div className={styles.cardFullWidth}>
                {loading ? (
                    <div style={{ display: 'flex', gap: '0.5rem', color: '#94a3b8', padding: '1.5rem' }}><Loader2 size={18} className="animate-spin" /> Memuat workflow…</div>
                ) : rows.length === 0 ? (
                    <p style={{ color: '#64748b', padding: '1rem' }}>Belum ada catatan workflow untuk bulan ini.</p>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.historyTable}>
                            <thead>
                                <tr><th>Tanggal</th><th>Ringkasan</th><th>Detail</th><th>Dikirim</th></tr>
                            </thead>
                            <tbody>
                                {rows.map(r => (
                                    <tr key={r.id}>
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

            <div style={{ color: '#64748b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ListChecks size={14} /> 1 halaman menampilkan 1 bulan; pilih bulan dari dropdown.
            </div>
        </div>
    );
}
