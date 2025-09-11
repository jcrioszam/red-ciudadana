import React, { useState, useRef } from 'react';
import axios from 'axios';

const TablaPadronEditable = ({ onClose }) => {
    const [datos, setDatos] = useState([]);
    const [columnas] = useState([
        'consecutivo', 'elector', 'ape_pat', 'ape_mat', 'nombre', 'fnac', 'edad', 'sexo',
        'curp', 'ocupacion', 'calle', 'num_ext', 'num_int', 'colonia', 'codpostal',
        'tiempres', 'entidad', 'distrito', 'municipio', 'seccion', 'localidad',
        'manzana', 'en_ln', 'misioncr'
    ]);
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const textareaRef = useRef(null);

    const procesarDatosPegados = (texto) => {
        try {
            // Dividir por líneas
            const lineas = texto.trim().split('\n');
            if (lineas.length < 2) {
                setMensaje('❌ Se necesitan al menos 2 líneas (encabezados + datos)');
                return;
            }

            // Primera línea son los encabezados
            const encabezados = lineas[0].split('\t');
            
            // Mapear encabezados a columnas de la BD
            const mapeoColumnas = {
                'CONSECUTIV': 'consecutivo',
                'ELECTOR': 'elector',
                'APE_PAT': 'ape_pat',
                'APE_MAT': 'ape_mat',
                'NOMBRE': 'nombre',
                'FNAC': 'fnac',
                'EDAD': 'edad',
                'SEXO': 'sexo',
                'CURP': 'curp',
                'OCUPACION': 'ocupacion',
                'CALLE': 'calle',
                'NUM_EXT': 'num_ext',
                'NUM_INT': 'num_int',
                'COLONIA': 'colonia',
                'CODPOSTAL': 'codpostal',
                'TIEMPRES': 'tiempres',
                'ENTIDAD': 'entidad',
                'DISTRITO': 'distrito',
                'MUNICIPIO': 'municipio',
                'SECCION': 'seccion',
                'LOCALIDAD': 'localidad',
                'MANZANA': 'manzana',
                'EN_LN': 'en_ln',
                'EMISIONCRE': 'misioncr'
            };

            // Procesar datos
            const nuevosDatos = [];
            for (let i = 1; i < lineas.length; i++) {
                const valores = lineas[i].split('\t');
                const registro = {};
                
                encabezados.forEach((encabezado, index) => {
                    const columnaBD = mapeoColumnas[encabezado] || encabezado.toLowerCase();
                    registro[columnaBD] = valores[index] || '';
                });
                
                nuevosDatos.push(registro);
            }

            setDatos(nuevosDatos);
            setMensaje(`✅ Procesados ${nuevosDatos.length} registros`);
        } catch (error) {
            setMensaje(`❌ Error procesando datos: ${error.message}`);
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const texto = e.clipboardData.getData('text');
        procesarDatosPegados(texto);
    };

    const actualizarCelda = (filaIndex, columna, valor) => {
        const nuevosDatos = [...datos];
        nuevosDatos[filaIndex][columna] = valor;
        setDatos(nuevosDatos);
    };

    const guardarDatos = async () => {
        if (datos.length === 0) {
            setMensaje('❌ No hay datos para guardar');
            return;
        }

        setCargando(true);
        setMensaje('💾 Guardando datos...');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/padron/guardar-datos-tabla`,
                datos,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                setMensaje(`✅ ${response.data.mensaje}`);
                setDatos([]);
                // Cerrar modal después de 2 segundos
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                setMensaje(`❌ Error: ${response.data.error}`);
            }
        } catch (error) {
            setMensaje(`❌ Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setCargando(false);
        }
    };

    const limpiarDatos = () => {
        setDatos([]);
        setMensaje('');
        if (textareaRef.current) {
            textareaRef.current.value = '';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-11/12 h-5/6 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">
                        📊 Tabla Editable del Padrón Electoral
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Instrucciones */}
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-semibold text-blue-800 mb-2">📋 Instrucciones:</h3>
                        <ol className="text-sm text-blue-700 space-y-1">
                            <li>1. Copia los datos desde Excel (incluyendo encabezados)</li>
                            <li>2. Pega en el área de texto de abajo</li>
                            <li>3. Los datos aparecerán en la tabla editable</li>
                            <li>4. Puedes editar cualquier celda directamente</li>
                            <li>5. Haz clic en "Guardar Datos" para guardar en la base de datos</li>
                        </ol>
                    </div>

                    {/* Área de pegado */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            📋 Pegar datos desde Excel:
                        </label>
                        <textarea
                            ref={textareaRef}
                            onPaste={handlePaste}
                            placeholder="Copia y pega aquí los datos desde Excel (incluyendo encabezados)..."
                            className="w-full h-20 p-3 border border-gray-300 rounded-lg resize-none"
                        />
                    </div>

                    {/* Mensaje de estado */}
                    {mensaje && (
                        <div className={`mb-4 p-3 rounded-lg ${
                            mensaje.includes('✅') ? 'bg-green-100 text-green-800' :
                            mensaje.includes('❌') ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                        }`}>
                            {mensaje}
                        </div>
                    )}

                    {/* Tabla de datos */}
                    {datos.length > 0 && (
                        <div className="flex-1 overflow-auto border border-gray-300 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        {columnas.map((columna) => (
                                            <th
                                                key={columna}
                                                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                {columna}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {datos.slice(0, 100).map((fila, filaIndex) => (
                                        <tr key={filaIndex} className="hover:bg-gray-50">
                                            {columnas.map((columna) => (
                                                <td key={columna} className="px-3 py-2 whitespace-nowrap">
                                                    <input
                                                        type="text"
                                                        value={fila[columna] || ''}
                                                        onChange={(e) => actualizarCelda(filaIndex, columna, e.target.value)}
                                                        className="w-full text-sm border-none bg-transparent focus:bg-white focus:border focus:border-blue-300 rounded px-1 py-1"
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {datos.length > 100 && (
                                <div className="p-2 text-sm text-gray-500 text-center">
                                    Mostrando los primeros 100 registros de {datos.length} total
                                </div>
                            )}
                        </div>
                    )}

                    {/* Botones de acción */}
                    <div className="mt-4 flex justify-end space-x-3">
                        <button
                            onClick={limpiarDatos}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                        >
                            🗑️ Limpiar
                        </button>
                        <button
                            onClick={guardarDatos}
                            disabled={cargando || datos.length === 0}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {cargando ? '💾 Guardando...' : '💾 Guardar Datos'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TablaPadronEditable;
