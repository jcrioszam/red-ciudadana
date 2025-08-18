import React from 'react';
import EstructuraJerarquica from '../components/EstructuraJerarquica';
import { FiGitBranch, FiUsers, FiTrendingUp } from 'react-icons/fi';

const EstructuraRed = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 flex items-center">
          <FiGitBranch className="h-6 w-6 text-primary-600 mr-3" />
          Estructura de la Red Ciudadana
        </h1>
        <p className="text-secondary-600">
          Visualización completa de la jerarquía organizacional y distribución de líderes
        </p>
      </div>

      {/* Información adicional */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <FiUsers className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Red Completa</p>
              <p className="text-lg font-semibold text-secondary-900">Estructura Jerárquica</p>
            </div>
          </div>
          <p className="text-sm text-secondary-500 mt-2">
            Visualiza la organización completa desde el líder general hasta los capturistas
          </p>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <FiTrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Distribución</p>
              <p className="text-lg font-semibold text-secondary-900">Personas por Líder</p>
            </div>
          </div>
          <p className="text-sm text-secondary-500 mt-2">
            Ve cuántas personas tiene asignadas cada líder en la red
          </p>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <FiGitBranch className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Jerarquía</p>
              <p className="text-lg font-semibold text-secondary-900">Niveles Organizacionales</p>
            </div>
          </div>
          <p className="text-sm text-secondary-500 mt-2">
            Explora los diferentes niveles de liderazgo en la organización
          </p>
        </div>
      </div>

      {/* Componente de estructura jerárquica */}
      <EstructuraJerarquica />
    </div>
  );
};

export default EstructuraRed; 