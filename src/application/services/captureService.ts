import { supabase } from '../../lib/supabaseClient';

export const captureService = {
  // Inicialización no needed anymore.
  initialize: async () => {},

  getCargas: async (): Promise<any[]> => {
    if (!supabase) return [];
    
    // We fetch from Ops.CargasTrabajo
    const { data, error } = await supabase
      .schema('Ops')
      .from('CargasTrabajo')
      .select('*')
      .eq('Activo', true);
    
    if (error) {
      console.error("Supabase getCargas Error:", error);
      throw error;
    }
    
    // Map backend rows to frontend expected format
    return (data || []).map(row => ({
       id: row.IdCarga,
       vigenciaId: row.IdVigencia,
       dependenciaId: row.IdMapa, // We need to resolve this correctly if needed by the frontend, but let's keep it simple. Actually, we should join MapaRelaciones.
       // However, to keep compatibility with the App's mock, they mapped directly.
       // The app uses `c.vigenciaId`, etc. We'll return raw for now and let the frontend adapt, or adapt here:
       rolEjecutor: row.IdCargoEjecutor,
       frecuencia: row.IdFactorFrecuencia,
       volumenQ: row.Volumen,
       unidadTiempo: row.UnidadTiempoInput,
       tiempoMin: row.Tmin_Horas,
       tiempoNormal: row.Tnorm_Horas,
       tiempoMax: row.Tmax_Horas,
       // we should ideally join to get these text values, but for now just pass IDs.
       _etpCalculated: row.ETP,
    }));
  },

  createCarga: async (carga: any): Promise<any> => {
    if (!supabase) throw new Error("Supabase client is not available.");
    try {
      // 1. Resolve IdMapa based on dependencies (Vigencia + NodoOrg + NodoProceso)
      let realIdMapa = null;
      console.log("Resolving mapa for:", carga);
      const { data: mapData, error: mapErr } = await supabase.schema('Org').from('MapaRelaciones')
        .select('IdMapa')
        .eq('IdVigencia', carga.vigenciaId)
        .eq('IdNodoOrg', carga.dependenciaId)
        .eq('IdNodoProceso', carga.actividadId);
      
      if (mapData && mapData.length > 0) {
          realIdMapa = mapData[0].IdMapa;
      } else {
          console.warn("No real IdMapa found; creating automatically...");
          const { data: insMapa, error: insErr } = await supabase.schema('Org').from('MapaRelaciones')
            .insert({
                IdVigencia: carga.vigenciaId,
                IdNodoOrg: carga.dependenciaId,
                IdNodoProceso: carga.actividadId,
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
            NivelJerarquico: targetNivel,
            Activo: true
          }).select('IdCargo');
        if (eC) throw eC;
        if (insCargo && insCargo.length > 0) realIdCargo = insCargo[0].IdCargo;
      }
      
      if (!realIdCargo) throw new Error("No se pudo resolver o crear IdCargo.");

      // 3. Resolve FactorFrecuencia
      let realIdFactor = null;
      const targetFreq = carga.frecuencia || 'diaria';
      const { data: factData } = await supabase.schema('Conf').from('FactorFrecuencia')
          .select('IdFactor')
          .ilike('Nombre', targetFreq)
          .eq('IdVigencia', carga.vigenciaId)
          .limit(1);
      if (factData && factData.length > 0) {
          realIdFactor = factData[0].IdFactor;
      } else {
          const { data: insFact, error: eF } = await supabase.schema('Conf').from('FactorFrecuencia')
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

      const payload = {
          IdVigencia: carga.vigenciaId,
          IdMapa: realIdMapa,
          IdCargoEjecutor: realIdCargo, 
          IdFactorFrecuencia: realIdFactor,
          Volumen: parseFloat(carga.volumenQ),
          UnidadTiempoInput: (carga.unidadTiempo || 'minutos').toLowerCase(),
          Tmin_Horas: parseFloat(carga.tiempoMin || '0'),
          Tnorm_Horas: parseFloat(carga.tiempoNormal || '0'),
          Tmax_Horas: parseFloat(carga.tiempoMax || '0'),
          CreatedBy: carga.usuarioId || 'Sistema',
          Activo: true
        };
        console.log("Supabase insert CargasTrabajo Payload:", payload);
        
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
    const { data, error } = await supabase
      .schema('Ops')
      .from('CargasTrabajo')
      .update({ 
          Volumen: updates.volumenQ, 
          UpdatedBy: updates.usuarioId || 'Sistema' 
      })
      .eq('IdCarga', id)
      .select();

    if (error) throw error;
    if (data && data.length > 0) return data[0];
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
