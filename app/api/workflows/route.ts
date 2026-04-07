import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');
        const month = searchParams.get('month');

        let q = supabaseAdmin
            .from('daily_workflows')
            .select('*, profiles(full_name, username, email)')
            .order('work_date', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(500);

        if (userId) q = q.eq('user_id', userId);
        if (month) {
            const [y, m] = month.split('-').map(Number);
            if (y && m) {
                const from = `${y}-${String(m).padStart(2, '0')}-01`;
                const to = new Date(y, m, 0).toISOString().slice(0, 10);
                q = q.gte('work_date', from).lte('work_date', to);
            }
        }

        const { data, error } = await q;
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data || []);
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { user_id, work_date, summary, details } = body as {
            user_id?: string;
            work_date?: string;
            summary?: string;
            details?: string;
        };

        if (!user_id || !summary?.trim()) {
            return NextResponse.json({ error: 'user_id dan summary wajib diisi.' }, { status: 400 });
        }

        const date = work_date || new Date().toISOString().slice(0, 10);

        const { data: existing } = await supabaseAdmin
            .from('daily_workflows')
            .select('id')
            .eq('user_id', user_id)
            .eq('work_date', date)
            .maybeSingle();

        if (existing?.id) {
            const { data, error } = await supabaseAdmin
                .from('daily_workflows')
                .update({ summary: summary.trim(), details: details?.trim() || null })
                .eq('id', existing.id)
                .select()
                .single();
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json(data);
        }

        const { data, error } = await supabaseAdmin
            .from('daily_workflows')
            .insert([{ user_id, work_date: date, summary: summary.trim(), details: details?.trim() || null }])
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
