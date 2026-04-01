'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

type AttendanceStatus = 'Belum Absen' | 'Hadir' | 'Terlambat' | 'Pulang Awal' | 'Selesai';

interface AttendanceState {
    clockInTime: Date | null;
    clockOutTime: Date | null;
    status: AttendanceStatus;
    durationSeconds: number;
    clockIn: () => void;
    clockOut: () => void;
}

const AttendanceContext = createContext<AttendanceState | undefined>(undefined);

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
    const [clockInTime, setClockInTime] = useState<Date | null>(null);
    const [clockOutTime, setClockOutTime] = useState<Date | null>(null);
    const [status, setStatus] = useState<AttendanceStatus>('Belum Absen');
    const [durationSeconds, setDurationSeconds] = useState(0);

    // Check if user already clocked in today (on mount)
    useEffect(() => {
        const checkTodayAttendance = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const today = new Date().toISOString().split('T')[0];
            const res = await fetch(`/api/attendance?user_id=${user.id}`);
            const records = await res.json();

            if (Array.isArray(records)) {
                const todayRecord = records.find((r: any) => r.date === today);
                if (todayRecord) {
                    setClockInTime(new Date(todayRecord.clock_in));
                    if (todayRecord.clock_out) {
                        setClockOutTime(new Date(todayRecord.clock_out));
                        setStatus(todayRecord.status as AttendanceStatus);
                    } else {
                        setStatus(todayRecord.status as AttendanceStatus);
                    }
                }
            }
        };
        checkTodayAttendance();
    }, []);

    // Real-time duration counter
    useEffect(() => {
        const interval = setInterval(() => {
            if (clockInTime && !clockOutTime) {
                setDurationSeconds(Math.floor((new Date().getTime() - clockInTime.getTime()) / 1000));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [clockInTime, clockOutTime]);

    const clockIn = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { alert('Anda harus login terlebih dahulu.'); return; }

        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();

        if (hours >= 16) { alert('Batas waktu absen masuk (16:00) sudah terlewat.'); return; }

        const timeVal = hours + minutes / 60;
        const newStatus: AttendanceStatus = timeVal <= 9.25 ? 'Hadir' : 'Terlambat';
        const today = now.toISOString().split('T')[0];

        const res = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, clock_in: now.toISOString(), status: newStatus, date: today })
        });

        if (res.status === 409) { alert('Anda sudah absen masuk hari ini.'); return; }
        if (!res.ok) { alert('Gagal menyimpan absensi. Coba lagi.'); return; }

        setClockInTime(now);
        setDurationSeconds(0);
        setStatus(newStatus);
    };

    const clockOut = async () => {
        if (!clockInTime) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const now = new Date();
        const hours = now.getHours();
        const newStatus: AttendanceStatus = hours < 17 ? 'Pulang Awal' : 'Selesai';
        const today = now.toISOString().split('T')[0];

        await fetch('/api/attendance', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, clock_out: now.toISOString(), status: newStatus, date: today })
        });

        setClockOutTime(now);
        setStatus(newStatus);
    };

    return (
        <AttendanceContext.Provider value={{ clockInTime, clockOutTime, status, durationSeconds, clockIn, clockOut }}>
            {children}
        </AttendanceContext.Provider>
    );
}

export function useAttendance() {
    const context = useContext(AttendanceContext);
    if (context === undefined) throw new Error('useAttendance must be used within an AttendanceProvider');
    return context;
}
