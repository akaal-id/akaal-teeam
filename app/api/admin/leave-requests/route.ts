import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = process.env.LEAVE_STORAGE_BUCKET || 'leave-attachments';

async function signPaths(paths: string[]) {
    const out: Record<string, string> = {};
    for (const p of paths) {
        if (!p) continue;
        const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(p, 3600);
        if (!error && data?.signedUrl) out[p] = data.signedUrl;
    }
    return out;
}

/** GET — semua pengajuan (opsional filter status) */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let q = supabaseAdmin
        .from('leave_requests')
        .select('*, profiles(full_name, username, email), leave_request_attachments(*)')
        .order('created_at', { ascending: false })
        .limit(200);

    if (status) q = q.eq('status', status);

    const { data: rows, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const list = rows || [];
    const allPaths: string[] = [];
    for (const r of list) {
        const atts = (r as { leave_request_attachments?: { storage_path?: string }[] }).leave_request_attachments;
        if (Array.isArray(atts)) {
            for (const a of atts) {
                if (a?.storage_path) allPaths.push(a.storage_path);
            }
        }
    }
    const urlMap = await signPaths(allPaths);

    const enriched = list.map(r => {
        const atts = (r as { leave_request_attachments?: { storage_path?: string; attachment_type?: string }[] }).leave_request_attachments;
        const attachments = Array.isArray(atts)
            ? atts.map(a => ({
                  ...a,
                  signed_url: a.storage_path ? urlMap[a.storage_path] ?? null : null,
              }))
            : [];
        return { ...r, leave_request_attachments: attachments };
    });

    return NextResponse.json(enriched);
}

/** PATCH — setujui / tolak */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, status } = body as { id?: string; status?: string };

        if (!id || !status) {
            return NextResponse.json({ error: 'id dan status wajib diisi.' }, { status: 400 });
        }
        if (status !== 'Approved' && status !== 'Rejected') {
            return NextResponse.json({ error: 'status harus Approved atau Rejected.' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('leave_requests')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
