'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from '../admin.module.css';
import { CalendarDays, Edit2, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { useUser } from '../../../contexts/UserContext';

type AgendaEvent = {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    event_type: 'holiday' | 'event' | 'company' | 'announcement';
    created_at: string;
};

function monthKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function AdminAgendaPage() {
    const { user } = useUser();
    const [rows, setRows] = useState<AgendaEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [month, setMonth] = useState(monthKey());

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [current, setCurrent] = useState<Partial<AgendaEvent> | null>(null);

    const fetchRows = async () => {
        setLoading(true);
        const res = await fetch(`/api/admin/agenda-events?month=${month}`);
        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    useEffect(() => {
        void fetchRows();
    }, [month]);

    const months = useMemo(() => {
        const now = new Date();
        return Array.from({ length: 12 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = monthKey(d);
            const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            return { key, label };
        });
    }, []);

    const openModal = (row?: AgendaEvent) => {
        if (row) {
            setCurrent({ ...row });
        } else {
            setCurrent({
                title: '',
                event_date: new Date().toISOString().slice(0, 10),
                event_type: 'event',
                description: '',
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setCurrent(null);
        setIsModalOpen(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!current?.title || !current.event_date) return;

        setSaving(true);
        if (current.id) {
            await fetch('/api/admin/agenda-events', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: current.id,
                    title: current.title,
                    event_date: current.event_date,
                    event_type: current.event_type,
                    description: current.description || '',
                }),
            });
        } else {
            await fetch('/api/admin/agenda-events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: current.title,
                    event_date: current.event_date,
                    event_type: current.event_type,
                    description: current.description || '',
                    created_by: user?.id,
                }),
            });
        }
        setSaving(false);
        closeModal();
        await fetchRows();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus agenda ini?')) return;
        await fetch(`/api/admin/agenda-events?id=${id}`, { method: 'DELETE' });
        await fetchRows();
    };

    const filtered = rows.filter(r => {
        const q = search.toLowerCase();
        return (
            r.title.toLowerCase().includes(q) ||
            (r.description || '').toLowerCase().includes(q) ||
            r.event_date.includes(q) ||
            r.event_type.toLowerCase().includes(q)
        );
    });

    const badgeClass = (type: AgendaEvent['event_type']) => {
        if (type === 'holiday') return `${styles.statusBadge} ${styles.statusDone}`;
        if (type === 'company') return `${styles.statusBadge} ${styles.statusActive}`;
        if (type === 'announcement') return `${styles.statusBadge} ${styles.statusPending}`;
        return `${styles.statusBadge} ${styles.statusInactive}`;
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Agenda Events</h1>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CalendarDays size={16} color="#94a3b8" />
                        <select className={styles.searchInput} style={{ maxWidth: '220px', paddingLeft: '1rem' }} value={month} onChange={e => setMonth(e.target.value)}>
                            {months.map(m => (
                                <option key={m.key} value={m.key}>{m.label}</option>
                            ))}
                        </select>
                    </div>
                    <button className={styles.primaryBtn} onClick={() => openModal()}>
                        <Plus size={16} /> Tambah Agenda
                    </button>
                </div>
            </header>

            <div className={styles.sectionCard} style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1rem 0' }}>
                    <div className={styles.searchContainer} style={{ maxWidth: '340px' }}>
                        <Search size={16} className={styles.searchIcon} />
                        <input className={styles.searchInput} placeholder="Cari judul/tanggal/jenis..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '2rem', color: '#94a3b8' }}>
                        <Loader2 size={18} className="animate-spin" /> Memuat agenda...
                    </div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.adminTable}>
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Judul</th>
                                    <th>Jenis</th>
                                    <th>Deskripsi</th>
                                    <th style={{ textAlign: 'right' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '2.5rem' }}>Tidak ada agenda di bulan ini.</td></tr>
                                ) : (
                                    filtered.map(r => (
                                        <tr key={r.id}>
                                            <td>{r.event_date}</td>
                                            <td style={{ fontWeight: 600 }}>{r.title}</td>
                                            <td><span className={badgeClass(r.event_type)}>{r.event_type}</span></td>
                                            <td style={{ color: '#94a3b8', maxWidth: 300 }}>{r.description || '—'}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className={`${styles.actionBtn} ${styles.actionBtnEdit}`} onClick={() => openModal(r)}><Edit2 size={16} /></button>
                                                <button className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => handleDelete(r.id)}><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && current && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>{current.id ? 'Edit Agenda' : 'Tambah Agenda'}</h2>
                            <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={22} /></button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Judul</label>
                                    <input className={styles.inputField} value={current.title || ''} onChange={e => setCurrent({ ...current, title: e.target.value })} required />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Tanggal</label>
                                    <input type="date" className={styles.inputField} value={current.event_date || ''} onChange={e => setCurrent({ ...current, event_date: e.target.value })} required />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Jenis</label>
                                    <select className={styles.inputField} value={current.event_type || 'event'} onChange={e => setCurrent({ ...current, event_type: e.target.value as AgendaEvent['event_type'] })}>
                                        <option value="event">event</option>
                                        <option value="holiday">holiday</option>
                                        <option value="company">company</option>
                                        <option value="announcement">announcement</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                                <label className={styles.label}>Deskripsi</label>
                                <textarea className={styles.textArea} value={current.description || ''} onChange={e => setCurrent({ ...current, description: e.target.value })} />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.secondaryBtn} onClick={closeModal}>Batal</button>
                                <button type="submit" className={styles.primaryBtn} disabled={saving}>{saving ? 'Menyimpan...' : current.id ? 'Update' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
