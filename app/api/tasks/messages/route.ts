import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');

    if (!taskId) return NextResponse.json({ error: 'Task ID wajib diisi.' }, { status: 400 });

    const { data, error } = await supabaseAdmin
        .from('task_messages')
        .select(`*, sender:profiles(id, full_name, avatar_url)`)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { task_id, sender_id, message } = body;

        if (!task_id || !sender_id || !message) {
            return NextResponse.json({ error: 'Data tidak lengkap.' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('task_messages')
            .insert([{ task_id, sender_id, message }])
            .select(`*, sender:profiles(id, full_name, avatar_url)`)
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
