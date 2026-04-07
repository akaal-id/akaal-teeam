import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TASK_SELECT = `*, assignee:profiles!tasks_assignee_id_fkey(id, full_name, username, email), assignor:profiles!tasks_assignor_id_fkey(id, full_name)`;

// GET — semua task | filter user_id | atau satu task by id (untuk admin / deep link)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('user_id');

    if (id) {
        const { data, error } = await supabaseAdmin.from('tasks').select(TASK_SELECT).eq('id', id).maybeSingle();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        if (!data) return NextResponse.json({ error: 'Task tidak ditemukan.' }, { status: 404 });
        return NextResponse.json(data);
    }

    let query = supabaseAdmin.from('tasks').select(TASK_SELECT).order('created_at', { ascending: false });

    if (userId) {
        query = supabaseAdmin
            .from('tasks')
            .select(TASK_SELECT)
            .or(`assignee_id.eq.${userId},assignor_id.eq.${userId}`)
            .order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// POST - Create a new task
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, description, category, priority, status, assignee_id, assignor_id, deadline, submitted_link, review_notes } = body;

        if (!title || !assignee_id) {
            return NextResponse.json({ error: 'Judul dan penerima tugas wajib diisi.' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('tasks')
            .insert([{ title, description, category: category || 'Main Task', priority: priority || 'Medium', status: status || 'Pending', assignee_id, assignor_id, deadline: deadline || null, submitted_link, review_notes }])
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT - Update a task
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ error: 'Task ID wajib diisi.' }, { status: 400 });

        const { data, error } = await supabaseAdmin
            .from('tasks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE a task
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID wajib diisi.' }, { status: 400 });

    const { error } = await supabaseAdmin.from('tasks').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
