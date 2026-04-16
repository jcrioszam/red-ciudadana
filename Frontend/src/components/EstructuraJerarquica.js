import React from 'react';
import { useQuery } from 'react-query';
import { Tree, TreeNode } from 'react-organizational-chart';
import { FiUsers, FiUser, FiTrendingUp, FiMapPin } from 'react-icons/fi';
import api from '../api';

const ROL_CONFIG = {
  presidente:      { label: 'Presidente',     color: '#ef4444', bg: '#fef2f2' },
  admin:           { label: 'Administrador',  color: '#6b7280', bg: '#f3f4f6' },
  lider_estatal:   { label: 'Estatal',        color: '#3b82f6', bg: '#eff6ff' },
  lider_regional:  { label: 'Regional',       color: '#10b981', bg: '#ecfdf5' },
  lider_zona:      { label: 'Zona',           color: '#f59e0b', bg: '#fffbeb' },
  lider_municipal: { label: 'Municipal',      color: '#8b5cf6', bg: '#f5f3ff' },
  capturista:      { label: 'Capturista',     color: '#6b7280', bg: '#f3f4f6' },
};

const getRol = (rol) => ROL_CONFIG[rol] || { label: rol, color: '#6b7280', bg: '#f3f4f6' };

const NodoLider = ({ data }) => {
  const r = getRol(data.rol);
  return (
    <div style={{
      background: 'white',
      border: `1.5px solid ${r.color}44`,
      borderTop: `3px solid ${r.color}`,
      borderRadius: 10,
      padding: '8px 12px',
      minWidth: 130,
      maxWidth: 170,
      margin: '0 auto',
      boxShadow: '0 1px 6px rgba(0,0,0,.08)',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center',
    }}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: r.bg, border: `2px solid ${r.color}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 5px',
      }}>
        <FiUser size={14} color={r.color} />
      </div>

      {/* Nombre */}
      <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#1a1f2e', lineHeight: 1.2, marginBottom: 3 }}>
        {data.nombre}
      </div>

      {/* Badge rol */}
      <div style={{
        display: 'inline-block', fontSize: '.65rem', fontWeight: 700,
        color: r.color, background: r.bg,
        padding: '1px 7px', borderRadius: 20, marginBottom: 6,
      }}>
        {r.label}
      </div>

      {/* Métricas */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, fontSize: '.68rem', color: '#6b7280' }}>
        <span title="Personas"><FiUsers size={10} style={{ display: 'inline', marginRight: 2 }} />{data.total_personas}</span>
        <span title="Subordinados"><FiTrendingUp size={10} style={{ display: 'inline', marginRight: 2 }} />{data.total_subordinados}</span>
      </div>
    </div>
  );
};

const countNodos = (nodo) =>
  1 + (nodo.subordinados || []).reduce((acc, sub) => acc + countNodos(sub), 0);

const EstructuraJerarquica = () => {
  const { data: rawData, isLoading, error } = useQuery('estructuraJerarquica', async () => {
    const response = await api.get('/reportes/estructura-jerarquica');
    return response.data;
  });

  const renderNodo = (nodo) => (
    <TreeNode key={nodo.id} label={<NodoLider data={nodo} />}>
      {(nodo.subordinados || []).map(sub => renderNodo(sub))}
    </TreeNode>
  );

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: 32, color: '#dc2626' }}>Error al cargar la estructura jerárquica</div>;
  }

  const nodos = (rawData?.estructura || []).filter(n => n.rol !== 'admin');
  if (nodos.length === 0) {
    return <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>No hay datos de estructura jerárquica disponibles</div>;
  }

  const raiz = nodos.length === 1
    ? nodos[0]
    : { id: 0, nombre: 'Red Ciudadana', rol: 'presidente', total_personas: 0, total_subordinados: nodos.length, subordinados: nodos };

  const totalPersonas = nodos.reduce((acc, n) => acc + (n.total_personas_red || 0), 0);
  const totalLideres  = nodos.reduce((acc, n) => acc + countNodos(n), 0);
  const niveles       = rawData?.total_niveles || 0;

  return (
    <div style={{ width: '100%', fontFamily: 'system-ui, sans-serif' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Personas', n: totalPersonas, color: '#3b82f6', bg: '#eff6ff', Icon: FiUsers },
          { label: 'Total Líderes',  n: totalLideres,  color: '#10b981', bg: '#ecfdf5', Icon: FiUser },
          { label: 'Niveles',        n: niveles,        color: '#8b5cf6', bg: '#f5f3ff', Icon: FiMapPin },
        ].map(({ label, n, color, bg, Icon }) => (
          <div key={label} style={{ background: 'white', borderRadius: 12, padding: '14px 18px', border: '1px solid #f0f0f5', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
              <Icon size={18} />
            </div>
            <div>
              <div style={{ fontSize: '.74rem', color: '#8b93a5', fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1f2e', lineHeight: 1.1 }}>{n}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {Object.entries(ROL_CONFIG).filter(([k]) => k !== 'admin').map(([, v]) => (
          <span key={v.label} style={{ fontSize: '.68rem', fontWeight: 700, color: v.color, background: v.bg, padding: '2px 9px', borderRadius: 20, border: `1px solid ${v.color}33` }}>
            {v.label}
          </span>
        ))}
      </div>

      {/* Diagrama */}
      <div style={{
        width: '100%', overflowX: 'auto', overflowY: 'auto',
        background: '#f8fafc', borderRadius: 14,
        border: '1px solid #e4e7ed',
        padding: '24px 16px 32px',
        maxHeight: '70vh',
      }}>
        <div style={{ display: 'inline-block', minWidth: '100%' }}>
          <Tree
            lineWidth="1.5px"
            lineColor="#cbd5e1"
            lineBorderRadius="6px"
            label={<NodoLider data={raiz} />}
          >
            {(raiz.subordinados || []).map(sub => renderNodo(sub))}
          </Tree>
        </div>
      </div>
    </div>
  );
};

export default EstructuraJerarquica;
