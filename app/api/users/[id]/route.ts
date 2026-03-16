import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase-server';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userId = params.id;
        if (!userId) {
            return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user: requestingUser } } = await supabase.auth.getUser();

        if (!requestingUser) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { data: requestingRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', requestingUser.id)
            .single();

        if (!requestingRole || !['admin', 'supervisor'].includes(requestingRole.role)) {
            return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
        }

        // Obtener rol actual del usuario a modificar
        const { data: targetRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .single();

        if (!targetRole) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        // Verificación de jerarquía
        if (requestingRole.role === 'supervisor') {
            if (targetRole.role === 'admin') {
                return NextResponse.json({ error: 'No puedes modificar a un Administrador' }, { status: 403 });
            }
        }

        const { nombre, role, estado } = await request.json();

        // Si supervisor intenta cambiar rol a admin
        if (requestingRole.role === 'supervisor' && role === 'admin') {
            return NextResponse.json({ error: 'No puedes asignar el rol de Administrador' }, { status: 403 });
        }

        const adminClient = createAdminClient();

        // 1. Actualizar metadatos en Auth (nombre)
        if (nombre) {
            const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
                user_metadata: { nombre }
            });
            if (authError) throw authError;
        }

        // 2. Actualizar rol y estado en tabla user_roles
        const updateData: any = {};
        if (role) updateData.role = role;
        if (estado) updateData.estado = estado;

        if (Object.keys(updateData).length > 0) {
            const { error: roleError } = await adminClient
                .from('user_roles')
                .update(updateData)
                .eq('user_id', userId);
            
            if (roleError) throw roleError;
        }

        return NextResponse.json({ success: true, message: 'Usuario actualizado correctamente' });

    } catch (error: any) {
        console.error('Error al actualizar usuario:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userId = params.id;
        if (!userId) {
            return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user: requestingUser } } = await supabase.auth.getUser();

        if (!requestingUser) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { data: requestingRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', requestingUser.id)
            .single();

        if (!requestingRole || requestingRole.role !== 'admin') {
            return NextResponse.json({ error: 'Solo los administradores pueden eliminar usuarios' }, { status: 403 });
        }

        // Evitar auto-eliminación
        if (requestingUser.id === userId) {
            return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // Eliminar de auth (user_roles se borra por CASCADE)
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true, message: 'Usuario eliminado correctamente' });

    } catch (error: any) {
        console.error('Error al eliminar usuario:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}
