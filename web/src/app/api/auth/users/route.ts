import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Admin Client
// This requires SUPABASE_SERVICE_ROLE_KEY to be set in .env.local
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, role = 'user' } = body;

        console.log('Attempting to create user:', email);

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json(
                { error: 'Server configuration error: Service Role Key missing' },
                { status: 500 }
            );
        }

        // Create User in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true // Auto confirm
        });

        if (authError) throw authError;

        // Optionally add to a public 'users' table if you have one for app-specific data
        // For now, we just return success

        return NextResponse.json({
            success: true,
            user: authData.user,
            message: 'User created successfully'
        });

    } catch (error: any) {
        console.error('Create User Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create user' },
            { status: 400 }
        );
    }
}

export async function GET(request: Request) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ error: 'Service Role Key missing' }, { status: 500 });
    }

    try {
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

        if (error) throw error;

        return NextResponse.json({ users });
    } catch (error: any) {
        console.error('List Users Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
