import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// This route uses the Service Role Key to create users on behalf of admin
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, username, role, status, bio, dob, password } = body;

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Nama, email, dan password wajib diisi.' }, { status: 400 });
        }

        // 1. Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email for admin-created users
        });

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        // 2. Save profile details to the profiles table
        const userId = authData.user.id;
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: userId,
                full_name: name,
                email,
                username,
                role: role || 'Employee',
                status: status || 'Active',
                bio: bio || '',
                dob: dob || null,
            });

        if (profileError) {
            // Clean up auth user if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(userId);
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, userId }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Get all users for admin panel
export async function GET() {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// PUT - Update an existing user profile
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, full_name, username, role, status, bio, dob } = body;

        if (!id) return NextResponse.json({ error: 'User ID wajib diisi.' }, { status: 400 });

        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ full_name: name || full_name, username, role, status, bio, dob: dob || null })
            .eq('id', id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
