import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

type AgendaItem = {
    id: string;
    date: string;
    title: string;
    kind: 'task' | 'birthday' | 'holiday' | 'event' | 'leave';
    status?: string | null;
    user_name?: string | null;
};

function monthRange(year: number, month1to12: number) {
    const start = new Date(Date.UTC(year, month1to12 - 1, 1));
    const end = new Date(Date.UTC(year, month1to12, 0));
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const now = new Date();
        const year = Number(searchParams.get('year') || now.getFullYear());
        const month = Number(searchParams.get('month') || now.getMonth() + 1);
        const userId = searchParams.get('user_id');
        const { start, end } = monthRange(year, month);

        const items: AgendaItem[] = [];

        const tasksBase = supabaseAdmin
            .from('tasks')
            .select('id,title,status,deadline,assignee:profiles!tasks_assignee_id_fkey(full_name)')
            .gte('deadline', start)
            .lte('deadline', end)
            .order('deadline', { ascending: true })
            .limit(1000);

        const tasksFiltered = userId
            ? supabaseAdmin
                  .from('tasks')
                  .select('id,title,status,deadline,assignee:profiles!tasks_assignee_id_fkey(full_name)')
                  .or(`assignee_id.eq.${userId},assignor_id.eq.${userId}`)
                  .gte('deadline', start)
                  .lte('deadline', end)
                  .order('deadline', { ascending: true })
                  .limit(1000)
            : tasksBase;

        const { data: tasks } = await tasksFiltered;
        for (const t of tasks || []) {
            if (!t.deadline) continue;
            const raw = t.assignee as { full_name?: string } | { full_name?: string }[] | null;
            const assignee = Array.isArray(raw) ? raw[0] : raw;
            items.push({
                id: `task-${t.id}`,
                date: t.deadline,
                title: t.title,
                kind: 'task',
                status: t.status ?? null,
                user_name: assignee?.full_name ?? null,
            });
        }

        const { data: profiles } = await supabaseAdmin.from('profiles').select('id,full_name,dob').not('dob', 'is', null).limit(2000);
        for (const p of profiles || []) {
            if (!p.dob) continue;
            const d = new Date(p.dob);
            if (d.getMonth() + 1 !== month) continue;
            const day = d.getDate().toString().padStart(2, '0');
            const date = `${year}-${String(month).padStart(2, '0')}-${day}`;
            items.push({
                id: `birthday-${p.id}-${date}`,
                date,
                title: `Ulang tahun ${p.full_name || 'Karyawan'}`,
                kind: 'birthday',
                user_name: p.full_name || null,
            });
        }

        const { data: events } = await supabaseAdmin
            .from('agenda_events')
            .select('id,title,event_date,event_type,description')
            .gte('event_date', start)
            .lte('event_date', end)
            .order('event_date', { ascending: true })
            .limit(2000);

        for (const e of events || []) {
            const kind = e.event_type === 'holiday' ? 'holiday' : 'event';
            items.push({
                id: `event-${e.id}`,
                date: e.event_date,
                title: e.title,
                kind,
            });
        }

        const { data: leaves } = await supabaseAdmin
            .from('leave_requests')
            .select('id,request_type,start_date,end_date,status,profiles(full_name),user_id')
            .lte('start_date', end)
            .gte('end_date', start)
            .in('status', ['Pending', 'Approved'])
            .limit(1500);

        for (const l of leaves || []) {
            if (userId && l.user_id !== userId) continue;
            const from = new Date(l.start_date);
            const to = new Date(l.end_date);
            for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
                const ymd = d.toISOString().slice(0, 10);
                if (ymd < start || ymd > end) continue;
                const rawP = l.profiles as { full_name?: string } | { full_name?: string }[] | null;
                const p = Array.isArray(rawP) ? rawP[0] : rawP;
                items.push({
                    id: `leave-${l.id}-${ymd}`,
                    date: ymd,
                    title: `${l.request_type === 'sakit' ? 'Sakit' : 'Izin'} ${p?.full_name || ''}`.trim(),
                    kind: 'leave',
                    status: l.status,
                    user_name: p?.full_name || null,
                });
            }
        }

        items.sort((a, b) => a.date.localeCompare(b.date));
        return NextResponse.json({ year, month, start, end, items });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
