import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const limit = Number(searchParams.get('limit') || '20');

    if (!userId) return NextResponse.json({ error: 'user_id wajib diisi.' }, { status: 400 });

    const safeLimit = Math.min(Math.max(limit, 1), 50);

    // Unread items for dropdown
    const { data: items, error } = await supabaseAdmin
        .from('notifications')
        .select('id,type,task_id,message_id,leave_request_id,title,status,created_at,read_at')
        .eq('user_id', userId)
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(safeLimit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Accurate unread count
    const { count, error: countError } = await supabaseAdmin
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null);

    if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

    return NextResponse.json({
        unreadCount: count || 0,
        items: items || [],
    });
}

