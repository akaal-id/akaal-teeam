'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import { Clock, Play, Square, CheckCircle2, AlertCircle, FileText, CalendarDays, Loader2, X } from 'lucide-react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { useUser } from '../../contexts/UserContext';

interface AttendanceRecord {
    id: string;
    date: string;
    clock_in: string;
    clock_out: string | null;
    status: string;
}

interface LeaveRow {
    id: string;
    request_type: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: string;
    created_at: string;
}

function daysInclusive(start: string, end: string) {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (Number.isNaN(s) || Number.isNaN(e) || e < s) return 0;
    return Math.ceil((e - s) / 86400000) + 1;
}

function KehadiranContent() {
    const searchParams = useSearchParams();
    const leaveIdParam = searchParams.get('leaveId');
    const { clockInTime, clockOutTime, status, durationSeconds, clockIn, clockOut } = useAttendance();
    const { user } = useUser();
    const [attendanceLog, setAttendanceLog] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [leaveRows, setLeaveRows] = useState<LeaveRow[]>([]);
    const [leaveLoading, setLeaveLoading] = useState(false);
    const [leaveModalOpen, setLeaveModalOpen] = useState(false);
    const [submittingLeave, setSubmittingLeave] = useState(false);
    const [leaveError, setLeaveError] = useState('');

    const [requestType, setRequestType] = useState<'izin' | 'sakit'>('izin');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [izinProof, setIzinProof] = useState<File | null>(null);
    const [suratSakit, setSuratSakit] = useState<File | null>(null);

    useEffect(() => {
        if (leaveIdParam) setLeaveModalOpen(true);
    }, [leaveIdParam]);

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

    const calcDuration = (clockInIso: string, clockOut: string | null) => {
        if (!clockOut) return '-';
        const diff = new Date(clockOut).getTime() - new Date(clockInIso).getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        return `${h}j ${m}m`;
    };

    const fetchAttendance = async () => {
        if (!user?.id) return;
        setLoading(true);
        const res = await fetch(`/api/attendance?user_id=${user.id}`);
        const data = await res.json();
        if (Array.isArray(data)) {
            const today = new Date().toISOString().split('T')[0];
            setAttendanceLog(data.filter((r: AttendanceRecord) => r.date !== today));
        }
        setLoading(false);
    };

    const fetchLeaves = async () => {
        if (!user?.id) return;
        setLeaveLoading(true);
        const res = await fetch(`/api/leave-requests?user_id=${user.id}`);
        const data = await res.json();
        if (Array.isArray(data)) setLeaveRows(data);
        else setLeaveRows([]);
        setLeaveLoading(false);
    };

    useEffect(() => {
        fetchAttendance();
    }, [user, clockOutTime]);

    useEffect(() => {
        fetchLeaves();
    }, [user?.id]);

    const onTimeCount = attendanceLog.filter(r => r.status === 'Hadir').length;
    const lateCount = attendanceLog.filter(r => r.status === 'Terlambat').length;
    const totalMs = attendanceLog.reduce((acc, r) => {
        if (!r.clock_out) return acc;
        return acc + (new Date(r.clock_out).getTime() - new Date(r.clock_in).getTime());
    }, 0);
    const totalHours = Math.floor(totalMs / 3600000);

    const approvedLeaveDays = leaveRows
        .filter(r => r.status === 'Approved')
        .reduce((acc, r) => acc + daysInclusive(r.start_date, r.end_date), 0);

    const todayDate = clockInTime ? clockInTime.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

    const openLeaveModal = () => {
        setLeaveError('');
        setRequestType('izin');
        setStartDate('');
        setEndDate('');
        setReason('');
        setIzinProof(null);
        setSuratSakit(null);
        setLeaveModalOpen(true);
    };

    const closeLeaveModal = () => {
        setLeaveModalOpen(false);
        setLeaveError('');
    };

    const handleLeaveSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;
        setLeaveError('');
        if (!startDate || !endDate || !reason.trim()) {
            setLeaveError('Tanggal dan alasan wajib diisi.');
            return;
        }
        if (!izinProof) {
            setLeaveError('Bukti izin wajib diunggah.');
            return;
        }
        if (requestType === 'sakit' && !suratSakit) {
            setLeaveError('Untuk sakit, surat dokter wajib diunggah.');
            return;
        }

        setSubmittingLeave(true);
        const fd = new FormData();
        fd.append('user_id', user.id);
        fd.append('request_type', requestType);
        fd.append('start_date', startDate);
        fd.append('end_date', endDate);
        fd.append('reason', reason.trim());
        fd.append('izin_proof', izinProof);
        if (requestType === 'sakit' && suratSakit) fd.append('surat_sakit', suratSakit);

        const res = await fetch('/api/leave-requests', { method: 'POST', body: fd });
        const data = await res.json().catch(() => ({}));
        setSubmittingLeave(false);

        if (!res.ok) {
            setLeaveError((data as { error?: string }).error || 'Gagal mengirim pengajuan.');
            return;
        }
        closeLeaveModal();
        await fetchLeaves();
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.headerTitle}>Kehadiran</h1>
                    <p className={styles.subtitle}>Catat dan pantau waktu kerja Anda</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="button" className={styles.btnSecondary} onClick={openLeaveModal}>
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
                <div className={styles.metricsGrid}>
                    <div className={styles.metricCard}>
                        <div className={styles.metricHeader}>
                            <h3 className={styles.metricTitle}>Hadir Tepat Waktu</h3>
                            <div className={styles.iconWrapperTeal}>
                                <CheckCircle2 className={styles.metricIcon} />
                            </div>
                        </div>
                        <p className={styles.metricValue}>{onTimeCount} Hari</p>
                    </div>
                    <div className={styles.metricCard}>
                        <div className={styles.metricHeader}>
                            <h3 className={styles.metricTitle}>Terlambat</h3>
                            <div className={styles.iconWrapperRed}>
                                <AlertCircle className={styles.metricIcon} />
                            </div>
                        </div>
                        <p className={styles.metricValue}>{lateCount} Hari</p>
                    </div>
                    <div className={styles.metricCard}>
                        <div className={styles.metricHeader}>
                            <h3 className={styles.metricTitle}>Izin / Cuti (disetujui)</h3>
                            <div className={styles.iconWrapperBlue}>
                                <FileText className={styles.metricIcon} />
                            </div>
                        </div>
                        <p className={styles.metricValue}>{approvedLeaveDays} Hari</p>
                    </div>
                    <div className={styles.metricCard}>
                        <div className={styles.metricHeader}>
                            <h3 className={styles.metricTitle}>Total Jam Kerja</h3>
                            <div className={styles.iconWrapperPurple}>
                                <Clock className={styles.metricIcon} />
                            </div>
                        </div>
                        <p className={styles.metricValue}>{totalHours} Jam</p>
                    </div>
                </div>

                <div className={styles.cardFullWidth}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Pengajuan izin & sakit</h3>
                        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{leaveLoading ? 'Memuat…' : `${leaveRows.length} pengajuan`}</div>
                    </div>
                    {leaveRows.length === 0 && !leaveLoading ? (
                        <p style={{ color: '#64748b', padding: '0 0 1rem', fontSize: '0.9rem' }}>Belum ada pengajuan. Gunakan tombol &quot;Izin / Sakit&quot; di atas.</p>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.shadcnTable}>
                                <thead>
                                    <tr>
                                        <th>Jenis</th>
                                        <th>Periode</th>
                                        <th>Status</th>
                                        <th>Diajukan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaveRows.map(row => (
                                        <tr key={row.id} className={styles.trBody}>
                                            <td className={styles.tdTextBold} style={{ textTransform: 'capitalize' }}>
                                                {row.request_type}
                                                {leaveIdParam === row.id && (
                                                    <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', color: 'var(--teal)', fontWeight: 800 }}>•</span>
                                                )}
                                            </td>
                                            <td className={styles.tdText}>
                                                {row.start_date} — {row.end_date}
                                            </td>
                                            <td>
                                                <span
                                                    className={
                                                        row.status === 'Approved'
                                                            ? styles.badgeSuccess
                                                            : row.status === 'Rejected'
                                                              ? styles.badgeWarning
                                                              : row.status === 'Pending'
                                                                ? styles.badgeNeutral
                                                                : styles.badgeNeutral
                                                    }
                                                >
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className={styles.tdText}>
                                                {row.created_at ? new Date(row.created_at).toLocaleDateString('id-ID') : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

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
                                    {clockInTime && (
                                        <tr className={styles.trBody} style={{ backgroundColor: 'rgba(20, 184, 166, 0.05)' }}>
                                            <td className={styles.tdTextBold}>
                                                {todayDate}{' '}
                                                <span style={{ fontSize: '0.65rem', color: 'var(--teal)', fontWeight: 800, marginLeft: '0.5rem' }}>HARI INI</span>
                                            </td>
                                            <td className={styles.tdText}>{clockInTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td className={styles.tdText}>
                                                {clockOutTime ? clockOutTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : <span style={{ color: 'var(--teal)', fontWeight: 600 }}>{formatDuration(durationSeconds)}</span>}
                                            </td>
                                            <td className={styles.tdText}>
                                                {clockOutTime ? calcDuration(clockInTime.toISOString(), clockOutTime.toISOString()) : formatDuration(durationSeconds)}
                                            </td>
                                            <td>
                                                <span className={status === 'Hadir' || status === 'Selesai' ? styles.badgeSuccess : status === 'Terlambat' || status === 'Pulang Awal' ? styles.badgeWarning : styles.badgeNeutral}>
                                                    {status}
                                                </span>
                                            </td>
                                        </tr>
                                    )}
                                    {attendanceLog.length === 0 && !clockInTime ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                                                Belum ada riwayat kehadiran. Klik &quot;Absen Masuk&quot; untuk memulai.
                                            </td>
                                        </tr>
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

            {leaveModalOpen && (
                <div className={styles.modalBackdrop} role="presentation" onClick={closeLeaveModal}>
                    <div className={styles.modalPanel} role="dialog" aria-modal="true" aria-labelledby="leave-modal-title" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                            <div>
                                <h2 id="leave-modal-title" className={styles.modalTitle}>
                                    Pengajuan izin / sakit
                                </h2>
                                <p className={styles.modalHint}>Izin: wajib bukti izin. Sakit: wajib bukti izin + surat dokter.</p>
                            </div>
                            <button type="button" className={styles.btnGhost} onClick={closeLeaveModal} aria-label="Tutup">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleLeaveSubmit}>
                            <div className={styles.formGroup}>
                                <span className={styles.formLabel}>Jenis</span>
                                <div className={styles.radioRow}>
                                    <label className={styles.radioLabel}>
                                        <input type="radio" name="rt" checked={requestType === 'izin'} onChange={() => setRequestType('izin')} />
                                        Izin
                                    </label>
                                    <label className={styles.radioLabel}>
                                        <input type="radio" name="rt" checked={requestType === 'sakit'} onChange={() => setRequestType('sakit')} />
                                        Sakit
                                    </label>
                                </div>
                            </div>

                            <div className={styles.dateRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel} htmlFor="sd">
                                        Mulai
                                    </label>
                                    <input id="sd" className={styles.inputField} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel} htmlFor="ed">
                                        Selesai
                                    </label>
                                    <input id="ed" className={styles.inputField} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel} htmlFor="reason">
                                    Alasan
                                </label>
                                <textarea id="reason" className={styles.textAreaField} value={reason} onChange={e => setReason(e.target.value)} placeholder="Jelaskan singkat" required />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel} htmlFor="izin_proof">
                                    Bukti izin (wajib)
                                </label>
                                <input
                                    id="izin_proof"
                                    className={styles.fileInput}
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={e => setIzinProof(e.target.files?.[0] ?? null)}
                                />
                            </div>

                            {requestType === 'sakit' && (
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel} htmlFor="surat_sakit">
                                        Surat dokter (wajib untuk sakit)
                                    </label>
                                    <input
                                        id="surat_sakit"
                                        className={styles.fileInput}
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={e => setSuratSakit(e.target.files?.[0] ?? null)}
                                    />
                                </div>
                            )}

                            {leaveError && <p className={styles.errorText}>{leaveError}</p>}

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.btnGhost} onClick={closeLeaveModal}>
                                    Batal
                                </button>
                                <button type="submit" className={styles.btnSubmit} disabled={submittingLeave}>
                                    {submittingLeave ? <Loader2 size={18} className="animate-spin" /> : <CalendarDays size={18} />}
                                    Kirim pengajuan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function KehadiranPage() {
    return (
        <Suspense fallback={<div className={styles.container} style={{ padding: '3rem', color: '#94a3b8' }}>Memuat…</div>}>
            <KehadiranContent />
        </Suspense>
    );
}
