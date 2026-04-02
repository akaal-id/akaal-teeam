import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { user_id, task_id } = body as { user_id?: string; task_id?: string };

        if (!user_id || !task_id) {
            return NextResponse.json({ error: 'user_id dan task_id wajib diisi.' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('user_id', user_id)
            .eq('task_id', task_id)
            .is('read_at', null);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

