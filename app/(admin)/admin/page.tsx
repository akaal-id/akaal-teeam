'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styles from './admin.module.css';
import { Users, FileBarChart, Clock, Activity, FileText, Loader2, ArrowRight, CalendarDays, X } from 'lucide-react';

type ActivityRow = {
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
    recentActivity: ActivityRow[];
};

type CalendarTask = {
    id: string;
    title: string;
    status: string;
    deadline: string | null;
    assignee?: { full_name?: string } | null;
    assignor?: { full_name?: string } | null;
};

type AgendaItem = {
    id: string;
    date: string;
    title: string;
    kind: 'task' | 'birthday' | 'holiday' | 'event' | 'leave';
    status?: string | null;
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
    return `${Math.floor(h / 24)} hari lalu`;
}

export default function AdminPages() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [calendarModalDate, setCalendarModalDate] = useState<string | null>(null);
    const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([]);
    const [calendarLoading, setCalendarLoading] = useState(false);

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const calStartPadding = firstDay === 0 ? 6 : firstDay - 1;

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError('');

            const [dashRes, agendaRes] = await Promise.all([
                fetch('/api/admin/dashboard'),
                fetch(`/api/agenda?year=${now.getFullYear()}&month=${now.getMonth() + 1}`),
            ]);

            const dashJson = await dashRes.json();
            const agendaJson = await agendaRes.json();

            if (cancelled) return;
            if (!dashRes.ok) {
                setError(typeof dashJson?.error === 'string' ? dashJson.error : 'Gagal memuat dashboard.');
                setData(null);
            } else {
                setData(dashJson as DashboardData);
            }

            setAgendaItems(Array.isArray(agendaJson?.items) ? agendaJson.items : []);
            setLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const agendaByDay = useMemo(() => {
        const map = new Map<number, AgendaItem[]>();
        for (const item of agendaItems) {
            const d = new Date(item.date);
            if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) continue;
            const day = d.getDate();
            const arr = map.get(day) || [];
            arr.push(item);
            map.set(day, arr);
        }
        return map;
    }, [agendaItems]);

    const badgeStyle = (kind: AgendaItem['kind']) => {
        if (kind === 'holiday') return { background: 'rgba(168,85,247,0.2)', color: '#d8b4fe' };
        if (kind === 'birthday') return { background: 'rgba(56,189,248,0.2)', color: '#7dd3fc' };
        if (kind === 'leave') return { background: 'rgba(245,158,11,0.2)', color: '#fbbf24' };
        if (kind === 'task') return { background: 'rgba(20,184,166,0.2)', color: '#5eead4' };
        return { background: 'rgba(148,163,184,0.2)', color: '#cbd5e1' };
    };

    const openDayTasks = async (day: number) => {
        const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setCalendarModalDate(date);
        setCalendarLoading(true);
        const res = await fetch(`/api/tasks?date=${date}`);
        const taskData = await res.json();
        setCalendarTasks(Array.isArray(taskData) ? taskData : []);
        setCalendarLoading(false);
    };

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
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link href="/admin/kehadiran" className={styles.primaryBtn} style={{ textDecoration: 'none' }}>
                        Lihat kehadiran <ArrowRight size={16} />
                    </Link>
                    <Link href="/admin/workflow" className={styles.secondaryBtn} style={{ textDecoration: 'none' }}>
                        Workflow
                    </Link>
                </div>
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
                    {calendarModalDate && (
                        <div className={styles.modalOverlay}>
                            <div className={styles.modalContent} style={{ maxWidth: 860 }}>
                                <div className={styles.modalHeader}>
                                    <h2 className={styles.modalTitle}>Task pada {calendarModalDate}</h2>
                                    <button onClick={() => setCalendarModalDate(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={22} /></button>
                                </div>
                                {calendarLoading ? (
                                    <div style={{ color: '#94a3b8', display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Loader2 size={16} className="animate-spin" /> Memuat task...</div>
                                ) : calendarTasks.length === 0 ? (
                                    <p style={{ color: '#64748b' }}>Tidak ada task deadline di tanggal ini.</p>
                                ) : (
                                    <div className={styles.tableContainer}>
                                        <table className={styles.adminTable}>
                                            <thead><tr><th>Judul</th><th>Status</th><th>Assignee</th><th>Assignor</th></tr></thead>
                                            <tbody>
                                                {calendarTasks.map(t => (
                                                    <tr key={t.id} onClick={() => (window.location.href = `/admin/tasks?taskId=${t.id}`)} style={{ cursor: 'pointer' }}>
                                                        <td style={{ fontWeight: 600 }}>{t.title}</td>
                                                        <td><span className={`${styles.statusBadge} ${t.status === 'Done' ? styles.statusDone : styles.statusPending}`}>{t.status}</span></td>
                                                        <td>{t.assignee?.full_name || '-'}</td>
                                                        <td>{t.assignor?.full_name || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className={styles.metricsGrid}>
                        <div className={styles.metricCard}><div className={styles.metricLabel}><span style={{ color: '#94a3b8' }}>Karyawan aktif</span><div className={styles.iconWrapperTeal}><Users size={20} /></div></div><p className={styles.metricValue}>{data.activeEmployeesCount}</p></div>
                        <div className={styles.metricCard}><div className={styles.metricLabel}><span style={{ color: '#94a3b8' }}>Task Pending</span><div className={styles.iconWrapperOrange}><FileBarChart size={20} /></div></div><p className={styles.metricValueOrange}>{data.pendingTasksCount}</p></div>
                        <div className={styles.metricCard}><div className={styles.metricLabel}><span style={{ color: '#94a3b8' }}>Kehadiran hari ini</span><div className={styles.iconWrapperPurple}><Clock size={20} /></div></div><p className={styles.metricValueTeal}>{data.attendanceTodayCount}<span style={{ fontSize: '1.25rem', color: '#64748b' }}>/ {data.activeEmployeesCount || '—'}</span></p></div>
                    </div>

                    <div className={styles.sectionCard}>
                        <h2 className={styles.sectionTitle}><Activity size={20} color="var(--teal)" /> Aktivitas terbaru</h2>
                        {data.recentActivity.length === 0 ? (
                            <p style={{ color: '#64748b', padding: '0.5rem 0' }}>Belum ada aktivitas kehadiran atau task.</p>
                        ) : (
                            <div className={styles.logList}>
                                {data.recentActivity.map(item => (
                                    <div key={item.id} className={styles.logItem}>
                                        <div className={styles.logText}>
                                            <div className={styles.logIcon}>{item.kind === 'attendance' ? <Clock size={16} color="#f59e0b" /> : <FileText size={16} color="var(--teal)" />}</div>
                                            <div><span style={{ fontWeight: 600 }}>{item.title}</span> — {item.subtitle}</div>
                                        </div>
                                        <span className={styles.logTime}>{formatRelative(item.at)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={styles.sectionCard}>
                        <h2 className={styles.sectionTitle}><CalendarDays size={20} color="var(--purple)" /> Kalender agenda seluruh tim</h2>
                        <div style={{ color: '#94a3b8', marginBottom: '1rem', fontSize: '0.85rem' }}>
                            Mencakup task, izin/sakit, ulang tahun, hari besar, dan agenda event lain.
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: '0.5rem' }}>
                            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => (
                                <div key={d} style={{ color: '#94a3b8', fontSize: '0.75rem', textAlign: 'center', fontWeight: 700 }}>{d}</div>
                            ))}
                            {Array.from({ length: calStartPadding }).map((_, i) => <div key={`pad-${i}`} />)}
                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                const list = agendaByDay.get(day) || [];
                                const isToday = day === now.getDate();
                                return (
                                    <button key={day} type="button" onClick={() => void openDayTasks(day)} style={{ minHeight: 92, background: isToday ? 'rgba(20,184,166,0.09)' : 'rgba(15,23,42,0.35)', border: `1px solid ${isToday ? 'rgba(20,184,166,0.4)' : 'var(--border)'}`, borderRadius: 8, padding: '0.35rem', overflow: 'hidden', textAlign: 'left', cursor: 'pointer' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.78rem', marginBottom: '0.3rem', color: isToday ? 'var(--teal)' : 'var(--foreground)' }}>{day}</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            {list.slice(0, 2).map(it => (
                                                <span key={it.id} style={{ ...badgeStyle(it.kind), fontSize: '0.62rem', borderRadius: 6, padding: '2px 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={it.title}>{it.title}</span>
                                            ))}
                                            {list.length > 2 && <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>+{list.length - 2} lainnya</span>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
