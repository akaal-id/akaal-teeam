import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET attendance records for a user
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    let query = supabaseAdmin
        .from('attendance')
        .select(`*, user:profiles(full_name, username)`)
        .order('date', { ascending: false })
        .limit(60);

    if (userId) {
        query = supabaseAdmin
            .from('attendance')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(60);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// POST - Clock In
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { user_id, clock_in, status, date } = body;

        if (!user_id || !clock_in) {
            return NextResponse.json({ error: 'user_id dan clock_in wajib diisi.' }, { status: 400 });
        }

        // Check if already clocked in today
        const { data: existing } = await supabaseAdmin
            .from('attendance')
            .select('id')
            .eq('user_id', user_id)
            .eq('date', date)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Sudah absen masuk hari ini.' }, { status: 409 });
        }

        const { data, error } = await supabaseAdmin
            .from('attendance')
            .insert([{ user_id, clock_in, status, date }])
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT - Clock Out (update record)
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { user_id, clock_out, status, date } = body;

        const { data, error } = await supabaseAdmin
            .from('attendance')
            .update({ clock_out, status })
            .eq('user_id', user_id)
            .eq('date', date)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
