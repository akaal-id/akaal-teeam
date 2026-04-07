'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './admin.module.css';
import { Users, FileBarChart, Clock, Activity, FileText, Loader2, ArrowRight } from 'lucide-react';

type Activity = {
    id: string;
    kind: 'attendance' | 'task';
    title: string;
    subtitle: string;
    at: string;
};

type DashboardData = {
    todayDate: string;
    activeEmployeesCount: number;
    pendingTasksCount: number;
    attendanceTodayCount: number;
    attendanceTodayLabel: string;
    recentActivity: Activity[];
};

function formatRelative(iso: string) {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return '';
    const diff = Date.now() - t;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'baru saja';
    if (m < 60) return `${m} menit lalu`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} jam lalu`;
    const d = Math.floor(h / 24);
    return `${d} hari lalu`;
}

export default function AdminPages() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError('');
            const res = await fetch('/api/admin/dashboard');
            const json = await res.json();
            if (cancelled) return;
            if (!res.ok) {
                setError(typeof json?.error === 'string' ? json.error : 'Gagal memuat dashboard.');
                setData(null);
            } else {
                setData(json as DashboardData);
            }
            setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Admin Dashboard</h1>
                    {data?.todayDate && (
                        <p style={{ color: '#94a3b8', marginTop: '0.35rem', fontSize: '0.9rem' }}>
                            Tanggal sistem (WIB): <strong style={{ color: 'var(--foreground)' }}>{data.todayDate}</strong>
                        </p>
                    )}
                </div>
                <Link href="/admin/kehadiran" className={styles.primaryBtn} style={{ textDecoration: 'none' }}>
                    Lihat kehadiran <ArrowRight size={16} />
                </Link>
            </header>

            {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', padding: '1rem 0' }}>
                    <Loader2 size={20} className="animate-spin" /> Memuat data…
                </div>
            )}

            {error && !loading && (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '0.75rem', color: '#fca5a5' }}>
                    {error}
                </div>
            )}

            {!loading && data && (
                <>
                    <div className={styles.metricsGrid}>
                        <div className={styles.metricCard}>
                            <div className={styles.metricLabel}>
                                <span style={{ color: '#94a3b8' }}>Karyawan aktif</span>
                                <div className={styles.iconWrapperTeal}>
                                    <Users size={20} />
                                </div>
                            </div>
                            <p className={styles.metricValue}>{data.activeEmployeesCount}</p>
                        </div>
                        <div className={styles.metricCard}>
                            <div className={styles.metricLabel}>
                                <span style={{ color: '#94a3b8' }}>Task Pending</span>
                                <div className={styles.iconWrapperOrange}>
                                    <FileBarChart size={20} />
                                </div>
                            </div>
                            <p className={styles.metricValueOrange}>{data.pendingTasksCount}</p>
                        </div>
                        <div className={styles.metricCard}>
                            <div className={styles.metricLabel}>
                                <span style={{ color: '#94a3b8' }}>Kehadiran hari ini</span>
                                <div className={styles.iconWrapperPurple}>
                                    <Clock size={20} />
                                </div>
                            </div>
                            <p className={styles.metricValueTeal}>
                                {data.attendanceTodayCount}
                                <span style={{ fontSize: '1.25rem', color: '#64748b' }}>
                                    /{data.activeEmployeesCount || '—'}
                                </span>
                            </p>
                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>Catatan absen untuk tanggal hari ini (WIB)</p>
                        </div>
                    </div>

                    <div className={styles.sectionCard}>
                        <h2 className={styles.sectionTitle}>
                            <Activity size={20} color="var(--teal)" /> Aktivitas terbaru
                        </h2>
                        {data.recentActivity.length === 0 ? (
                            <p style={{ color: '#64748b', padding: '0.5rem 0' }}>Belum ada aktivitas kehadiran atau task.</p>
                        ) : (
                            <div className={styles.logList}>
                                {data.recentActivity.map(item => (
                                    <div key={item.id} className={styles.logItem}>
                                        <div className={styles.logText}>
                                            <div className={styles.logIcon}>
                                                {item.kind === 'attendance' ? (
                                                    <Clock size={16} color="#f59e0b" />
                                                ) : (
                                                    <FileText size={16} color="var(--teal)" />
                                                )}
                                            </div>
                                            <div>
                                                <span style={{ fontWeight: 600 }}>{item.title}</span> — {item.subtitle}
                                            </div>
                                        </div>
                                        <span className={styles.logTime}>{formatRelative(item.at)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
