import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = process.env.LEAVE_STORAGE_BUCKET || 'leave-attachments';

const ATTACHMENT_TYPES = ['izin_proof', 'surat_sakit'] as const;

function extFromName(name: string, mime: string) {
    const m = /\.([a-zA-Z0-9]{1,8})$/.exec(name);
    if (m) return m[1].toLowerCase();
    if (mime.includes('pdf')) return 'pdf';
    if (mime.includes('png')) return 'png';
    if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
    return 'bin';
}

async function signPaths(paths: string[]) {
    const out: Record<string, string> = {};
    for (const p of paths) {
        if (!p) continue;
        const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(p, 3600);
        if (!error && data?.signedUrl) out[p] = data.signedUrl;
    }
    return out;
}

/** GET — daftar pengajuan milik user */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    if (!userId) return NextResponse.json({ error: 'user_id wajib diisi.' }, { status: 400 });

    const { data: rows, error } = await supabaseAdmin
        .from('leave_requests')
        .select('*, leave_request_attachments(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

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

/** POST — multipart: Draft → upload → lampiran → Pending */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const user_id = formData.get('user_id') as string | null;
        const request_type = (formData.get('request_type') as string | null)?.toLowerCase();
        const start_date = formData.get('start_date') as string | null;
        const end_date = formData.get('end_date') as string | null;
        const reason = (formData.get('reason') as string | null)?.trim() || '';

        const izinProof = formData.get('izin_proof');
        const suratSakit = formData.get('surat_sakit');

        if (!user_id || !request_type || !start_date || !end_date) {
            return NextResponse.json({ error: 'user_id, request_type, start_date, dan end_date wajib diisi.' }, { status: 400 });
        }
        if (request_type !== 'izin' && request_type !== 'sakit') {
            return NextResponse.json({ error: 'request_type harus izin atau sakit.' }, { status: 400 });
        }
        if (!reason) {
            return NextResponse.json({ error: 'Alasan wajib diisi.' }, { status: 400 });
        }

        const fileIzin = izinProof instanceof File && izinProof.size > 0 ? izinProof : null;
        const fileSakit = suratSakit instanceof File && suratSakit.size > 0 ? suratSakit : null;

        if (!fileIzin) {
            return NextResponse.json({ error: 'Bukti izin (izin_proof) wajib diunggah.' }, { status: 400 });
        }
        if (request_type === 'sakit' && !fileSakit) {
            return NextResponse.json({ error: 'Untuk sakit, surat dokter wajib diunggah.' }, { status: 400 });
        }

        const { data: draft, error: insertErr } = await supabaseAdmin
            .from('leave_requests')
            .insert([
                {
                    user_id,
                    request_type,
                    start_date,
                    end_date,
                    reason,
                    status: 'Draft',
                },
            ])
            .select()
            .single();

        if (insertErr || !draft) {
            return NextResponse.json({ error: insertErr?.message || 'Gagal membuat draft.' }, { status: 500 });
        }

        const leaveId = draft.id as string;

        const uploads: { type: (typeof ATTACHMENT_TYPES)[number]; path: string }[] = [];

        try {
            const izinExt = extFromName(fileIzin.name, fileIzin.type || 'application/octet-stream');
            const izinPath = `${leaveId}/izin_proof.${izinExt}`;
            const bufIzin = Buffer.from(await fileIzin.arrayBuffer());
            const { error: upIzin } = await supabaseAdmin.storage.from(BUCKET).upload(izinPath, bufIzin, {
                contentType: fileIzin.type || 'application/octet-stream',
                upsert: true,
            });
            if (upIzin) throw new Error(upIzin.message);
            uploads.push({ type: 'izin_proof', path: izinPath });

            if (request_type === 'sakit' && fileSakit) {
                const sExt = extFromName(fileSakit.name, fileSakit.type || 'application/octet-stream');
                const sPath = `${leaveId}/surat_sakit.${sExt}`;
                const bufS = Buffer.from(await fileSakit.arrayBuffer());
                const { error: upS } = await supabaseAdmin.storage.from(BUCKET).upload(sPath, bufS, {
                    contentType: fileSakit.type || 'application/octet-stream',
                    upsert: true,
                });
                if (upS) throw new Error(upS.message);
                uploads.push({ type: 'surat_sakit', path: sPath });
            }

            const attRows = uploads.map(u => ({
                leave_request_id: leaveId,
                attachment_type: u.type,
                storage_path: u.path,
            }));

            const { error: attErr } = await supabaseAdmin.from('leave_request_attachments').insert(attRows);
            if (attErr) throw new Error(attErr.message);

            const { data: pending, error: pendErr } = await supabaseAdmin
                .from('leave_requests')
                .update({ status: 'Pending' })
                .eq('id', leaveId)
                .select()
                .single();

            if (pendErr) throw new Error(pendErr.message);

            return NextResponse.json(pending, { status: 201 });
        } catch (inner: unknown) {
            await supabaseAdmin.storage.from(BUCKET).remove(uploads.map(u => u.path));
            await supabaseAdmin.from('leave_requests').delete().eq('id', leaveId);
            const msg = inner instanceof Error ? inner.message : 'Gagal mengunggah atau menyelesaikan pengajuan.';
            return NextResponse.json({ error: msg }, { status: 500 });
        }
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
