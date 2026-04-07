import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** GET — semua catatan kehadiran (admin); filter opsional: user_id, date, from, to */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const date = searchParams.get('date');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limit = Math.min(Number(searchParams.get('limit') || '500'), 1000);

    let q = supabaseAdmin
        .from('attendance')
        .select('*, profiles(full_name, username, email)')
        .order('date', { ascending: false })
        .order('clock_in', { ascending: false })
        .limit(limit);

    if (userId) q = q.eq('user_id', userId);
    if (date) q = q.eq('date', date);
    if (from) q = q.gte('date', from);
    if (to) q = q.lte('date', to);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
}
