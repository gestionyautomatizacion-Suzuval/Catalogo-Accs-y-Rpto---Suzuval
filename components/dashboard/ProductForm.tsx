"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Categoria { id: string; nombre: string; }
interface Modelo { id: string; nombre_especifico: string; familia_id: string; }
interface Familia { id: string; nombre: string; marca_id: string; }
interface Marca { id: string; nombre: string; }

interface ProductImage {
    url: string;
    file: File | null;
}

export default function ProductForm({ productId }: { productId?: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Form State
    const [sku, setSku] = useState('');
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [precio, setPrecio] = useState('');
    const [precioOferta, setPrecioOferta] = useState('');
    const [stock, setStock] = useState('0');
    const [categoriasIds, setCategoriasIds] = useState<string[]>([]);
    const [esMultimarca, setEsMultimarca] = useState(false);
    
    // Multi-image State (Up to 5)
    const [productImages, setProductImages] = useState<ProductImage[]>(
        Array(5).fill(null).map(() => ({ url: '', file: null }))
    );

    // Reference Data State
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [marcas, setMarcas] = useState<Marca[]>([]);
    const [familias, setFamilias] = useState<Familia[]>([]);
    const [modelos, setModelos] = useState<Modelo[]>([]);

    // Selection State
    const [selectedMarca, setSelectedMarca] = useState('');
    const [selectedFamilia, setSelectedFamilia] = useState('');
    const [compatibleModels, setCompatibleModels] = useState<string[]>([]);

    // Inline Creation State
    const [isCreatingFamilia, setIsCreatingFamilia] = useState(false);
    const [newFamiliaName, setNewFamiliaName] = useState('');
    const [isCreatingModelo, setIsCreatingModelo] = useState(false);
    const [newModeloName, setNewModeloName] = useState('');
    const [creatingEntity, setCreatingEntity] = useState(false);

    useEffect(() => {
        fetchReferenceData();
        if (productId) {
            fetchProductData(productId);
        }
    }, [productId]);

    const fetchProductData = async (id: string) => {
        setLoading(true);
        try {
            // 1. Fetch product
            const { data: prod } = await supabase.from('productos').select('*').eq('id', id).single();
            if (prod) {
                setSku(prod.sku);
                setNombre(prod.nombre);
                setDescripcion(prod.descripcion || '');
                setPrecio(prod.precio.toString());
                setPrecioOferta(prod.precio_oferta ? prod.precio_oferta.toString() : '');
                setStock(prod.stock.toString());
                setEsMultimarca(prod.es_multimarca || false);
            }

            // 2. Fetch product categories
            const { data: prodCats } = await supabase.from('producto_categorias').select('categoria_id').eq('producto_id', id);
            if (prodCats && prodCats.length > 0) {
                setCategoriasIds(prodCats.map(c => c.categoria_id));
            } else if (prod?.categoria_item_id) {
                // Fallback: use legacy single category column
                setCategoriasIds([prod.categoria_item_id]);
            }

            // 3. Fetch compatibilities
            const { data: compats } = await supabase.from('compatibilidad').select('modelo_id').eq('producto_id', id);
            if (compats) {
                setCompatibleModels(compats.map(c => c.modelo_id));
            }

            // 4. Fetch images
            const { data: imgs } = await supabase.from('productos_imagenes').select('url, orden').eq('producto_id', id).order('orden');
            if (imgs && imgs.length > 0) {
                const updatedImages = [...productImages];
                imgs.forEach((img, index) => {
                    if (index < 5) {
                        updatedImages[index] = { url: img.url, file: null };
                    }
                });
                setProductImages(updatedImages);
            } else if (prod?.imagen_url) {
                // Fallback if there's only a main image
                const updatedImages = [...productImages];
                updatedImages[0] = { url: prod.imagen_url, file: null };
                setProductImages(updatedImages);
            }
        } catch (error) {
            console.error('Error loading product data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReferenceData = async () => {
        setLoading(true);
        try {
            const { data: cats } = await supabase.from('categorias_items').select('*').order('nombre');
            if (cats) setCategorias(cats);

            const { data: mks } = await supabase.from('marcas').select('*').order('nombre');
            if (mks) setMarcas(mks);

            const { data: fams } = await supabase.from('familias').select('*').order('nombre');
            if (fams) setFamilias(fams);

            const { data: mods } = await supabase.from('modelos').select('*').order('nombre_especifico');
            if (mods) setModelos(mods);
        } catch (error) {
            console.error('Error fetching reference data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleModelToggle = (modeloId: string) => {
        setCompatibleModels(prev =>
            prev.includes(modeloId)
                ? prev.filter(id => id !== modeloId)
                : [...prev, modeloId]
        );
    };

    const handleCategoriaToggle = (catId: string) => {
        setCategoriasIds(prev =>
            prev.includes(catId)
                ? prev.filter(id => id !== catId)
                : [...prev, catId]
        );
    };

    const handleCreateFamilia = async () => {
        if (!newFamiliaName.trim() || !selectedMarca) return;
        setCreatingEntity(true);
        try {
            const { data, error } = await supabase.from('familias').insert([{
                marca_id: selectedMarca,
                nombre: newFamiliaName.trim().toUpperCase()
            }]).select().single();
            if (error) throw error;
            if (data) {
                setFamilias([...familias, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
                setSelectedFamilia(data.id);
                setIsCreatingFamilia(false);
                setNewFamiliaName('');
            }
        } catch (error: any) {
            console.error('Error creating familia:', error);
            alert(`Error al crear familia: ${error.message}`);
        } finally {
            setCreatingEntity(false);
        }
    };

    const handleCreateModelo = async () => {
        if (!newModeloName.trim() || !selectedFamilia) return;
        setCreatingEntity(true);
        try {
            const { data, error } = await supabase.from('modelos').insert([{
                familia_id: selectedFamilia,
                nombre_especifico: newModeloName.trim().toUpperCase()
            }]).select().single();
            if (error) throw error;
            if (data) {
                setModelos([...modelos, data].sort((a, b) => a.nombre_especifico.localeCompare(b.nombre_especifico)));
                setCompatibleModels([...compatibleModels, data.id]);
                setIsCreatingModelo(false);
                setNewModeloName('');
            }
        } catch (error: any) {
            console.error('Error creating modelo:', error);
            alert(`Error al crear modelo: ${error.message}`);
        } finally {
            setCreatingEntity(false);
        }
    };

    const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const updated = [...productImages];
            updated[index] = { ...updated[index], file: file, url: '' };
            setProductImages(updated);
        }
    };

    const handleImageUrlChange = (index: number, val: string) => {
        const updated = [...productImages];
        updated[index] = { ...updated[index], url: val, file: null };
        setProductImages(updated);
    };

    const handleDelete = async () => {
        if (!productId) return;
        if (!confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/productos/${productId}`, { method: 'DELETE' });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Error al eliminar el producto');
            
            alert('Producto eliminado exitosamente');
            router.push('/dashboard/productos');
            router.refresh();
        } catch (error: any) {
            console.error('Delete error:', error);
            alert(`Error al eliminar: ${error.message}`);
        } finally {
            setDeleting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // 1. Process Images
            const finalImageUrls: string[] = [];
            
            for (let i = 0; i < productImages.length; i++) {
                const img = productImages[i];
                if (img.file) {
                    const fileExt = img.file.name.split('.').pop();
                    const fileName = `${sku.toUpperCase()}-${i}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
                    const filePath = `productos/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('productos_imagenes')
                        .upload(filePath, img.file);

                    if (uploadError) throw new Error(`Error subiendo imagen ${i+1}: ${uploadError.message}`);

                    const { data: { publicUrl } } = supabase.storage
                        .from('productos_imagenes')
                        .getPublicUrl(filePath);
                    
                    finalImageUrls.push(publicUrl);
                } else if (img.url) {
                    finalImageUrls.push(img.url);
                }
            }

            // 2. Insert or Update Product
            let currentProductId = productId;
            if (categoriasIds.length === 0) {
                throw new Error('Debes seleccionar al menos una categoría.');
            }

            const productData: any = {
                sku: sku.toUpperCase(),
                nombre: nombre,
                descripcion: descripcion,
                precio: parseFloat(precio),
                precio_oferta: precioOferta ? parseFloat(precioOferta) : null,
                stock: parseInt(stock),
                categoria_item_id: categoriasIds[0], // Primera categoría como principal (compatibilidad)
                imagen_url: finalImageUrls[0] || null, // Main image is the first one
                es_multimarca: esMultimarca
            };

            if (productId) {
                const { error: updateError } = await supabase
                    .from('productos')
                    .update(productData)
                    .eq('id', productId);
                if (updateError) throw updateError;
            } else {
                // Durante creación, agregar rastreabilidad
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    productData.created_by = user.id;
                    productData.created_by_name = user.user_metadata?.nombre || user.email || 'Usuario';
                }

                const { data: productoNuevo, error: insertError } = await supabase
                    .from('productos')
                    .insert(productData)
                    .select()
                    .single();
                if (insertError) throw insertError;
                currentProductId = productoNuevo?.id;
            }

            if (!currentProductId) throw new Error('No se pudo obtener el ID del producto.');

            // 3. Save product categories (N:M)
            await supabase.from('producto_categorias').delete().eq('producto_id', currentProductId);
            const categoriaDocs = categoriasIds.map(catId => ({
                producto_id: currentProductId,
                categoria_id: catId
            }));
            const { error: catError } = await supabase.from('producto_categorias').insert(categoriaDocs);
            if (catError) console.error('Error saving categories:', catError);

            // 4. Save Compatibilities
            // Delete old ones first if editing
            if (productId) {
                await supabase.from('compatibilidad').delete().eq('producto_id', currentProductId);
            }

            if (compatibleModels.length > 0) {
                const compatibilidadDocs = compatibleModels.map(modeloId => ({
                    producto_id: currentProductId,
                    modelo_id: modeloId
                }));
                const { error: compatError } = await supabase.from('compatibilidad').insert(compatibilidadDocs);
                if (compatError) console.error('Error saving compatibilities:', compatError);
            }

            // 4. Save Additional Images
            // Delete old ones first if editing
            if (productId) {
                await supabase.from('productos_imagenes').delete().eq('producto_id', currentProductId);
            }

            if (finalImageUrls.length > 0) {
                const imageDocs = finalImageUrls.map((url, index) => ({
                    producto_id: currentProductId,
                    url: url,
                    orden: index
                }));
                const { error: imgTableError } = await supabase.from('productos_imagenes').insert(imageDocs);
                if (imgTableError) console.error('Error saving images table:', imgTableError);
            }

            alert(productId ? 'Producto actualizado exitosamente!' : 'Producto creado exitosamente!');
            router.push('/dashboard/productos');
            router.refresh();

        } catch (error: any) {
            console.error('Submission error:', error);
            alert(`Error al guardar: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="animate-pulse text-gray-500">Cargando...</div>;

    const filteredFamilias = familias.filter(f => f.marca_id === selectedMarca);
    const filteredModelos = modelos.filter(m => m.familia_id === selectedFamilia);

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Sección: Datos Básicos */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-3 mb-6 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#0033a0]" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                    Información General
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1 tracking-tight">CÓDIGO / SKU *</label>
                        <input required type="text" value={sku} onChange={(e) => setSku(e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#0033a0] focus:ring-[#0033a0] sm:text-sm px-4 py-2.5 border text-gray-900 uppercase font-mono" placeholder="EJ: SW-1002" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1 tracking-tight">Nombre del Producto *</label>
                        <input required type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#0033a0] focus:ring-[#0033a0] sm:text-sm px-4 py-2.5 border text-gray-900" placeholder="Kit de Luces LED" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1 tracking-tight">Descripción</label>
                        <textarea rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#0033a0] focus:ring-[#0033a0] sm:text-sm px-4 py-2.5 border text-gray-900" placeholder="Detalles técnicos y características..." />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2 tracking-tight">
                            Categorías *
                            <span className="ml-2 text-xs font-normal text-gray-400">(Selecciona una o varias)</span>
                        </label>
                        {categoriasIds.length === 0 && (
                            <p className="text-xs text-red-500 mb-2 font-medium">⚠ Debe seleccionar al menos una categoría</p>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                            {categorias.map(cat => (
                                <label
                                    key={cat.id}
                                    className={`flex items-center gap-1.5 px-2 py-2 rounded-lg border cursor-pointer transition-all select-none text-xs font-bold leading-tight
                                        ${categoriasIds.includes(cat.id)
                                            ? 'bg-[#0033a0] text-white border-[#0033a0] shadow-sm'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-[#0033a0] hover:bg-blue-50'}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={categoriasIds.includes(cat.id)}
                                        onChange={() => handleCategoriaToggle(cat.id)}
                                        className="sr-only"
                                    />
                                    <svg
                                        className={`h-3.5 w-3.5 shrink-0 transition-opacity ${categoriasIds.includes(cat.id) ? 'opacity-100' : 'opacity-0'}`}
                                        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                                    >
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="break-words">{cat.nombre}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1 tracking-tight">Stock Disponible *</label>
                        <input required type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#0033a0] focus:ring-[#0033a0] sm:text-sm px-4 py-2.5 border text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1 tracking-tight">Precio Normal ($) *</label>
                        <input required type="number" min="0" value={precio} onChange={(e) => setPrecio(e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#0033a0] focus:ring-[#0033a0] sm:text-sm px-4 py-2.5 border text-gray-900 font-bold" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1 tracking-tight">Precio Oferta ($) <span className="text-red-500 text-[10px] uppercase font-black ml-1">Opcional</span></label>
                        <input type="number" min="0" value={precioOferta} onChange={(e) => setPrecioOferta(e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm px-4 py-2.5 border text-red-600 font-bold" />
                    </div>
                </div>
            </div>

            {/* Sección: Imágenes (Hasta 5) */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-3 mb-6 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#0033a0]" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    Galería de Imágenes (Máximo 5)
                </h3>
                
                <div className="space-y-4">
                    {productImages.map((img, index) => (
                        <div key={index} className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 items-center">
                            <div className="w-12 h-12 bg-[#0033a0] rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                                {index + 1}
                            </div>
                            
                            <div className="flex-1 w-full space-y-2">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Subir Archivo</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageChange(index, e)}
                                            className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[#0033a0]/10 file:text-[#0033a0] hover:file:bg-[#0033a0]/20"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">O Pegar URL</label>
                                        <input
                                            type="text"
                                            value={img.url}
                                            onChange={(e) => handleImageUrlChange(index, e.target.value)}
                                            className="w-full rounded-md border-gray-200 shadow-sm focus:ring-[#0033a0] text-xs text-gray-900 px-3 py-1.5 border"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                                {(img.url || img.file) && (
                                    <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Imagen {index + 1} lista {img.file ? `(${img.file.name})` : '(URL)'}
                                    </div>
                                )}
                            </div>
                            
                            {(img.url || img.file) && (
                                <div className="w-20 h-20 rounded border overflow-hidden bg-white flex items-center justify-center shrink-0 shadow-sm">
                                    <img 
                                        src={img.file ? URL.createObjectURL(img.file) : img.url} 
                                        alt={`Preview ${index+1}`} 
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Sección: Compatibilidad */}
            <div className="bg-[#f8fafc] p-6 rounded-xl border border-blue-100 shadow-inner">
                <h3 className="text-lg font-bold text-gray-900 border-b border-blue-100 pb-3 mb-6 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#0033a0]" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
                    </svg>
                    Compatibilidad de Vehículos
                </h3>

                {/* Control de Producto Universal */}
                <div className="mb-8 bg-blue-50/50 p-5 rounded-lg border border-blue-200 shadow-sm flex items-start gap-4 transition-colors">
                    <div className="flex h-6 items-center">
                        <input
                            id="esMultimarcaCheckbox"
                            type="checkbox"
                            checked={esMultimarca}
                            onChange={(e) => setEsMultimarca(e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-[#0033a0] focus:ring-[#0033a0]"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="esMultimarcaCheckbox" className="font-bold text-[#0033a0] cursor-pointer">
                            Universal / Multimarca: Producto visible para todas las marcas
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                            Al activar esta opción, el producto aparecerá siempre visible independientemente del filtro de marca o modelo que aplique el cliente.
                        </p>
                    </div>
                </div>

                <div className={`transition-all duration-300 ${esMultimarca ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                        <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Paso 1: Seleccione Marca</label>
                        <select value={selectedMarca} onChange={(e) => { setSelectedMarca(e.target.value); setSelectedFamilia(''); }} className="w-full rounded-lg border-gray-200 shadow-sm px-4 py-3 border bg-white text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#0033a0]/20 transition-all">
                            <option value="">Todas las marcas</option>
                            {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                        </select>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Paso 2: Seleccione Familia</label>
                            {selectedMarca && !isCreatingFamilia && (
                                <button type="button" onClick={() => setIsCreatingFamilia(true)} className="text-xs font-bold text-[#0033a0] hover:underline flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                    Nueva Familia
                                </button>
                            )}
                        </div>
                        {isCreatingFamilia ? (
                            <div className="flex gap-2">
                                <input type="text" value={newFamiliaName} onChange={(e) => setNewFamiliaName(e.target.value)} placeholder="Ej. TIGGO 8" className="w-full rounded-lg border-gray-200 shadow-sm px-4 py-2 border bg-white text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#0033a0]/20 transition-all uppercase" autoFocus />
                                <button type="button" onClick={handleCreateFamilia} disabled={creatingEntity || !newFamiliaName.trim()} className="bg-[#0033a0] text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50">Guardar</button>
                                <button type="button" onClick={() => {setIsCreatingFamilia(false); setNewFamiliaName('');}} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm font-bold">X</button>
                            </div>
                        ) : (
                            <select disabled={!selectedMarca} value={selectedFamilia} onChange={(e) => setSelectedFamilia(e.target.value)} className="w-full rounded-lg border-gray-200 shadow-sm px-4 py-3 border bg-white text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#0033a0]/20 transition-all disabled:bg-gray-100 disabled:opacity-50">
                                <option value="">Todas las familias</option>
                                {filteredFamilias.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                            </select>
                        )}
                    </div>
                </div>

                <div className="bg-white border-2 border-dashed border-blue-50 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <label className="block text-xs font-black text-[#0033a0] uppercase tracking-widest">Paso 3: Marque Modelos Compatibles</label>
                        {selectedFamilia && !isCreatingModelo && (
                            <button type="button" onClick={() => setIsCreatingModelo(true)} className="text-xs font-bold text-[#0033a0] bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors flex items-center gap-1 border border-blue-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                Nuevo Modelo
                            </button>
                        )}
                    </div>
                    
                    {isCreatingModelo && (
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-blue-50/50 p-4 rounded-lg border border-blue-100 mb-4 shadow-sm">
                            <span className="text-sm font-bold text-[#0033a0] shrink-0">Nombre del Modelo:</span>
                            <input type="text" value={newModeloName} onChange={(e) => setNewModeloName(e.target.value)} placeholder="Ej. 1.5 TURBO" className="flex-1 w-full rounded-lg border-blue-200 shadow-sm px-3 py-2 border bg-white text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#0033a0]/20 uppercase" autoFocus />
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button type="button" onClick={handleCreateModelo} disabled={creatingEntity || !newModeloName.trim()} className="flex-1 sm:flex-none bg-[#0033a0] text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-800 disabled:opacity-50 transition-all whitespace-nowrap">
                                    {creatingEntity ? 'Guardando...' : 'Guardar'}
                                </button>
                                <button type="button" onClick={() => {setIsCreatingModelo(false); setNewModeloName('');}} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition-all">Cancelar</button>
                            </div>
                        </div>
                    )}

                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {selectedFamilia ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {filteredModelos.length > 0 ? filteredModelos.map(modelo => (
                                    <label key={modelo.id} className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer border transition-all ${compatibleModels.includes(modelo.id) ? 'bg-blue-50 border-[#0033a0] ring-1 ring-[#0033a0]' : 'hover:bg-gray-50 border-gray-100'}`}>
                                        <input
                                            type="checkbox"
                                            checked={compatibleModels.includes(modelo.id)}
                                            onChange={() => handleModelToggle(modelo.id)}
                                            className="h-5 w-5 rounded border-gray-300 text-[#0033a0] focus:ring-[#0033a0]"
                                        />
                                        <span className="text-sm font-bold text-gray-700">{modelo.nombre_especifico}</span>
                                    </label>
                                )) : (
                                    <p className="text-sm text-gray-500 italic py-4">No hay modelos registrados para esta familia.</p>
                                )}
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <p className="text-sm text-gray-400 font-medium">Filtra por Marca y Familia para ver los modelos.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-50">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Resumen de Selección ({compatibleModels.length})</h4>
                    <div className="flex flex-wrap gap-2">
                        {compatibleModels.map(id => {
                            const mod = modelos.find(m => m.id === id);
                            return mod ? (
                                <span key={id} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-[#0033a0] text-white">
                                    {mod.nombre_especifico}
                                    <button type="button" onClick={() => handleModelToggle(id)} className="ml-2 hover:text-red-300 transition-colors">
                                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                    </button>
                                </span>
                            ) : null;
                        })}
                    </div>
                </div>
                </div>
            </div>

            {/* Actions */}
            <div className={`pt-8 flex ${productId ? 'justify-between' : 'justify-end'} items-center`}>
                {productId && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting || submitting}
                        className={`inline-flex items-center gap-2 justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 py-3.5 px-6 text-base font-bold transition-all hover:bg-red-100 focus:ring-4 focus:ring-red-100 ${deleting ? 'opacity-70 cursor-not-allowed scale-95' : 'hover:scale-105 active:scale-95'}`}
                    >
                        {deleting ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Eliminando...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Eliminar
                            </>
                        )}
                    </button>
                )}
                <button
                    type="submit"
                    disabled={submitting}
                    className={`inline-flex items-center gap-2 justify-center rounded-xl bg-[#0033a0] py-3.5 px-10 text-base font-black text-white shadow-xl hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all ${submitting ? 'opacity-70 cursor-not-allowed scale-95' : 'hover:scale-105 active:scale-95'}`}
                >
                    {submitting ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Guardando...
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                            {productId ? 'Actualizar Producto' : 'Guardar Producto'}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
