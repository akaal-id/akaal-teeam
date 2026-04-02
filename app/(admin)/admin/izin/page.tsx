'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '../admin.module.css';
import { Check, Loader2, X, ExternalLink } from 'lucide-react';

interface Attachment {
    attachment_type: string;
    storage_path: string;
    signed_url?: string | null;
}

interface LeaveRow {
    id: string;
    user_id: string;
    request_type: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: string;
    created_at: string;
    profiles?: { full_name?: string; username?: string; email?: string } | null;
    leave_request_attachments?: Attachment[];
}

function AdminIzinContent() {
    const searchParams = useSearchParams();
    const highlightId = searchParams.get('leaveId');
    const [rows, setRows] = useState<LeaveRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'Pending'>('Pending');
    const [acting, setActing] = useState<string | null>(null);

    const fetchRows = async () => {
        setLoading(true);
        const q = filter === 'Pending' ? '?status=Pending' : '';
        const res = await fetch(`/api/admin/leave-requests${q}`);
        const data = await res.json();
        if (Array.isArray(data)) setRows(data);
        else setRows([]);
        setLoading(false);
    };

    useEffect(() => {
        fetchRows();
    }, [filter]);

    const patchStatus = async (id: string, status: 'Approved' | 'Rejected') => {
        setActing(id);
        const res = await fetch('/api/admin/leave-requests', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status }),
        });
        setActing(null);
        if (res.ok) await fetchRows();
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Izin & Sakit</h1>
                    <p style={{ color: '#94a3b8', marginTop: '0.35rem', fontSize: '0.95rem' }}>
                        Tinjau pengajuan karyawan dan lampiran.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        type="button"
                        className={filter === 'Pending' ? styles.primaryBtn : styles.secondaryBtn}
                        onClick={() => setFilter('Pending')}
                    >
                        Menunggu
                    </button>
                    <button
                        type="button"
                        className={filter === 'all' ? styles.primaryBtn : styles.secondaryBtn}
                        onClick={() => setFilter('all')}
                    >
                        Semua
                    </button>
                </div>
            </header>

            <div className={styles.sectionCard} style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '1rem', color: '#94a3b8' }}>
                        <Loader2 size={20} className="animate-spin" /> Memuat pengajuan...
                    </div>
                ) : rows.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Tidak ada data.</div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.adminTable}>
                            <thead>
                                <tr>
                                    <th>Karyawan</th>
                                    <th>Jenis</th>
                                    <th>Tanggal</th>
                                    <th>Alasan</th>
                                    <th>Status</th>
                                    <th>Lampiran</th>
                                    <th style={{ textAlign: 'right' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(row => {
                                    const name = row.profiles?.full_name || row.profiles?.username || row.user_id.slice(0, 8);
                                    const isHi = highlightId === row.id;
                                    return (
                                        <tr
                                            key={row.id}
                                            style={
                                                isHi
                                                    ? { backgroundColor: 'rgba(20, 184, 166, 0.08)', outline: '1px solid rgba(20, 184, 166, 0.35)' }
                                                    : undefined
                                            }
                                        >
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.profiles?.email}</div>
                                            </td>
                                            <td style={{ textTransform: 'capitalize' }}>{row.request_type}</td>
                                            <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                                {row.start_date} — {row.end_date}
                                            </td>
                                            <td style={{ maxWidth: '220px', fontSize: '0.85rem', color: '#94a3b8' }}>{row.reason}</td>
                                            <td>
                                                <span
                                                    className={`${styles.statusBadge} ${
                                                        row.status === 'Approved'
                                                            ? styles.statusActive
                                                            : row.status === 'Rejected'
                                                              ? styles.statusInactive
                                                              : row.status === 'Pending'
                                                                ? styles.statusPending
                                                                : styles.statusDone
                                                    }`}
                                                >
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                    {(row.leave_request_attachments || []).map(a => (
                                                        <span key={a.storage_path + a.attachment_type}>
                                                            {a.signed_url ? (
                                                                <a
                                                                    href={a.signed_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    style={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.25rem',
                                                                        fontSize: '0.8rem',
                                                                        color: 'var(--teal)',
                                                                    }}
                                                                >
                                                                    <ExternalLink size={12} /> {a.attachment_type.replace('_', ' ')}
                                                                </a>
                                                            ) : (
                                                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{a.attachment_type}</span>
                                                            )}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                {row.status === 'Pending' ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                        <button
                                                            type="button"
                                                            className={styles.actionBtn}
                                                            disabled={acting === row.id}
                                                            onClick={() => patchStatus(row.id, 'Approved')}
                                                            title="Setujui"
                                                            style={{
                                                                background: 'rgba(20, 184, 166, 0.15)',
                                                                color: 'var(--teal)',
                                                                border: 'none',
                                                                borderRadius: '0.5rem',
                                                                padding: '0.4rem 0.6rem',
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            {acting === row.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={acting === row.id}
                                                            onClick={() => patchStatus(row.id, 'Rejected')}
                                                            title="Tolak"
                                                            style={{
                                                                background: 'rgba(239, 68, 68, 0.12)',
                                                                color: '#ef4444',
                                                                border: 'none',
                                                                borderRadius: '0.5rem',
                                                                padding: '0.4rem 0.6rem',
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#64748b', fontSize: '0.8rem' }}>—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminIzinPage() {
    return (
        <Suspense
            fallback={
                <div className={styles.container} style={{ padding: '3rem', color: '#94a3b8' }}>
                    <Loader2 size={22} className="animate-spin" style={{ display: 'inline' }} /> Memuat...
                </div>
            }
        >
            <AdminIzinContent />
        </Suspense>
    );
}
