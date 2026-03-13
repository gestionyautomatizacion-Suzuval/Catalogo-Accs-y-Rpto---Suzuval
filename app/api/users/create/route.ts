import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
    try {
        // 1. Verificar que el solicitante está autenticado y tiene permisos
        const supabase = await createClient();
        const { data: { user: requestingUser } } = await supabase.auth.getUser();

        if (!requestingUser) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // 2. Obtener el rol del usuario que hace la solicitud
        const { data: requestingRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', requestingUser.id)
            .single();

        if (!requestingRole || !['admin', 'supervisor'].includes(requestingRole.role)) {
            return NextResponse.json({ error: 'Sin permisos para crear usuarios' }, { status: 403 });
        }

        // 3. Obtener datos del nuevo usuario
        const { email, password, nombre, role } = await request.json();

        if (!email || !password || !nombre) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
        }

        // 4. Validar que el supervisor no pueda crear supervisors ni admins
        if (requestingRole.role === 'supervisor' && role !== 'user') {
            return NextResponse.json(
                { error: 'Los supervisores solo pueden crear usuarios regulares' },
                { status: 403 }
            );
        }

        // 5. Validar rol permitido
        const allowedRoles = requestingRole.role === 'admin'
            ? ['supervisor', 'user']
            : ['user'];

        if (!allowedRoles.includes(role)) {
            return NextResponse.json({ error: 'Rol no válido' }, { status: 400 });
        }

        // 6. Crear usuario con service_role (bypassa confirmación de email)
        const adminClient = createAdminClient();
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // confirmado automáticamente
            user_metadata: { nombre },
        });

        if (createError) {
            if (createError.message.includes('already registered')) {
                return NextResponse.json({ error: 'Este email ya está registrado' }, { status: 409 });
            }
            throw createError;
        }

        // 7. Asignar rol en la tabla user_roles
        const { error: roleError } = await adminClient
            .from('user_roles')
            .insert({ user_id: newUser.user!.id, role });

        if (roleError) throw roleError;

        return NextResponse.json({
            success: true,
            message: `Usuario ${email} creado correctamente como ${role}`,
        });

    } catch (error: any) {
        console.error('Error al crear usuario:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
