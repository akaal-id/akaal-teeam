import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Tanggal lokal Asia/Jakarta YYYY-MM-DD (selaras dengan pola `date` di attendance klien) */
function todayJakartaYmd(): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;
    if (!y || !m || !d) return new Date().toISOString().slice(0, 10);
    return `${y}-${m}-${d}`;
}

type DashboardActivity = {
    id: string;
    kind: 'attendance' | 'task';
    title: string;
    subtitle: string;
    at: string;
};

export async function GET() {
    try {
        const today = todayJakartaYmd();

        let active = 0;
        const activeRes = await supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'Active');
        if (!activeRes.error && activeRes.count != null) {
            active = activeRes.count;
        } else {
            const allRes = await supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true });
            active = allRes.count ?? 0;
        }

        const [{ count: pendingTasksCount, error: e2 }, { data: todayAttendance, error: e3 }] = await Promise.all([
            supabaseAdmin.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
            supabaseAdmin.from('attendance').select('user_id').eq('date', today),
        ]);

        if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
        if (e3) return NextResponse.json({ error: e3.message }, { status: 500 });

        const attendanceTodayCount = (todayAttendance || []).length;

        const [{ data: recentAtt, error: e4 }, { data: recentTasks, error: e5 }] = await Promise.all([
            supabaseAdmin
                .from('attendance')
                .select('id, date, clock_in, clock_out, status, user_id, profiles(full_name, username)')
                .order('date', { ascending: false })
                .order('clock_in', { ascending: false })
                .limit(12),
            supabaseAdmin
                .from('tasks')
                .select(
                    'id, title, status, created_at, assignee:profiles!tasks_assignee_id_fkey(full_name), assignor:profiles!tasks_assignor_id_fkey(full_name)'
                )
                .order('created_at', { ascending: false })
                .limit(12),
        ]);

        if (e4) return NextResponse.json({ error: e4.message }, { status: 500 });
        if (e5) return NextResponse.json({ error: e5.message }, { status: 500 });

        const activities: DashboardActivity[] = [];

        for (const row of recentAtt || []) {
            const raw = row.profiles as { full_name?: string; username?: string } | { full_name?: string; username?: string }[] | null;
            const p = Array.isArray(raw) ? raw[0] : raw;
            const name = p?.full_name || p?.username || 'Karyawan';
            const at = (row.clock_in as string) || row.date;
            activities.push({
                id: `a-${row.id}`,
                kind: 'attendance',
                title: name,
                subtitle: row.clock_out ? `Kehadiran · ${row.status} (pulang)` : `Absen masuk · ${row.status}`,
                at,
            });
        }

        for (const t of recentTasks || []) {
            const assignee = (t.assignee as { full_name?: string } | null)?.full_name;
            const assignor = (t.assignor as { full_name?: string } | null)?.full_name;
            activities.push({
                id: `t-${t.id}`,
                kind: 'task',
                title: (t.title as string) || 'Task',
                subtitle: assignee ? `Untuk ${assignee}` : assignor ? `Oleh ${assignor}` : `Status ${t.status}`,
                at: (t.created_at as string) || new Date().toISOString(),
            });
        }

        activities.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
        const recentActivity = activities.slice(0, 15);

        return NextResponse.json({
            todayDate: today,
            activeEmployeesCount: active,
            pendingTasksCount: pendingTasksCount ?? 0,
            attendanceTodayCount,
            attendanceTodayLabel: `${attendanceTodayCount}/${Math.max(active, 1)}`,
            recentActivity,
        });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
