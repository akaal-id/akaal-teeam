import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM

    let q = supabaseAdmin
        .from('agenda_events')
        .select('*')
        .order('event_date', { ascending: true })
        .limit(1000);

    if (month) {
        const [y, m] = month.split('-').map(Number);
        if (y && m) {
            const from = `${y}-${String(m).padStart(2, '0')}-01`;
            const to = new Date(y, m, 0).toISOString().slice(0, 10);
            q = q.gte('event_date', from).lte('event_date', to);
        }
    }

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, event_date, event_type, description, created_by } = body as {
            title?: string;
            event_date?: string;
            event_type?: string;
            description?: string;
            created_by?: string;
        };

        if (!title?.trim() || !event_date) {
            return NextResponse.json({ error: 'title dan event_date wajib diisi.' }, { status: 400 });
        }

        const safeType = ['holiday', 'event', 'company', 'announcement'].includes(event_type || '') ? event_type : 'event';

        const { data, error } = await supabaseAdmin
            .from('agenda_events')
            .insert([
                {
                    title: title.trim(),
                    event_date,
                    event_type: safeType,
                    description: description?.trim() || null,
                    created_by: created_by || null,
                },
            ])
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, title, event_date, event_type, description } = body as {
            id?: string;
            title?: string;
            event_date?: string;
            event_type?: string;
            description?: string;
        };

        if (!id) return NextResponse.json({ error: 'id wajib diisi.' }, { status: 400 });

        const updates: Record<string, string | null> = {};
        if (typeof title === 'string') updates.title = title.trim();
        if (typeof event_date === 'string') updates.event_date = event_date;
        if (typeof event_type === 'string' && ['holiday', 'event', 'company', 'announcement'].includes(event_type)) {
            updates.event_type = event_type;
        }
        if (typeof description === 'string') updates.description = description.trim() || null;

        const { data, error } = await supabaseAdmin.from('agenda_events').update(updates).eq('id', id).select().single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id wajib diisi.' }, { status: 400 });

    const { error } = await supabaseAdmin.from('agenda_events').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
