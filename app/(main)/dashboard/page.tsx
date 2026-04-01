'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import {
    CheckCircle2, Clock, TrendingUp, CalendarDays, Gift, MoreVertical,
    ChevronDown, Check, Target, AlertCircle, Users
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useRouter } from 'next/navigation';
import { useAttendance } from '../../contexts/AttendanceContext';
import { useTodo, TodoItem } from '../../contexts/TodoContext';
import { useUser } from '../../contexts/UserContext';

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
    category: string;
    deadline: string | null;
    created_at: string;
    assignee?: { full_name: string };
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
                    <span>Tugas Selesai: <strong>{payload[0]?.value || 0} Tugas</strong></span>
                </div>
                <div className={styles.tooltipItem}>
                    <div className={styles.tooltipIndicatorPurple}></div>
                    <span>Jam Kerja: <strong>{payload[1]?.value || 0} Jam</strong></span>
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
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState('');

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
        const now = new Date();
        setCurrentMonth(now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }));
    }, []);

    useEffect(() => {
        if (!user?.id) return;
        const fetchAll = async () => {
            setLoading(true);
            // Fetch tasks for this user
            const tasksRes = await fetch(`/api/tasks?user_id=${user.id}`);
            const tasksData = await tasksRes.json();
            if (Array.isArray(tasksData)) setTasks(tasksData);

            // Fetch attendance for this user
            const attendRes = await fetch(`/api/attendance?user_id=${user.id}`);
            const attendData = await attendRes.json();
            if (Array.isArray(attendData)) setAttendanceLog(attendData);

            // Fetch all profiles to get birthdays this month
            const usersRes = await fetch('/api/admin/users');
            const usersData = await usersRes.json();
            if (Array.isArray(usersData)) {
                const currentMonthNum = new Date().getMonth() + 1;
                const upcoming = usersData.filter((u: any) => {
                    if (!u.dob) return false;
                    const dobMonth = new Date(u.dob).getMonth() + 1;
                    return dobMonth === currentMonthNum;
                }).map((u: any) => ({ id: u.id, full_name: u.full_name || u.name, role: u.role, dob: u.dob }));
                setBirthdays(upcoming);
            }

            setLoading(false);
        };
        fetchAll();
    }, [user]);

    // Build weekly chart from attendance
    const buildChartData = () => {
        const last5Working: { day: string; tugas: number; jam: number }[] = [];
        const sorted = [...attendanceLog].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).reverse();
        sorted.forEach(record => {
            const dayLabel = DAYS_ID[new Date(record.date).getDay()];
            const doneOnDay = tasks.filter(t => t.status === 'Done' && t.created_at?.startsWith(record.date)).length;
            const ms = record.clock_out ? new Date(record.clock_out).getTime() - new Date(record.clock_in).getTime() : 0;
            const hours = Math.round(ms / 3600000);
            last5Working.push({ day: dayLabel, tugas: doneOnDay, jam: hours });
        });
        // Fallback if no attendance
        if (last5Working.length === 0) {
            return [{ day: 'Sen', tugas: 0, jam: 0 }, { day: 'Sel', tugas: 0, jam: 0 }, { day: 'Rab', tugas: 0, jam: 0 }, { day: 'Kam', tugas: 0, jam: 0 }, { day: 'Jum', tugas: 0, jam: 0 }];
        }
        return last5Working;
    };

    const chartData = buildChartData();
    const tasksDone = tasks.filter(t => t.status === 'Done').length;
    const tasksActive = tasks.filter(t => t.status !== 'Done').length;
    const totalAttendDays = attendanceLog.filter(r => r.status === 'Hadir' || r.status === 'Selesai').length;

    // Today's calendar events from tasks
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const calStartPadding = firstDay === 0 ? 6 : firstDay - 1; // Mon-start

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.headerTitle}>
                        Halo, {user?.full_name?.split(' ')[0] || 'User'} 👋
                    </h1>
                    <p className={styles.subtitle}>Ringkasan aktivitas dan metrik tim Anda</p>
                </div>
                <button className={styles.dateDropdownBtn}>
                    <CalendarDays className={styles.iconSm} />
                    <span>{currentMonth}</span>
                    <ChevronDown className={styles.iconSm} style={{ marginLeft: '0.25rem' }} />
                </button>
            </header>

            <main className={styles.mainContent}>
                {/* Attendance Banner */}
                <div className={`${styles.attendanceBanner} ${!clockInTime ? styles.attendanceBannerPending : ''}`} onClick={() => router.push('/kehadiran')}>
                    {clockOutTime ? (
                        <div className={styles.attActive} style={{ backgroundColor: 'rgba(20, 184, 166, 0.05)', borderColor: 'rgba(20, 184, 166, 0.2)' }}>
                            <div className={styles.attInfo}>
                                <div className={styles.iconWrapperTealSolid} style={{ backgroundColor: 'var(--teal)' }}>
                                    <CheckCircle2 className={styles.metricIcon} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span className={styles.attTitleTeal}>{status === 'Pulang Awal' ? 'Pulang Awal' : 'Sudah Absen Pulang'}</span>
                                    <span className={styles.attSubTeal}>{isTomorrowHoliday() ? 'Besok adalah hari libur, selamat beristirahat!' : 'Bersiap absen untuk besok dan jangan sampai terlambat.'}</span>
                                </div>
                            </div>
                            <span className={styles.attAction}>Lihat Riwayat &rarr;</span>
                        </div>
                    ) : clockInTime ? (
                        <div className={styles.attActive}>
                            <div className={styles.attInfo}>
                                <div className={styles.iconWrapperTealSolid}>
                                    <Clock className={styles.metricIcon} />
                                </div>
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
                                <div className={styles.iconWrapperRedSolid}>
                                    <AlertCircle className={styles.metricIcon} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span className={styles.attTitleRed}>Anda Belum Absen Masuk!</span>
                                    <span className={styles.attSubRed}>Segera catat kehadiran Anda hari ini.</span>
                                </div>
                            </div>
                            <span className={styles.attAction}>Buka Kehadiran &rarr;</span>
                        </div>
                    )}
                </div>

                {/* Real Metrics */}
                <div className={styles.metricsGrid}>
                    <div className={styles.metricCard}>
                        <div className={styles.metricHeader}>
                            <h3 className={styles.metricTitle}>Tugas Diselesaikan</h3>
                            <div className={styles.iconWrapperPurple}><CheckCircle2 className={styles.metricIcon} /></div>
                        </div>
                        <p className={styles.metricValue}>{tasksDone}</p>
                        <p className={styles.metricChangePositive}>total tugas selesai</p>
                    </div>
                    <div className={styles.metricCard}>
                        <div className={styles.metricHeader}>
                            <h3 className={styles.metricTitle}>Tugas Aktif</h3>
                            <div className={styles.iconWrapperTeal}><Clock className={styles.metricIcon} /></div>
                        </div>
                        <p className={styles.metricValue}>{tasksActive}</p>
                        <p className={styles.metricChangeNeutral}>sedang berjalan</p>
                    </div>
                    <div className={styles.metricCard}>
                        <div className={styles.metricHeader}>
                            <h3 className={styles.metricTitle}>Hari Hadir</h3>
                            <div className={styles.iconWrapperBlue}><TrendingUp className={styles.metricIcon} /></div>
                        </div>
                        <p className={styles.metricValue}>{totalAttendDays}</p>
                        <p className={styles.metricChangePositive}>hari bulan ini</p>
                    </div>
                </div>

                <div className={styles.bentoGrid}>
                    <div className={styles.gridLeft}>
                        {/* Chart from real attendance */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.cardTitle}>Statistik Rekam Jejak</h3>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>5 Hari Terakhir</span>
                            </div>
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

                        {/* To-Do List from Supabase */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.cardTitle}>To-Do List Harian</h3>
                                <button className={styles.btnText} onClick={() => router.push('/task')}>Kelola di Task</button>
                            </div>
                            <div className={styles.tableContainer}>
                                <table className={styles.shadcnTable}>
                                    <thead>
                                        <tr>
                                            <th className={styles.thCheck}></th>
                                            <th className={styles.thTask}>Task</th>
                                            <th className={styles.thStatus}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {todos.length === 0 ? (
                                            <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.875rem' }}>Belum ada to-do. Tambahkan di halaman Task.</td></tr>
                                        ) : (
                                            todos.map((todo: TodoItem) => (
                                                <tr key={todo.id} className={styles.trBody} onClick={() => toggleTodo(todo.id)}>
                                                    <td className={styles.tdCheck}>
                                                        <div className={`${styles.shadcnCheckbox} ${todo.completed ? styles.shadcnCheckboxChecked : ''}`}>
                                                            {todo.completed && <Check className={styles.checkIconSm} />}
                                                        </div>
                                                    </td>
                                                    <td className={`${styles.tdTask} ${todo.completed ? styles.todoTextStrike : ''}`}>{todo.text}</td>
                                                    <td className={styles.tdStatus}>
                                                        {todo.completed ? <span className={styles.badgeDone}>Done</span>
                                                            : todo.urgent ? <span className={styles.badgeUrgent}>Urgent</span>
                                                                : <span className={styles.badgePending}>Pending</span>}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className={styles.gridRight}>
                        {/* Leaderboard - Coming Soon */}
                        <div className={styles.card} style={{ position: 'relative', overflow: 'hidden' }}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.cardTitle}>Top Performers</h3>
                                <div className={styles.iconWrapperTealSm}><Users className={styles.iconSm} /></div>
                            </div>
                            <div style={{ filter: 'blur(5px)', opacity: 0.4, pointerEvents: 'none' }}>
                                {[1, 2, 3].map(i => <div key={i} className={styles.leaderboardItem}><div className={i === 1 ? styles.avatarRank1 : styles.avatarRank}>{i}</div><div className={styles.leadInfo}><p className={styles.leadName}>User #{i}</p><p className={styles.leadPoints}>--,--- Pts</p></div></div>)}
                            </div>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', zIndex: 10, backdropFilter: 'blur(1px)' }}>
                                <div style={{ backgroundColor: 'var(--teal)', color: 'var(--background)', padding: '0.4rem 1rem', borderRadius: '9999px', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Coming Soon</div>
                                <p style={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>Fitur Leaderboard</p>
                            </div>
                        </div>

                        {/* Challenge - Coming Soon */}
                        <div className={styles.card} style={{ position: 'relative', overflow: 'hidden' }}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.cardTitle}>Tantangan Tersedia</h3>
                                <Target className={styles.iconTeal} />
                            </div>
                            <div style={{ filter: 'blur(5px)', opacity: 0.4, pointerEvents: 'none' }}>
                                {['Challenge A', 'Challenge B'].map(c => <div key={c} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}><span style={{ fontWeight: 600 }}>{c}</span><span style={{ color: 'var(--teal)' }}>+500 Pts</span></div>)}
                            </div>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', zIndex: 10, backdropFilter: 'blur(1px)' }}>
                                <div style={{ backgroundColor: 'var(--purple)', color: 'white', padding: '0.4rem 1rem', borderRadius: '9999px', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Coming Soon</div>
                                <p style={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>Fitur Tantangan</p>
                            </div>
                        </div>

                        {/* Birthdays from DB */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.cardTitle}>Ulang Tahun Karyawan</h3>
                                <Gift className={styles.iconTeal} />
                            </div>
                            <div className={styles.birthdayList}>
                                {birthdays.length === 0 ? (
                                    <p style={{ color: '#64748b', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>Tidak ada ulang tahun bulan ini 🎂</p>
                                ) : (
                                    birthdays.map(b => {
                                        const d = new Date(b.dob);
                                        return (
                                            <div key={b.id} className={styles.birthdayItem}>
                                                <div className={styles.birthdayDate}>
                                                    <span className={styles.bDay}>{d.getDate()}</span>
                                                    <span className={styles.bMonth}>{d.toLocaleDateString('id-ID', { month: 'short' })}</span>
                                                </div>
                                                <div className={styles.birthdayInfo}>
                                                    <p className={styles.bName}>{b.full_name}</p>
                                                    <p className={styles.bRole}>{b.role}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Calendar from real tasks */}
                <div className={styles.cardFullWidth}>
                    <div className={styles.cardHeader}>
                        <div>
                            <h3 className={styles.cardTitle}>Agenda Bulan Ini</h3>
                            <p className={styles.subtitleSm}>{currentMonth}</p>
                        </div>
                        <CalendarDays className={styles.iconPurple} />
                    </div>
                    <div className={styles.calendarMonthContainer}>
                        <div className={styles.calGridMonth}>
                            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => <div key={d} className={styles.calHeader}>{d}</div>)}

                            {/* Padding empty days */}
                            {Array.from({ length: calStartPadding }).map((_, i) => (
                                <div key={'pad-' + i} className={styles.calDayMuted}></div>
                            ))}

                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                                const dayTasks = tasks.filter(t => t.deadline && new Date(t.deadline).getDate() === d && new Date(t.deadline).getMonth() === now.getMonth());
                                const isToday = d === now.getDate();
                                return (
                                    <div key={'d-' + d} className={isToday ? styles.calDayToday : styles.calDayMonth}>
                                        <div className={styles.calDateWrapper}>
                                            <span className={styles.calDateNum}>{d}</span>
                                        </div>
                                        <div className={styles.calEventStack}>
                                            {dayTasks.map(t => <span key={t.id} className={t.status === 'Done' ? styles.calBadgeDone : styles.calBadgeTeal}>{t.title}</span>)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
