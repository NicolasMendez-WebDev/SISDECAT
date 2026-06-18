import { supabase } from '../../lib/supabaseClient';
import { calculateETP } from '../utils/calculations';

import { DatabaseService } from './DatabaseService';

export const captureService = {
  // Inicialización no needed anymore.
  initialize: async () => {},

  getCargas: async (): Promise<any[]> => {
    if (!supabase) return [];
    
    // We fetch from Ops.CargasTrabajo
    const cargasData = await DatabaseService.getCargasTrabajo();

    const mapas = await DatabaseService.getMapaRelaciones();
    const cargos = await DatabaseService.getCargos();
    const factores = await DatabaseService.getFactoresFrecuencia();
    const procTreeRaw = await DatabaseService.getEstructuraProc();
    const orgTreeRaw = await DatabaseService.getEstructuraOrg();

    // 1. Normalize procTree with casing tolerance and run self-healing levels
    const procTree = (procTreeRaw || []).map((x: any) => {
      const id = x.IdNodoProceso || x.id_nodo_proceso || x.idnodoproceso || x.id;
      const padreId = x.IdPadre || x.id_padre || x.idpadre || x.padreId || null;
      const cleanPadreId = (padreId && String(padreId).toLowerCase().trim() !== 'n/a' && String(padreId).trim() !== '') ? padreId : null;
      const originalNivel = x.Nivel !== undefined ? Number(x.Nivel) : (x.nivel !== undefined ? Number(x.nivel) : (x.level !== undefined ? Number(x.level) : 2));
      
      return {
        ...x,
        IdNodoProceso: id,
        IdPadre: cleanPadreId,
        originalNivel,
        Nivel: originalNivel
      };
    });

    const nodeMap = new Map<string, any>();
    procTree.forEach((node) => {
      if (node.IdNodoProceso) {
        nodeMap.set(String(node.IdNodoProceso).toLowerCase().trim(), node);
      }
    });

    const resolvedLevels = new Map<string, number>();
    const getCorrectedLevel = (nodeId: string): number => {
      const nodeIdStr = String(nodeId).toLowerCase().trim();
      if (resolvedLevels.has(nodeIdStr)) return resolvedLevels.get(nodeIdStr)!;

      const n = nodeMap.get(nodeIdStr);
      if (!n) return 2; // Fallback

      if (!n.IdPadre || n.IdPadre === n.IdNodoProceso) {
        let lvl = n.originalNivel;
        // Under current business rules, top level is always Proceso (level 2) - no more level 1 groups!
        if (lvl <= 2 || lvl > 4) lvl = 2;
        resolvedLevels.set(nodeIdStr, lvl);
        return lvl;
      }

      const parentLevel = getCorrectedLevel(n.IdPadre);
      let resolvedLvl = parentLevel + 1;
      if (resolvedLvl > 4) resolvedLvl = 4;
      resolvedLevels.set(nodeIdStr, resolvedLvl);
      return resolvedLvl;
    };

    procTree.forEach((node) => {
      if (node.IdNodoProceso) {
        node.Nivel = getCorrectedLevel(node.IdNodoProceso);
      }
    });

    // 2. Normalize orgTree with casing tolerance
    const orgTree = (orgTreeRaw || []).map((x: any) => {
      const id = x.IdNodoOrg || x.id_nodo_org || x.idnodoorg || x.id;
      const padreId = x.IdPadre || x.id_padre || x.idpadre || x.parentId || null;
      const cleanPadreId = (padreId && String(padreId).toLowerCase().trim() !== 'n/a' && String(padreId).trim() !== '') ? padreId : null;
      const nivel = x.Nivel !== undefined ? Number(x.Nivel) : (x.nivel !== undefined ? Number(x.nivel) : (x.level !== undefined ? Number(x.level) : (cleanPadreId ? 2 : 1)));
      
      return {
        ...x,
        IdNodoOrg: id,
        IdPadre: cleanPadreId,
        Nivel: nivel
      };
    });

    // Map backend rows to frontend expected format
    return (cargasData || []).filter(row => row.Activo !== false).map(row => {
       const mapa = mapas?.find(m => (m.IdMapa || m.id) === row.IdMapa);
       const cargo = cargos?.find(c => (c.IdCargo || c.id) === row.IdCargoEjecutor);
       const factor = factores?.find(f => (f.IdFactor || f.id) === row.IdFactorFrecuencia);

       const mappedNodoProceso = mapa?.IdNodoProceso || mapa?.id_nodo_proceso || mapa?.idnodoproceso || mapa?.id;
       
       const currDesc = row.Descripcion || row.descripcion;
       const isNoDoc = Boolean(currDesc);
       
       let actividadId = mappedNodoProceso || "actividad_no_documentada";
       let actNode = procTree?.find(p => String(p.IdNodoProceso).toLowerCase().trim() === String(actividadId).toLowerCase().trim());
       let pcdNode = procTree?.find(p => String(p.IdNodoProceso).toLowerCase().trim() === String(actNode?.IdPadre).toLowerCase().trim());
       let procNode = procTree?.find(p => String(p.IdNodoProceso).toLowerCase().trim() === String(pcdNode?.IdPadre).toLowerCase().trim());

       if (isNoDoc) {
           actividadId = "actividad_no_documentada";
           let currProcNode = procTree?.find(p => String(p.IdNodoProceso).toLowerCase().trim() === String(mappedNodoProceso).toLowerCase().trim());
           if (currProcNode && currProcNode.Nivel >= 4) {
               actNode = currProcNode;
               pcdNode = procTree?.find(p => String(p.IdNodoProceso).toLowerCase().trim() === String(actNode?.IdPadre).toLowerCase().trim());
               procNode = procTree?.find(p => String(p.IdNodoProceso).toLowerCase().trim() === String(pcdNode?.IdPadre).toLowerCase().trim());
           } else if (currProcNode && currProcNode.Nivel === 3) {
               pcdNode = currProcNode;
               procNode = procTree?.find(p => String(p.IdNodoProceso).toLowerCase().trim() === String(pcdNode?.IdPadre).toLowerCase().trim());
               actNode = undefined;
           } else if (currProcNode && currProcNode.Nivel <= 2) {
               pcdNode = undefined;
               procNode = currProcNode;
               actNode = undefined;
           }
       }

       const dependenciaId = mapa?.IdNodoOrg || mapa?.id_nodo_org || mapa?.idnodoorg || mapa?.parentId || row.IdMapa;
       const depNode = orgTree?.find(o => String(o.IdNodoOrg).toLowerCase().trim() === String(dependenciaId).toLowerCase().trim());
       let currentOrgNode = depNode;
       while (currentOrgNode && currentOrgNode.Nivel > 1 && currentOrgNode.IdPadre) {
         const parent = orgTree?.find(o => String(o.IdNodoOrg).toLowerCase().trim() === String(currentOrgNode?.IdPadre).toLowerCase().trim());
         if (!parent) break;
         currentOrgNode = parent;
       }
       const organismoId = currentOrgNode?.IdNodoOrg || dependenciaId;

       return {
         id: row.IdCarga,
         vigenciaId: row.IdVigencia,
         dependenciaId: dependenciaId,
         organismoId: organismoId,
         procesoId: procNode?.IdNodoProceso,
         procedimientoId: pcdNode?.IdNodoProceso,
         actividadId: actividadId,
         descripcionActividad: currDesc || (actividadId === "actividad_no_documentada" ? 'Actividad no documentada' : undefined),
         rolEjecutor: cargo?.Denominacion || row.IdCargoEjecutor,
         frecuencia: factor?.Nombre || row.IdFactorFrecuencia,
         volumenQ: row.Volumen,
         unidadTiempo: row.UnidadTiempoInput,
         tiempoMin: row.Tmin_Horas,
         tiempoNormal: row.Tnorm_Horas,
         tiempoMax: row.Tmax_Horas,
         autor: row.CreatedBy || row.created_by,
         createdAt: row.CreatedAt || row.created_at,
         auditLog: (() => {
           try {
             return JSON.parse(localStorage.getItem(`audit_${row.IdCarga}`) || '[]');
           } catch(e) { return []; }
         })(),
         _etpCalculated: row.ETP || calculateETP({
           volumenQ: row.Volumen,
           frecuencia: factor?.Nombre || row.IdFactorFrecuencia,
           unidadTiempo: row.UnidadTiempoInput,
           tiempoMin: row.Tmin_Horas,
           tiempoNormal: row.Tnorm_Horas,
           tiempoMax: row.Tmax_Horas,
         }),
       };
    });
  },

  createCarga: async (carga: any): Promise<any> => {
    if (!supabase) throw new Error("Supabase client is not available.");
    try {
      // 1. Resolve IdMapa based on dependencies (Vigencia + NodoOrg + NodoProceso)
      let realIdMapa = null;
      const isNoDocumentada = carga.actividadId === "actividad_no_documentada";
      const queryIdNodoProceso = isNoDocumentada ? (carga.procedimientoId || carga.procesoId) : carga.actividadId;
      console.log("Resolving mapa for:", carga);
      
      if (!queryIdNodoProceso) {
          throw new Error("No process or procedure provided for undocumented activity mapping.");
      }

      let mapQuery = supabase.schema('Org').from('MapaRelaciones')
        .select('IdMapa')
        .eq('IdVigencia', carga.vigenciaId)
        .eq('IdNodoOrg', carga.dependenciaId)
        .eq('IdNodoProceso', queryIdNodoProceso);
        
      const { data: mapData, error: mapErr } = await mapQuery;
      
      if (mapData && mapData.length > 0) {
          realIdMapa = mapData[0].IdMapa;
      } else {
          console.warn("No real IdMapa found; creating automatically...");
          const { data: insMapa, error: insErr } = await supabase.schema('Org').from('MapaRelaciones')
            .insert({
                IdVigencia: carga.vigenciaId,
                IdNodoOrg: carga.dependenciaId,
                IdNodoProceso: queryIdNodoProceso,
                ObservacionRelacion: 'Actividad - Autogenerado'
            }).select('IdMapa');
          if (insErr) throw insErr;
          if (insMapa && insMapa.length > 0) realIdMapa = insMapa[0].IdMapa;
      }

      if (!realIdMapa) throw new Error("No se pudo resolver o crear IdMapa en MapaRelaciones.");

      // 2. Resolve Cargo
      let realIdCargo = null;
      const targetNivel = carga.rolEjecutor || 'Profesional';
      const { data: cargoData } = await supabase.schema('Org').from('Cargos')
        .select('IdCargo')
        .ilike('Denominacion', targetNivel)
        .eq('IdVigencia', carga.vigenciaId)
        .limit(1);
        
      if (cargoData && cargoData.length > 0) {
        realIdCargo = cargoData[0].IdCargo;
      } else {
        const { data: insCargo, error: eC } = await supabase.schema('Org').from('Cargos')
          .insert({
            IdVigencia: carga.vigenciaId,
            Denominacion: targetNivel,
            Activo: true
          }).select('IdCargo');
        if (eC) throw eC;
        if (insCargo && insCargo.length > 0) realIdCargo = insCargo[0].IdCargo;
      }
      
      if (!realIdCargo) throw new Error("No se pudo resolver o crear IdCargo.");

      // 3. Resolve FactorFrecuencia
      let realIdFactor = null;
      const targetFreq = carga.frecuencia || 'diaria';
      const { data: factData } = await supabase.schema('Conf').from('FactoresFrecuencia')
          .select('IdFactor')
          .ilike('Nombre', targetFreq)
          .eq('IdVigencia', carga.vigenciaId)
          .limit(1);
      if (factData && factData.length > 0) {
          realIdFactor = factData[0].IdFactor;
      } else {
          const { data: insFact, error: eF } = await supabase.schema('Conf').from('FactoresFrecuencia')
            .insert({
              IdVigencia: carga.vigenciaId,
              Nombre: targetFreq,
              FactorMensual: targetFreq === 'Diario' || targetFreq === 'Diaria' ? 19 : 1,
              EsSistema: true
            }).select('IdFactor');
          if (eF) throw eF;
          if (insFact && insFact.length > 0) realIdFactor = insFact[0].IdFactor;
      }
      
      if (!realIdFactor) throw new Error("No se pudo resolver o crear IdFactorFrecuencia.");

      const payload: any = {
          IdVigencia: carga.vigenciaId,
          IdMapa: realIdMapa,
          IdCargoEjecutor: realIdCargo, 
          IdFactorFrecuencia: realIdFactor,
          Volumen: parseFloat(carga.volumenQ),
          UnidadTiempoInput: (carga.unidadTiempo || 'minutos').charAt(0).toUpperCase() + (carga.unidadTiempo || 'minutos').slice(1).toLowerCase(),
          Tmin_Horas: parseFloat(carga.tiempoMin || '0'),
          Tnorm_Horas: parseFloat(carga.tiempoNormal || '0'),
          Tmax_Horas: parseFloat(carga.tiempoMax || '0'),
          CreatedBy: carga.autor || carga.userId || 'Sistema',
          Activo: true
      };

      if (isNoDocumentada && carga.descripcionActividad) {
          payload.Descripcion = carga.descripcionActividad;
      }
      
      const { data, error } = await supabase
        .schema('Ops')
        .from('CargasTrabajo')
        .insert(payload)
        .select();
      
      if (error) {
        console.error("Supabase Insert Error:", error);
        throw error;
      }
      
      if (data && data.length > 0) {
        return {
           ...carga,
           id: data[0].IdCarga,
           _dbRow: data[0]
        };
      } 
      
      throw new Error("Sin respuesta de Supabase tras insertar Carga.");
    } catch (e: any) {
      console.error("Supabase Insert Exception:", e);
      throw e; 
    }
  },

  updateCarga: async (id: string, updates: Partial<any>): Promise<any> => {
    if (!supabase) throw new Error("Supabase client is not available.");
    
    let realIdFactor = null;
    if (updates.frecuencia) {
        const targetFreq = updates.frecuencia;
        const targetVig = updates.vigenciaId || updates.IdVigencia;
        const { data: dbFactores, error: efq } = await supabase.schema('Conf').from('FactoresFrecuencia').select('*').eq('IdVigencia', targetVig);
        if (!efq && dbFactores && dbFactores.length > 0) {
            const factorMatch = dbFactores.find(f => f.Nombre.toLowerCase() === targetFreq.toLowerCase());
            if (factorMatch) {
              realIdFactor = factorMatch.IdFactor;
            } else {
              const { data: insFact, error: eF } = await supabase.schema('Conf').from('FactoresFrecuencia')
                .insert({
                  IdVigencia: targetVig,
                  Nombre: targetFreq,
                  FactorMensual: targetFreq === 'Diario' || targetFreq === 'Diaria' ? 19 : 1,
                  EsSistema: true
                }).select('IdFactor');
              if (!eF && insFact && insFact.length > 0) realIdFactor = insFact[0].IdFactor;
            }
        }
    }

    const payloadToUpdate: any = { 
        UpdatedBy: updates.autor || updates.userId || 'Sistema' 
    };

    if (updates.volumenQ !== undefined) payloadToUpdate.Volumen = parseFloat(updates.volumenQ);
    if (updates.tiempoMin !== undefined) payloadToUpdate.Tmin_Horas = parseFloat(updates.tiempoMin);
    if (updates.tiempoNormal !== undefined) payloadToUpdate.Tnorm_Horas = parseFloat(updates.tiempoNormal);
    if (updates.tiempoMax !== undefined) payloadToUpdate.Tmax_Horas = parseFloat(updates.tiempoMax);
    if (updates.unidadTiempo !== undefined) payloadToUpdate.UnidadTiempoInput = (updates.unidadTiempo || 'minutos').charAt(0).toUpperCase() + (updates.unidadTiempo || 'minutos').slice(1).toLowerCase();
    
    if (realIdFactor) {
        payloadToUpdate.IdFactorFrecuencia = realIdFactor;
    }

    if (updates.descripcionActividad !== undefined) {
        payloadToUpdate.Descripcion = updates.descripcionActividad;
    }

    if (updates.auditLog) {
        try {
            localStorage.setItem(`audit_${id}`, JSON.stringify(updates.auditLog));
        } catch(e) {}
    }

    const { data, error } = await supabase
      .schema('Ops')
      .from('CargasTrabajo')
      .update(payloadToUpdate)
      .eq('IdCarga', id)
      .select();

    if (error) throw error;
    if (data && data.length > 0) {
       return {
          ...updates,
          id: data[0].IdCarga,
          _dbRow: data[0]
       };
    }
    throw new Error("No se pudo actualizar la carga.");
  },

  deleteCarga: async (id: string): Promise<void> => {
    if (!supabase) throw new Error("Supabase client is not available.");
    const { error } = await supabase
      .schema('Ops')
      .from('CargasTrabajo')
      .update({ Activo: false })
      .eq('IdCarga', id);
    if (error) throw error;
  },
};
