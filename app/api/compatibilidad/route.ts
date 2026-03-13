import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const chasis = searchParams.get('chasis');
    const nroInterno = searchParams.get('nroInterno');

    if (!chasis && !nroInterno) {
        return NextResponse.json({ error: 'Debe ingresar un Chasis o Número Interno' }, { status: 400 });
    }

    try {
        // 1. Buscar el vehículo del cliente para obtener su modelo_id
        let query = supabase.from('vehiculos_clientes').select('modelo_id');

        if (chasis) {
            query = query.eq('nro_chasis_vin', chasis.toUpperCase());
        } else if (nroInterno) {
            query = query.eq('nro_interno_7_digitos', nroInterno);
        }

        const { data: vehiculo, error: vehiculoError } = await query.single();

        if (vehiculoError || !vehiculo) {
            return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
        }

        const modeloId = vehiculo.modelo_id;

        // 2. Buscar productos compatibles con este modelo a través de la tabla de intersección
        const { data: productos, error: productosError } = await supabase
            .from('productos')
            .select(`
        *,
        categorias_items (nombre),
        compatibilidad!inner(modelo_id)
      `)
            .eq('compatibilidad.modelo_id', modeloId)
            .gt('stock', 0); // Opcional: solo mostrar con stock

        if (productosError) {
            console.error('Error fetching products:', productosError);
            return NextResponse.json({ error: 'Error al buscar productos recomendados' }, { status: 500 });
        }

        // Mapear respuesta para aplanar la estructura de la categoría si se desea
        const productosFormateados = productos.map((p: any) => ({
            ...p,
            categoria_nombre: p.categorias_items?.nombre,
            categorias_items: undefined, // remover objeto anidado
            compatibilidad: undefined // remover el join table data de la respuesta
        }));

        return NextResponse.json({
            vehiculoEncontrado: true,
            modeloId: modeloId,
            productos: productosFormateados
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
