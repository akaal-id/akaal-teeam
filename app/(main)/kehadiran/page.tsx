'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { Clock, Play, Square, CheckCircle2, AlertCircle, FileText, CalendarDays, ChevronDown, Loader2 } from 'lucide-react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { useUser } from '../../contexts/UserContext';
import { supabase } from '../../../lib/supabase';

interface AttendanceRecord {
    id: string;
    date: string;
    clock_in: string;
    clock_out: string | null;
    status: string;
}

export default function KehadiranPage() {
    const { clockInTime, clockOutTime, status, durationSeconds, clockIn, clockOut } = useAttendance();
    const { user } = useUser();
    const [attendanceLog, setAttendanceLog] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const formatDuration = (totalSecs: number) => {
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const formatTime = (isoString: string | null) => {
        if (!isoString) return '-';
        return new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const calcDuration = (clockIn: string, clockOut: string | null) => {
        if (!clockOut) return '-';
        const diff = new Date(clockOut).getTime() - new Date(clockIn).getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        return `${h}j ${m}m`;
    };

    useEffect(() => {
        const fetchAttendance = async () => {
            if (!user?.id) return;
            setLoading(true);
            const res = await fetch(`/api/attendance?user_id=${user.id}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                // Filter out today (shown separately)
                const today = new Date().toISOString().split('T')[0];
                setAttendanceLog(data.filter((r: AttendanceRecord) => r.date !== today));
            }
            setLoading(false);
        };
        fetchAttendance();
    }, [user, clockOutTime]); // Re-fetch when clock out to update stats

    const onTimeCount = attendanceLog.filter(r => r.status === 'Hadir').length;
    const lateCount = attendanceLog.filter(r => r.status === 'Terlambat').length;
    const totalMs = attendanceLog.reduce((acc, r) => {
        if (!r.clock_out) return acc;
        return acc + (new Date(r.clock_out).getTime() - new Date(r.clock_in).getTime());
    }, 0);
    const totalHours = Math.floor(totalMs / 3600000);

    const todayDate = clockInTime ? clockInTime.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.headerTitle}>Kehadiran</h1>
                    <p className={styles.subtitle}>Catat dan pantau waktu kerja Anda</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className={styles.btnSecondary} onClick={() => alert('Formulir pengajuan izin/sakit akan segera diimplementasikan.')}>
                        <FileText className={styles.iconSm} /> Izin / Sakit
                    </button>
                    {!clockInTime ? (
                        <button className={styles.clockInBtn} onClick={clockIn}>
                            <Play className={styles.iconSm} /> Absen Masuk
                        </button>
                    ) : !clockOutTime ? (
                        <button className={styles.clockOutBtn} onClick={clockOut}>
                            <Square className={styles.iconSm} /> Catat Pulang
                        </button>
                    ) : (
                        <button className={styles.clockInBtn} style={{ backgroundColor: 'var(--border)', color: '#94a3b8', cursor: 'not-allowed', boxShadow: 'none' }} disabled>
                            <CheckCircle2 className={styles.iconSm} /> Selesai Hari Ini
                        </button>
                    )}
                </div>
            </header>

            <main className={styles.mainContent}>
                {/* Metrics */}
                <div className={styles.metricsGrid}>
                    <div className={styles.metricCard}>
                        <div className={styles.metricHeader}>
                            <h3 className={styles.metricTitle}>Hadir Tepat Waktu</h3>
                            <div className={styles.iconWrapperTeal}><CheckCircle2 className={styles.metricIcon} /></div>
                        </div>
                        <p className={styles.metricValue}>{onTimeCount} Hari</p>
                    </div>
                    <div className={styles.metricCard}>
                        <div className={styles.metricHeader}>
                            <h3 className={styles.metricTitle}>Terlambat</h3>
                            <div className={styles.iconWrapperRed}><AlertCircle className={styles.metricIcon} /></div>
                        </div>
                        <p className={styles.metricValue}>{lateCount} Hari</p>
                    </div>
                    <div className={styles.metricCard}>
                        <div className={styles.metricHeader}>
                            <h3 className={styles.metricTitle}>Izin / Cuti</h3>
                            <div className={styles.iconWrapperBlue}><FileText className={styles.metricIcon} /></div>
                        </div>
                        <p className={styles.metricValue}>0 Hari</p>
                    </div>
                    <div className={styles.metricCard}>
                        <div className={styles.metricHeader}>
                            <h3 className={styles.metricTitle}>Total Jam Kerja</h3>
                            <div className={styles.iconWrapperPurple}><Clock className={styles.metricIcon} /></div>
                        </div>
                        <p className={styles.metricValue}>{totalHours} Jam</p>
                    </div>
                </div>

                {/* Table */}
                <div className={styles.cardFullWidth}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Riwayat Kehadiran</h3>
                        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Data dari database</div>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '2rem', color: '#94a3b8' }}>
                            <Loader2 size={18} /> Memuat riwayat...
                        </div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.shadcnTable}>
                                <thead>
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>Jam Masuk</th>
                                        <th>Jam Keluar</th>
                                        <th>Total Durasi</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Today's live record */}
                                    {clockInTime && (
                                        <tr className={styles.trBody} style={{ backgroundColor: 'rgba(20, 184, 166, 0.05)' }}>
                                            <td className={styles.tdTextBold}>{todayDate} <span style={{ fontSize: '0.65rem', color: 'var(--teal)', fontWeight: 800, marginLeft: '0.5rem' }}>HARI INI</span></td>
                                            <td className={styles.tdText}>{clockInTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td className={styles.tdText}>{clockOutTime ? clockOutTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : <span style={{ color: 'var(--teal)', fontWeight: 600 }}>{formatDuration(durationSeconds)}</span>}</td>
                                            <td className={styles.tdText}>{clockOutTime ? calcDuration(clockInTime.toISOString(), clockOutTime.toISOString()) : formatDuration(durationSeconds)}</td>
                                            <td>
                                                <span className={status === 'Hadir' || status === 'Selesai' ? styles.badgeSuccess : status === 'Terlambat' || status === 'Pulang Awal' ? styles.badgeWarning : styles.badgeNeutral}>
                                                    {status}
                                                </span>
                                            </td>
                                        </tr>
                                    )}
                                    {attendanceLog.length === 0 && !clockInTime ? (
                                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Belum ada riwayat kehadiran. Klik "Absen Masuk" untuk memulai.</td></tr>
                                    ) : (
                                        attendanceLog.map(log => (
                                            <tr key={log.id} className={styles.trBody}>
                                                <td className={styles.tdTextBold}>{formatDate(log.date)}</td>
                                                <td className={styles.tdText}>{formatTime(log.clock_in)}</td>
                                                <td className={styles.tdText}>{formatTime(log.clock_out)}</td>
                                                <td className={styles.tdText}>{calcDuration(log.clock_in, log.clock_out)}</td>
                                                <td>
                                                    <span className={log.status === 'Hadir' || log.status === 'Selesai' ? styles.badgeSuccess : log.status === 'Terlambat' || log.status === 'Pulang Awal' ? styles.badgeWarning : styles.badgeNeutral}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
