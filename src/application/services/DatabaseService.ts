import { supabase } from '../../lib/supabaseClient';

export const DatabaseService = {
  getVigencias: async () => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.schema('Conf').from('Vigencias').select('*');
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("Error fetching vigencias", e);
      return [];
    }
  },
  
  saveVigencia: async (v: any) => {
    if (!supabase) return v;
    try {
      const { data, error } = await supabase.schema('Conf').from('Vigencias').upsert({
        IdVigencia: v.IdVigencia || v.id,
        Nombre: v.Nombre || v.nombre || 'Nueva Vigencia',
        Anio: v.Anio || v.anio || new Date().getFullYear(),
        Estado: v.Estado || v.estado || 'Activo',
        FechaInicio: v.FechaInicio || v.fechaInicio || new Date().toISOString().split('T')[0],
        Param_TS: v.Param_TS || 0.07,
        Param_HorasEfectivas: v.Param_HorasEfectivas || 167.2,
        Param_JornadaDiaria: v.Param_JornadaDiaria || 8.8,
        Activo: v.Activo ?? true
      }, { onConflict: 'IdVigencia' }).select();
      if (error) throw error;
      return data && data[0] ? data[0] : v;
    } catch (e) {
      console.error("Error saving vigencia", e);
      return v;
    }
  },

  getEstructuraOrg: async () => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.schema('Org').from('EstructuraJerarquica').select('*');
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("Error fetching org", e);
      return [];
    }
  },
  
  saveEstructuraOrg: async (nodos: any[]) => {
    if (!supabase || !nodos || nodos.length === 0) return nodos;
    try {
      const format = nodos.map(n => ({
        IdNodoOrg: n.IdNodoOrg || n.id,
        IdVigencia: n.IdVigencia || n.vigenciaId,
        IdPadre: n.IdPadre || n.padreId || null,
        Nivel: n.Nivel || n.nivel || 1,
        CodigoInterno: n.CodigoInterno || n.codigo || 'S/N',
        Nombre: n.Nombre || n.nombre || 'Nodo',
        Activo: n.Activo ?? true
      }));
      const { error } = await supabase.schema('Org').from('EstructuraJerarquica').upsert(format, { onConflict: 'IdNodoOrg' });
      if (error) throw error;
    } catch (e) {
      console.error("Error saving org", e);
    }
    return nodos;
  },

  getEstructuraProc: async () => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.schema('Cat').from('EstructuraProcesos').select('*');
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("Error fetching proc", e);
      return [];
    }
  },
  
  saveEstructuraProc: async (nodos: any[]) => {
    if (!supabase || !nodos || nodos.length === 0) return nodos;
    try {
      const format = nodos.map(n => ({
        IdNodoProceso: n.IdNodoProceso || n.id,
        IdVigencia: n.IdVigencia || n.vigenciaId,
        IdPadre: n.IdPadre || n.padreId || null,
        IdTipoProceso: n.IdTipoProceso || null,
        Nivel: n.Nivel || n.nivel || 1,
        CodigoInterno: n.CodigoInterno || n.codigo || 'S/N',
        Nombre: n.Nombre || n.nombre || 'Proceso',
        Producto: n.Producto || n.producto || null,
        Activo: n.Activo ?? true
      }));
      const { error } = await supabase.schema('Cat').from('EstructuraProcesos').upsert(format, { onConflict: 'IdNodoProceso' });
      if (error) throw error;
    } catch (e) {
      console.error("Error saving proc", e);
    }
    return nodos;
  },

  getMapaRelaciones: async () => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.schema('Org').from('MapaRelaciones').select('*');
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("Error fetching mapa", e);
      return [];
    }
  },

  saveMapaRelaciones: async (relaciones: any[]) => {
    if (!supabase || !relaciones || relaciones.length === 0) return relaciones;
    try {
      const format = relaciones.map((r, index) => ({
        IdVigencia: r.IdVigencia || r.vigenciaId,
        IdNodoOrg: r.IdNodoOrg || r.parentId,
        IdNodoProceso: r.IdNodoProceso || r.childId,
        ObservacionRelacion: r.type || null,
        Activo: r.Activo ?? true
      }));
      
      const { error } = await supabase.schema('Org').from('MapaRelaciones').upsert(format, { onConflict: 'IdVigencia,IdNodoOrg,IdNodoProceso' });
      if (error) throw error;
    } catch (e) {
      console.error("Error saving mapa", e);
    }
    return relaciones;
  }
};
