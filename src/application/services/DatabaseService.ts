import { supabase } from '../../lib/supabaseClient';

export const DatabaseService = {
  getVigencias: async () => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.schema('Conf').from('Vigencias').select('*');
      if (error) throw error;
      return data || [];
    } catch (e: any) {
      console.error("Error fetching vigencias", e);
      throw new Error(e.message || "Error al cargar vigencias de base de datos");
    }
  },
  
  saveVigencia: async (v: any) => {
    if (!supabase) {
       if (import.meta.env.VITE_SUPABASE_URL) throw new Error("Falta la ANON_KEY de Supabase en las variables de entorno.");
       return v;
    }
    try {
      const payload = {
        IdVigencia: v.IdVigencia || v.id,
        Nombre: v.Nombre || v.nombre || 'Nueva Vigencia',
        Anio: v.Anio || v.anio || new Date().getFullYear(),
        Estado: v.Estado || v.estado || 'Activo',
        FechaInicio: v.FechaInicio || v.fechaInicio || new Date().toISOString().split('T')[0],
        Param_TS: v.Param_TS || 0.07,
        Param_HorasEfectivas: v.Param_HorasEfectivas || 167.2,
        Param_JornadaDiaria: v.Param_JornadaDiaria || 8.8,
        Activo: v.Activo ?? true
      };
      console.log("Supabase UPSERT payload:", payload);
      
      // Try regular upsert first
      const resp = await supabase.schema('Conf').from('Vigencias').upsert(payload).select();
      
      console.log("Supabase UPSERT response:", resp);
      
      if (resp.error) throw resp.error;
      
      if (!resp.data || resp.data.length === 0) {
        console.warn("UPSERT succeeded but returned no rows. Did the RLS policy block SELECT, or was it an empty update?");
        return v;
      }
      
      return resp.data[0];
    } catch (e: any) {
      console.error("Error saving vigencia", e);
      throw new Error(e.message || "Error guardando vigencia en Supabase");
    }
  },

  getEstructuraOrg: async () => {
    if (!supabase) return [];
    try {
      let allData: any[] = [];
      let from = 0;
      let limit = 1000;
      while (true) {
        const { data, error } = await supabase.schema('Org').from('EstructuraJerarquica').select('*').range(from, from + limit - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allData = [...allData, ...data];
        if (data.length < limit) break;
        from += limit;
      }
      return allData;
    } catch (e: any) {
      console.error("Error fetching org", e);
      throw new Error(e.message || "Error al cargar estructura jerárquica");
    }
  },
  
  saveEstructuraOrg: async (nodos: any[]) => {
    if (!supabase || !nodos || nodos.length === 0) return nodos;
    try {
      const format = nodos.map(n => ({
        IdNodoOrg: n.IdNodoOrg || n.id,
        IdVigencia: n.IdVigencia || n.vigenciaId,
        IdPadre: n.IdPadre || n.parentId || null,
        Nivel: n.Nivel || n.level || (n.parentId ? 2 : 1),
        CodigoInterno: n.CodigoInterno || (n.codigo && typeof n.codigo === 'string' && n.codigo.trim() !== '' ? n.codigo.trim() : null) || (String(n.IdNodoOrg || n.id || "")).substring(0,8) || 'S/N',
        Nombre: n.Nombre || n.nombre || 'Nodo',
        Activo: n.Activo !== undefined ? n.Activo : (n.activo !== undefined ? n.activo : true)
      }));
      console.log("Supabase saveEstructuraOrg payload:", format);
      const resp = await supabase.schema('Org').from('EstructuraJerarquica').upsert(format, { onConflict: 'IdNodoOrg' }).select();
      console.log("Supabase saveEstructuraOrg response:", resp);
      if (resp.error) throw resp.error;
    } catch (e: any) {
      console.error("Error saving org", e);
      throw new Error(e.message || "Error al guardar estructura jerárquica");
    }
    return nodos;
  },

  getEstructuraProc: async () => {
    if (!supabase) return [];
    try {
      let allData: any[] = [];
      let from = 0;
      let limit = 1000;
      while (true) {
        const { data, error } = await supabase.schema('Cat').from('EstructuraProcesos').select('*').range(from, from + limit - 1);
        if (error) {
           console.error("Soft failing EstructuraProcesos fetch:", error);
           break;
        }
        if (!data || data.length === 0) break;
        allData = [...allData, ...data];
        if (data.length < limit) break;
        from += limit;
      }
      return allData;
    } catch (e: any) {
      console.error("Error fetching proc", e);
      throw new Error(e.message || "Error al cargar estructura de procesos");
    }
  },
  
  saveEstructuraProc: async (nodos: any[]) => {
    if (!supabase || !nodos || nodos.length === 0) return nodos;
    try {
      const format = nodos.map(n => ({
        IdNodoProceso: n.IdNodoProceso || n.id,
        IdVigencia: n.IdVigencia || n.vigenciaId,
        IdPadre: n.IdPadre || n.padreId || n.procesoId || n.procedimientoId || null,
        IdTipoProceso: n.IdTipoProceso || null,
        Nivel: n.Nivel || n.nivel || 1,
        CodigoInterno: n.CodigoInterno || (n.codigo && typeof n.codigo === 'string' && n.codigo.trim() !== '' ? n.codigo.trim() : null) || (String(n.IdNodoProceso || n.id || "")).substring(0,8) || 'S/N',
        Nombre: n.Nombre || n.nombre || 'Proceso',
        Producto: n.Producto || n.producto || null,
        Activo: n.Activo !== undefined ? n.Activo : (n.activo !== undefined ? n.activo : true)
      }));
      console.log("Supabase saveEstructuraProc payload:", format);
      const resp = await supabase.schema('Cat').from('EstructuraProcesos').upsert(format, { onConflict: 'IdNodoProceso' }).select();
      console.log("Supabase saveEstructuraProc response:", resp);
      if (resp.error) throw resp.error;
    } catch (e: any) {
      console.error("Error saving proc", e);
      throw new Error(e.message || "Error al guardar estructura de procesos");
    }
    return nodos;
  },

  getMapaRelaciones: async () => {
    if (!supabase) return [];
    try {
      let allData: any[] = [];
      let from = 0;
      let limit = 1000;
      while (true) {
        const { data, error } = await supabase.schema('Org').from('MapaRelaciones').select('*').range(from, from + limit - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allData = [...allData, ...data];
        if (data.length < limit) break;
        from += limit;
      }
      return allData;
    } catch (e: any) {
      console.error("Error fetching mapa", e);
      throw new Error(e.message || "Error al cargar mapa de relaciones");
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
        Activo: r.Activo !== undefined ? r.Activo : (r.activo !== undefined ? r.activo : true)
      }));
      
      console.log("Supabase saveMapaRelaciones payload:", format);
      const resp = await supabase.schema('Org').from('MapaRelaciones').upsert(format, { onConflict: 'IdVigencia,IdNodoOrg,IdNodoProceso' }).select();
      console.log("Supabase saveMapaRelaciones response:", resp);
      if (resp.error) throw resp.error;
    } catch (e: any) {
      console.error("Error saving mapa", e);
      throw new Error(e.message || "Error al guardar mapa de relaciones");
    }
    return relaciones;
  },

  deleteMapaRelacion: async (idVigencia: number, parentId: string, childId: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.schema('Org').from('MapaRelaciones')
        .delete()
        .match({ IdVigencia: idVigencia, IdNodoOrg: parentId, IdNodoProceso: childId });
      if (error) throw error;
    } catch (e: any) {
      console.error("Error deleting mapa", e);
      throw new Error(e.message || "Error al eliminar relación");
    }
  },

  getUsuariosDependencia: async () => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.schema('Sec').from('UsuariosDependencia').select('*');
      if (error) throw error;
      return data || [];
    } catch (e: any) {
      console.error("Error fetching usuarios dependencia", e);
      throw new Error(e.message || "Error al cargar usuarios");
    }
  },
  
  getCargos: async () => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.schema('Org').from('Cargos').select('*');
      if (error) throw error;
      return data || [];
    } catch (e: any) {
      console.error("Error fetching cargos", e);
      throw new Error(e.message || "Error al cargar cargos");
    }
  },
  
  getFactoresFrecuencia: async () => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.schema('Conf').from('FactoresFrecuencia').select('*');
      if (error) throw error;
      return data || [];
    } catch (e: any) {
      console.error("Error fetching factores frecuencia", e);
      throw new Error(e.message || "Error al cargar factores de frecuencia");
    }
  },
  
  getCargasTrabajo: async () => {
    if (!supabase) return [];
    try {
      let allData: any[] = [];
      let from = 0;
      let limit = 1000;
      while (true) {
        const { data, error } = await supabase.schema('Ops').from('CargasTrabajo').select('*').range(from, from + limit - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allData = [...allData, ...data];
        if (data.length < limit) break;
        from += limit;
      }
      return allData;
    } catch (e: any) {
      console.error("Error fetching cargas trabajo", e);
      throw new Error(e.message || "Error al cargar cargas de trabajo");
    }
  },

  saveCargo: async (cargo: any) => {
    if (!supabase) return cargo;
    try {
      const payload: any = {
        IdVigencia: cargo.IdVigencia || cargo.vigenciaId,
        Denominacion: cargo.Denominacion || cargo.denominacion,
        NivelJerarquico: cargo.NivelJerarquico || cargo.nivelJerarquico,
        Activo: cargo.Activo !== undefined ? cargo.Activo : true
      };
      if (cargo.IdCargo && String(cargo.IdCargo).indexOf('-') === -1) {
        payload.IdCargo = cargo.IdCargo;
      }
      
      const { data, error } = await supabase.schema('Org').from('Cargos').upsert(payload, payload.IdCargo ? { onConflict: 'IdCargo' } : undefined).select();
      if (error) throw error;
      return data?.[0] || cargo;
    } catch (e: any) {
      console.error("Error saving cargo", e);
      throw new Error(e.message || "Error al guardar el cargo");
    }
  },

  deleteCargo: async (idCargo: number) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.schema('Org').from('Cargos').delete().eq('IdCargo', idCargo);
      if (error) throw error;
    } catch (e: any) {
      console.error("Error deleting cargo", e);
      throw new Error(e.message || "Error al eliminar el cargo");
    }
  },

  saveFactorFrecuencia: async (factor: any) => {
    if (!supabase) return factor;
    try {
      const payload: any = {
        IdVigencia: factor.IdVigencia || factor.vigenciaId,
        Nombre: factor.Nombre || factor.nombre,
        FactorMensual: factor.FactorMensual || factor.factorMensual || 1,
        EsSistema: factor.EsSistema !== undefined ? factor.EsSistema : false
      };
      if (factor.IdFactor && String(factor.IdFactor).indexOf('-') === -1) {
        payload.IdFactor = factor.IdFactor;
      }
      const { data, error } = await supabase.schema('Conf').from('FactoresFrecuencia').upsert(payload, payload.IdFactor ? { onConflict: 'IdFactor' } : undefined).select();
      if (error) throw error;
      return data?.[0] || factor;
    } catch (e: any) {
      console.error("Error saving factor de frecuencia", e);
      throw new Error(e.message || "Error al guardar el factor de frecuencia");
    }
  },

  deleteFactorFrecuencia: async (idFactor: number) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.schema('Conf').from('FactoresFrecuencia').delete().eq('IdFactor', idFactor);
      if (error) throw error;
    } catch (e: any) {
      console.error("Error deleting factor de frecuencia", e);
      throw new Error(e.message || "Error al eliminar el factor de frecuencia");
    }
  },

  saveUsuarioDependencia: async (vu: any) => {
    if (!supabase) return vu;
    try {
      const { data, error } = await supabase.schema('Sec').from('UsuariosDependencia').upsert({
        IdUsuarioDep: vu.IdUsuarioDep,
        IdVigencia: vu.IdVigencia,
        EntraIdObjectId: vu.EntraIdObjectId,
        IdNodoOrg: vu.IdNodoOrg || null,
        RolFuncional: vu.RolFuncional || 'Funcionario',
        Activo: vu.Activo !== undefined ? vu.Activo : (vu.activo !== undefined ? vu.activo : true)
      }, { onConflict: 'IdUsuarioDep' }).select();
      if (error) throw error;
      return data?.[0] || vu;
    } catch (e: any) {
      console.error("Error saving usuario dependencia", e);
      throw new Error(e.message || "Error al guardar asignación de usuario");
    }
  }
};
