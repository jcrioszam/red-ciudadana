import React from 'react';
import { useQuery } from 'react-query';
import { Tree, TreeNode } from 'react-organizational-chart';
import { FiUsers, FiUser, FiTrendingUp, FiMapPin } from 'react-icons/fi';
import api from '../api';

const NodoLider = ({ data }) => {
  const getRolColor = (rol) => {
    switch (rol) {
      case 'presidente':
        return 'bg-red-500';
      case 'admin':
        return 'bg-red-400';
      case 'lider_estatal':
        return 'bg-blue-500';
      case 'lider_regional':
        return 'bg-green-500';
      case 'lider_municipal':
        return 'bg-purple-500';
      case 'lider_zona':
        return 'bg-orange-500';
      case 'capturista':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRolNombre = (rol) => {
    switch (rol) {
      case 'presidente':
        return 'Presidente';
      case 'admin':
        return 'Administrador';
      case 'lider_estatal':
        return 'Líder Estatal';
      case 'lider_regional':
        return 'Líder Regional';
      case 'lider_municipal':
        return 'Líder Municipal';
      case 'lider_zona':
        return 'Líder de Zona';
      case 'capturista':
        return 'Capturista';
      default:
        return rol;
    }
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow min-w-[200px] max-w-xs mx-auto">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-full ${getRolColor(data.rol)}`}>
          <FiUser className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">{data.nombre}</h3>
          <p className="text-xs text-gray-600">{getRolNombre(data.rol)}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center space-x-1">
          <FiUsers className="h-3 w-3 text-blue-500" />
          <span className="text-gray-700">{data.total_personas}</span>
        </div>
        <div className="flex items-center space-x-1">
          <FiTrendingUp className="h-3 w-3 text-green-500" />
          <span className="text-gray-700">{data.total_subordinados}</span>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        <div>Personas: {data.total_personas}</div>
        <div>Subordinados: {data.total_subordinados}</div>
      </div>
    </div>
  );
};

const EstructuraJerarquica = () => {
  const { data: estructura, isLoading, error } = useQuery('estructuraJerarquica', async () => {
    const response = await api.get('/reportes/estructura-jerarquica');
    return response.data;
  });

  const renderNodo = (nodo) => {
    return (
      <TreeNode key={nodo.id} label={<NodoLider data={nodo} />}>
        {nodo.subordinados.map(subordinado => renderNodo(subordinado))}
      </TreeNode>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error al cargar la estructura jerárquica</p>
      </div>
    );
  }

  if (!estructura) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No hay datos de estructura jerárquica disponibles</p>
      </div>
    );
  }

  return (
    <div className="w-screen h-[80vh] min-h-[600px] max-h-[90vh] overflow-auto bg-secondary-50 rounded-lg border border-secondary-200 p-4 flex flex-col items-center">
      {/* Resumen de la red */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 w-full max-w-5xl">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <FiUsers className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Total Personas</p>
              <p className="text-2xl font-bold text-secondary-900">{estructura.total_personas_red}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <FiUser className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Total Líderes</p>
              <p className="text-2xl font-bold text-secondary-900">{estructura.total_lideres_red}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <FiMapPin className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Niveles</p>
              <p className="text-2xl font-bold text-secondary-900">{estructura.niveles_jerarquia}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Diagrama jerárquico pantalla completa */}
      <div className="flex-1 w-full overflow-auto flex items-center justify-center">
        <div className="min-w-[1200px] p-4">
          <Tree
            lineWidth={"2px"}
            lineColor={"#bdbdbd"}
            lineBorderRadius={"8px"}
            label={<NodoLider data={estructura.lider_general} />}
          >
            {estructura.lider_general.subordinados.map(sub => renderNodo(sub))}
          </Tree>
        </div>
      </div>
    </div>
  );
};

export default EstructuraJerarquica; 