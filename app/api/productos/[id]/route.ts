import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase-server';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: productId } = await params;
        if (!productId) {
            return NextResponse.json({ error: 'ID de producto requerido' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (!roleData || !['admin', 'supervisor'].includes(roleData.role)) {
            return NextResponse.json({ error: 'Sin permisos para eliminar productos' }, { status: 403 });
        }

        const adminClient = createAdminClient();
        
        // Obtener la url base de public/storage para parsear
        const { data: images } = await adminClient.from('productos_imagenes').select('url').eq('producto_id', productId);
        
        if (images && images.length > 0) {
            const filesToRemove = images
                .filter(img => img.url.includes('productos_imagenes/productos/'))
                .map(img => {
                    const urlParts = img.url.split('productos_imagenes/productos/');
                    return urlParts.length > 1 ? `productos/${urlParts[1]}` : null;
                })
                .filter(Boolean) as string[];

            if (filesToRemove.length > 0) {
                await adminClient.storage.from('productos_imagenes').remove(filesToRemove);
            }
        }
        
        // Imagen principal
        const { data: mainProduct } = await adminClient.from('productos').select('imagen_url').eq('id', productId).single();
        if (mainProduct && mainProduct.imagen_url && mainProduct.imagen_url.includes('productos_imagenes/productos/')) {
             const parts = mainProduct.imagen_url.split('productos_imagenes/productos/');
             if (parts.length > 1) {
                 await adminClient.storage.from('productos_imagenes').remove([`productos/${parts[1]}`]);
             }
        }

        const { error } = await adminClient
            .from('productos')
            .delete()
            .eq('id', productId);

        if (error) {
            console.error('Error DB:', error);
            throw error;
        }

        return NextResponse.json({ success: true, message: 'Producto eliminado' });

    } catch (error: any) {
        console.error('Error al eliminar producto:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}
