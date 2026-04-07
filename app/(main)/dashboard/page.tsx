'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';
import {
    CheckCircle2,
    Clock,
    TrendingUp,
    CalendarDays,
    Gift,
    ChevronDown,
    Check,
    Target,
    AlertCircle,
    Users,
    X,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useRouter } from 'next/navigation';
import { useAttendance } from '../../contexts/AttendanceContext';
import { useTodo, TodoItem } from '../../contexts/TodoContext';
import { useUser } from '../../contexts/UserContext';

type AgendaItem = {
    id: string;
    date: string;
    title: string;
    kind: 'task' | 'birthday' | 'holiday' | 'event' | 'leave';
    status?: string | null;
};

interface AttendanceRecord {
    id: string;
    date: string;
    clock_in: string;
    clock_out: string | null;
    status: string;
}

interface Task {
    id: string;
    title: string;
    status: string;
    created_at: string;
}

interface CalendarTask {
    id: string;
    title: string;
    status: string;
    deadline: string | null;
    assignee?: { full_name?: string } | null;
    assignor?: { full_name?: string } | null;
}

interface BirthdayProfile {
    id: string;
    full_name: string;
    role: string;
    dob: string;
}

const DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className={styles.customTooltip}>
                <p className={styles.tooltipLabel}>{label}</p>
                <div className={styles.tooltipItem}>
                    <div className={styles.tooltipIndicatorTeal}></div>
                    <span>
                        Tugas Selesai: <strong>{payload[0]?.value || 0} Tugas</strong>
                    </span>
                </div>
                <div className={styles.tooltipItem}>
                    <div className={styles.tooltipIndicatorPurple}></div>
                    <span>
                        Jam Kerja: <strong>{payload[1]?.value || 0} Jam</strong>
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export default function DashboardPage() {
    const router = useRouter();
    const { user } = useUser();
    const { clockInTime, clockOutTime, status, durationSeconds } = useAttendance();
    const { todos, toggleTodo } = useTodo();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [attendanceLog, setAttendanceLog] = useState<AttendanceRecord[]>([]);
    const [birthdays, setBirthdays] = useState<BirthdayProfile[]>([]);
    const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
    const [currentMonth, setCurrentMonth] = useState('');
    const [calendarModalDate, setCalendarModalDate] = useState<string | null>(null);
    const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([]);
    const [calendarLoading, setCalendarLoading] = useState(false);

    const now = new Date();

    const formatDuration = (totalSecs: number) => {
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        return `${h}j ${m}m ${s}d`;
    };

    const isTomorrowHoliday = () => {
        const day = new Date().getDay();
        return day === 5 || day === 6;
    };

    useEffect(() => {
        setCurrentMonth(now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }));
    }, []);

    useEffect(() => {
        if (!user?.id) return;

        const fetchAll = async () => {
            const [tasksRes, attendRes, usersRes, agendaRes] = await Promise.all([
                fetch(`/api/tasks?user_id=${user.id}`),
                fetch(`/api/attendance?user_id=${user.id}`),
                fetch('/api/admin/users'),
                fetch(`/api/agenda?year=${now.getFullYear()}&month=${now.getMonth() + 1}`),
            ]);

            const tasksData = await tasksRes.json();
            if (Array.isArray(tasksData)) setTasks(tasksData);

            const attendData = await attendRes.json();
            if (Array.isArray(attendData)) setAttendanceLog(attendData);

            const usersData = await usersRes.json();
            if (Array.isArray(usersData)) {
                const currentMonthNum = now.getMonth() + 1;
                const upcoming = usersData
                    .filter((u: any) => u.dob && new Date(u.dob).getMonth() + 1 === currentMonthNum)
                    .map((u: any) => ({ id: u.id, full_name: u.full_name || u.name, role: u.role, dob: u.dob }));
                setBirthdays(upcoming);
            }

            const agendaData = await agendaRes.json();
            setAgendaItems(Array.isArray(agendaData?.items) ? agendaData.items : []);
        };

        void fetchAll();
    }, [user?.id]);

    const buildChartData = () => {
        const last5Working: { day: string; tugas: number; jam: number }[] = [];
        const sorted = [...attendanceLog]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
            .reverse();

        sorted.forEach(record => {
            const dayLabel = DAYS_ID[new Date(record.date).getDay()];
            const doneOnDay = tasks.filter(t => t.status === 'Done' && t.created_at?.startsWith(record.date)).length;
            const ms = record.clock_out ? new Date(record.clock_out).getTime() - new Date(record.clock_in).getTime() : 0;
            const hours = Math.round(ms / 3600000);
            last5Working.push({ day: dayLabel, tugas: doneOnDay, jam: hours });
        });

        if (last5Working.length === 0) {
            return [
                { day: 'Sen', tugas: 0, jam: 0 },
                { day: 'Sel', tugas: 0, jam: 0 },
                { day: 'Rab', tugas: 0, jam: 0 },
                { day: 'Kam', tugas: 0, jam: 0 },
                { day: 'Jum', tugas: 0, jam: 0 },
            ];
        }
        return last5Working;
    };

    const chartData = buildChartData();
    const tasksDone = tasks.filter(t => t.status === 'Done').length;
    const tasksActive = tasks.filter(t => t.status !== 'Done').length;
    const totalAttendDays = attendanceLog.filter(r => r.status === 'Hadir' || r.status === 'Selesai').length;

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const calStartPadding = firstDay === 0 ? 6 : firstDay - 1;

    const agendaByDay = useMemo(() => {
        const map = new Map<number, AgendaItem[]>();
        for (const item of agendaItems) {
            const d = new Date(item.date);
            if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) continue;
            const day = d.getDate();
            const list = map.get(day) || [];
            list.push(item);
            map.set(day, list);
        }
        return map;
    }, [agendaItems]);


    const openDayTasks = async (day: number) => {
        if (!user?.id) return;
        const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setCalendarModalDate(date);
        setCalendarLoading(true);
        const res = await fetch(`/api/tasks?user_id=${encodeURIComponent(user.id)}&date=${date}`);
        const data = await res.json();
        setCalendarTasks(Array.isArray(data) ? data : []);
        setCalendarLoading(false);
    };

    const badgeClass = (kind: AgendaItem['kind'], status?: string | null) => {
        if (kind === 'holiday') return styles.calBadgeDone;
        if (kind === 'birthday') return styles.calBadgePurple;
        if (kind === 'leave') return styles.calBadgeYellow;
        if (kind === 'task') return status === 'Done' ? styles.calBadgeDone : styles.calBadgeTeal;
        return styles.calBadgeNeutral;
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.headerTitle}>Halo, {user?.full_name?.split(' ')[0] || 'User'} 👋</h1>
                    <p className={styles.subtitle}>Ringkasan aktivitas dan metrik tim Anda</p>
                </div>
                <button className={styles.dateDropdownBtn}>
                    <CalendarDays className={styles.iconSm} />
                    <span>{currentMonth}</span>
                    <ChevronDown className={styles.iconSm} style={{ marginLeft: '0.25rem' }} />
                </button>
            </header>

            <main className={styles.mainContent}>
                <div className={`${styles.attendanceBanner} ${!clockInTime ? styles.attendanceBannerPending : ''}`} onClick={() => router.push('/kehadiran')}>
                    {clockOutTime ? (
                        <div className={styles.attActive} style={{ backgroundColor: 'rgba(20, 184, 166, 0.05)', borderColor: 'rgba(20, 184, 166, 0.2)' }}>
                            <div className={styles.attInfo}>
                                <div className={styles.iconWrapperTealSolid} style={{ backgroundColor: 'var(--teal)' }}><CheckCircle2 className={styles.metricIcon} /></div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span className={styles.attTitleTeal}>{status === 'Pulang Awal' ? 'Pulang Awal' : 'Sudah Absen Pulang'}</span>
                                    <span className={styles.attSubTeal}>{isTomorrowHoliday() ? 'Besok hari libur, selamat beristirahat.' : 'Besok semangat kerja lagi.'}</span>
                                </div>
                            </div>
                            <span className={styles.attAction}>Lihat Riwayat →</span>
                        </div>
                    ) : clockInTime ? (
                        <div className={styles.attActive}>
                            <div className={styles.attInfo}>
                                <div className={styles.iconWrapperTealSolid}><Clock className={styles.metricIcon} /></div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span className={styles.attTitleTeal}>Status: {status}</span>
                                    <span className={styles.attSubTeal}>Masuk sejak {clockInTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                                </div>
                            </div>
                            <div className={styles.attDurationBlock}>
                                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Durasi Real-time</span>
                                <strong style={{ fontSize: '1.25rem', color: 'var(--teal)', fontVariantNumeric: 'tabular-nums' }}>{formatDuration(durationSeconds)}</strong>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.attPending}>
                            <div className={styles.attInfo}>
                                <div className={styles.iconWrapperRedSolid}><AlertCircle className={styles.metricIcon} /></div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span className={styles.attTitleRed}>Anda Belum Absen Masuk!</span>
                                    <span className={styles.attSubRed}>Segera catat kehadiran Anda hari ini.</span>
                                </div>
                            </div>
                            <span className={styles.attAction}>Buka Kehadiran →</span>
                        </div>
                    )}
                </div>

                <div className={styles.metricsGrid}>
                    <div className={styles.metricCard}><div className={styles.metricHeader}><h3 className={styles.metricTitle}>Tugas Diselesaikan</h3><div className={styles.iconWrapperPurple}><CheckCircle2 className={styles.metricIcon} /></div></div><p className={styles.metricValue}>{tasksDone}</p><p className={styles.metricChangePositive}>total tugas selesai</p></div>
                    <div className={styles.metricCard}><div className={styles.metricHeader}><h3 className={styles.metricTitle}>Tugas Aktif</h3><div className={styles.iconWrapperTeal}><Clock className={styles.metricIcon} /></div></div><p className={styles.metricValue}>{tasksActive}</p><p className={styles.metricChangeNeutral}>sedang berjalan</p></div>
                    <div className={styles.metricCard}><div className={styles.metricHeader}><h3 className={styles.metricTitle}>Hari Hadir</h3><div className={styles.iconWrapperBlue}><TrendingUp className={styles.metricIcon} /></div></div><p className={styles.metricValue}>{totalAttendDays}</p><p className={styles.metricChangePositive}>hari bulan ini</p></div>
                </div>

                <div className={styles.bentoGrid}>
                    <div className={styles.gridLeft}>
                        <div className={styles.card}>
                            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>Statistik Rekam Jejak</h3><span style={{ fontSize: '0.8rem', color: '#64748b' }}>5 Hari Terakhir</span></div>
                            <div className={styles.chartContainer}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                        <Bar dataKey="tugas" fill="var(--teal)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                        <Bar dataKey="jam" fill="var(--purple)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className={styles.card}>
                            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>To-Do List Harian</h3><button className={styles.btnText} onClick={() => router.push('/task')}>Kelola di Task</button></div>
                            <div className={styles.tableContainer}>
                                <table className={styles.shadcnTable}>
                                    <thead><tr><th className={styles.thCheck}></th><th className={styles.thTask}>Task</th><th className={styles.thStatus}>Status</th></tr></thead>
                                    <tbody>
                                        {todos.length === 0 ? (
                                            <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.875rem' }}>Belum ada to-do. Tambahkan di halaman Task.</td></tr>
                                        ) : (
                                            todos.map((todo: TodoItem) => (
                                                <tr key={todo.id} className={styles.trBody} onClick={() => void toggleTodo(todo.id)}>
                                                    <td className={styles.tdCheck}><div className={`${styles.shadcnCheckbox} ${todo.completed ? styles.shadcnCheckboxChecked : ''}`}>{todo.completed && <Check className={styles.checkIconSm} />}</div></td>
                                                    <td className={`${styles.tdTask} ${todo.completed ? styles.todoTextStrike : ''}`}>{todo.text}</td>
                                                    <td className={styles.tdStatus}>{todo.completed ? <span className={styles.badgeDone}>Done</span> : todo.urgent ? <span className={styles.badgeUrgent}>Urgent</span> : <span className={styles.badgePending}>Pending</span>}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className={styles.gridRight}>
                        <div className={styles.card} style={{ position: 'relative', overflow: 'hidden' }}>
                            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>Top Performers</h3><div className={styles.iconWrapperTealSm}><Users className={styles.iconSm} /></div></div>
                            <div style={{ filter: 'blur(5px)', opacity: 0.4, pointerEvents: 'none' }}>{[1, 2, 3].map(i => <div key={i} className={styles.leaderboardItem}><div className={i === 1 ? styles.avatarRank1 : styles.avatarRank}>{i}</div><div className={styles.leadInfo}><p className={styles.leadName}>User #{i}</p><p className={styles.leadPoints}>--,--- Pts</p></div></div>)}</div>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', zIndex: 10, backdropFilter: 'blur(1px)' }}><div style={{ backgroundColor: 'var(--teal)', color: 'var(--background)', padding: '0.4rem 1rem', borderRadius: '9999px', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Coming Soon</div><p style={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>Fitur Leaderboard</p></div>
                        </div>

                        <div className={styles.card} style={{ position: 'relative', overflow: 'hidden' }}>
                            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>Tantangan Tersedia</h3><Target className={styles.iconTeal} /></div>
                            <div style={{ filter: 'blur(5px)', opacity: 0.4, pointerEvents: 'none' }}>{['Challenge A', 'Challenge B'].map(c => <div key={c} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}><span style={{ fontWeight: 600 }}>{c}</span><span style={{ color: 'var(--teal)' }}>+500 Pts</span></div>)}</div>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', zIndex: 10, backdropFilter: 'blur(1px)' }}><div style={{ backgroundColor: 'var(--purple)', color: 'white', padding: '0.4rem 1rem', borderRadius: '9999px', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Coming Soon</div><p style={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>Fitur Tantangan</p></div>
                        </div>

                        <div className={styles.card}>
                            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>Ulang Tahun Karyawan</h3><Gift className={styles.iconTeal} /></div>
                            <div className={styles.birthdayList}>
                                {birthdays.length === 0 ? (
                                    <p style={{ color: '#64748b', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>Tidak ada ulang tahun bulan ini 🎂</p>
                                ) : (
                                    birthdays.map(b => {
                                        const d = new Date(b.dob);
                                        return (
                                            <div key={b.id} className={styles.birthdayItem}>
                                                <div className={styles.birthdayDate}><span className={styles.bDay}>{d.getDate()}</span><span className={styles.bMonth}>{d.toLocaleDateString('id-ID', { month: 'short' })}</span></div>
                                                <div className={styles.birthdayInfo}><p className={styles.bName}>{b.full_name}</p><p className={styles.bRole}>{b.role}</p></div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.cardFullWidth}>
                    <div className={styles.cardHeader}>
                        <div><h3 className={styles.cardTitle}>Agenda Bulan Ini (Semua Tim)</h3><p className={styles.subtitleSm}>{currentMonth}</p></div>
                        <CalendarDays className={styles.iconPurple} />
                    </div>
                    <div className={styles.calendarMonthContainer}>
                        <div className={styles.calGridMonth}>
                            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => <div key={d} className={styles.calHeader}>{d}</div>)}
                            {Array.from({ length: calStartPadding }).map((_, i) => <div key={`pad-${i}`} className={styles.calDayMuted}></div>)}
                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                                const list = agendaByDay.get(d) || [];
                                const isToday = d === now.getDate();
                                return (
                                    <button
                                        key={`d-${d}`}
                                        type="button"
                                        className={isToday ? styles.calDayToday : styles.calDayMonth}
                                        style={{ textAlign: 'left', cursor: 'pointer', border: 'none' }}
                                        onClick={() => void openDayTasks(d)}
                                    >
                                        <div className={styles.calDateWrapper}><span className={styles.calDateNum}>{d}</span></div>
                                        <div className={styles.calEventStack}>
                                            {list.slice(0, 3).map(item => <span key={item.id} className={badgeClass(item.kind, item.status)}>{item.title}</span>)}
                                            {list.length > 3 && <span className={styles.calBadgeNeutral}>+{list.length - 3} lainnya</span>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>


                {calendarModalDate && (
                    <div className={styles.modalBackdrop} role="presentation" onClick={() => setCalendarModalDate(null)}>
                        <div className={styles.modalPanel} role="dialog" aria-modal="true" onClick={e => e.stopPropagation()} style={{ maxWidth: 760 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <h3 className={styles.cardTitle}>Task pada {calendarModalDate}</h3>
                                <button type="button" className={styles.btnGhost} onClick={() => setCalendarModalDate(null)}><X size={16} /></button>
                            </div>
                            {calendarLoading ? (
                                <div style={{ color: '#94a3b8', display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Clock size={14} /> Memuat task...</div>
                            ) : calendarTasks.length === 0 ? (
                                <p style={{ color: '#64748b' }}>Tidak ada task yang terassign/diassign oleh Anda pada tanggal ini.</p>
                            ) : (
                                <div className={styles.tableContainer}>
                                    <table className={styles.shadcnTable}>
                                        <thead><tr><th>Judul</th><th>Status</th><th>Assignee</th><th>Assignor</th></tr></thead>
                                        <tbody>
                                            {calendarTasks.map(t => (
                                                <tr key={t.id} className={styles.trBody} onClick={() => router.push(`/task?taskId=${t.id}`)}>
                                                    <td className={styles.tdTask}>{t.title}</td>
                                                    <td className={styles.tdStatus}><span className={t.status === 'Done' ? styles.badgeDone : styles.badgePending}>{t.status}</span></td>
                                                    <td className={styles.tdTask}>{t.assignee?.full_name || '-'}</td>
                                                    <td className={styles.tdTask}>{t.assignor?.full_name || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
