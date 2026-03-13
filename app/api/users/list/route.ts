import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase-server';

export async function GET() {
    try {
        // 1. Verificar que el solicitante está autenticado
        const supabase = await createClient();
        const { data: { user: requestingUser } } = await supabase.auth.getUser();

        if (!requestingUser) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // 2. Verificar que tiene rol de admin o supervisor
        const { data: requestingRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', requestingUser.id)
            .single();

        if (!requestingRole || !['admin', 'supervisor'].includes(requestingRole.role)) {
            return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
        }

        // 3. Obtener todos los usuarios con sus roles usando service_role
        const adminClient = createAdminClient();

        // Obtener todos los roles primero
        const { data: roles } = await adminClient
            .from('user_roles')
            .select('user_id, role, created_at')
            .order('created_at', { ascending: false });

        if (!roles) return NextResponse.json({ users: [] });

        // Obtener info de usuarios de auth
        const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers();

        // Combinar datos
        const users = roles.map((r: any) => {
            const authUser = authUsers.find((u: any) => u.id === r.user_id);
            return {
                id: r.user_id,
                email: authUser?.email || '—',
                nombre: authUser?.user_metadata?.nombre || '',
                role: r.role,
                created_at: r.created_at,
            };
        }).filter((u: any) => u.email !== '—');

        return NextResponse.json({ users });

    } catch (error: any) {
        console.error('Error listando usuarios:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
