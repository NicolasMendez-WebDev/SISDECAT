import { get, set } from 'idb-keyval';
import { supabase } from '../../lib/supabaseClient';

// Puente local para persistir cargas de trabajo mientras simulamos backend On-premise
// Inicializamos con datos mock, pero guardamos/recuperamos de IndexedDB (o Supabase) en el uso

const STORAGE_KEY = "sdmct_cargas_trabajo";
const SIMULATED_DELAY_MS = 600;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const captureService = {
  // Inicialización (Llama a esto solo una vez al cargar si necesitas poblar el mock inicial)
  initialize: async (initialData: any[]) => {
    await set(STORAGE_KEY, initialData);
  },

  getCargas: async (): Promise<any[]> => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .schema('Ops')
          .from('CargasTrabajo')
          .select('*')
          .eq('Activo', true);
        
        if (!error && data && data.length > 0) {
          // Devuelve datos mapeándolos de DB a las necesidades del UI. En migración total esto reemplazaría lo de IndexedDB.
          return data;
        }
      } catch (e) {
        console.error("Supabase getCargas Error:", e);
      }
    }

    await delay(SIMULATED_DELAY_MS);
    const data = await get(STORAGE_KEY);
    return data || [];
  },

  createCarga: async (
    carga: any,
  ): Promise<any> => {
    if (supabase) {
      try {
        // 1. Resolve IdMapa based on dependencies
        let realIdMapa = 1; // Fallback
        const { data: mapData } = await supabase.schema('Org').from('MapaRelaciones')
          .select('IdMapa')
          .eq('IdVigencia', carga.vigenciaId)
          .eq('IdNodoOrg', carga.dependenciaId)
          .eq('IdNodoProceso', carga.actividadId);
        
        if (mapData && mapData.length > 0) {
           realIdMapa = mapData[0].IdMapa;
        } else {
           console.warn("No real IdMapa found; attempting to insert relation dynamically or fallback depending on constraints.");
           const { data: insMapa } = await supabase.schema('Org').from('MapaRelaciones')
              .insert({
                  IdVigencia: carga.vigenciaId,
                  IdNodoOrg: carga.dependenciaId,
                  IdNodoProceso: carga.actividadId,
                  ObservacionRelacion: 'Actividad'
              }).select('IdMapa');
           if (insMapa && insMapa.length > 0) realIdMapa = insMapa[0].IdMapa;
        }

        // 2. Resolve Cargo
        let realIdCargo = 1;
        const targetNivel = carga.rolEjecutor || 'Profesional';
        const { data: cargoData } = await supabase.schema('Org').from('Cargos')
          .select('IdCargo')
          .eq('NivelJerarquico', targetNivel)
          .eq('IdVigencia', carga.vigenciaId)
          .limit(1);
          
        if (cargoData && cargoData.length > 0) {
          realIdCargo = cargoData[0].IdCargo;
        } else {
          // Attempt to create cargo if not exists
          const { data: insCargo } = await supabase.schema('Org').from('Cargos')
            .insert({
              IdVigencia: carga.vigenciaId,
              Denominacion: `Cargo ${targetNivel}`,
              NivelJerarquico: targetNivel,
              Activo: true
            }).select('IdCargo');
          if (insCargo && insCargo.length > 0) realIdCargo = insCargo[0].IdCargo;
        }
        
        // 3. Resolve FactorFrecuencia
        let realIdFactor = 1;
        const targetFreq = carga.frecuencia || 'Diario';
        const { data: factData } = await supabase.schema('Conf').from('FactorFrecuencia')
           .select('IdFactor')
           .eq('Nombre', targetFreq)
           .eq('IdVigencia', carga.vigenciaId)
           .limit(1);
        if (factData && factData.length > 0) {
           realIdFactor = factData[0].IdFactor;
        } else {
           const { data: insFact } = await supabase.schema('Conf').from('FactorFrecuencia')
             .insert({
                IdVigencia: carga.vigenciaId,
                Nombre: targetFreq,
                FactorMensual: 19, // fallback
                EsSistema: true
             }).select('IdFactor');
           if (insFact && insFact.length > 0) realIdFactor = insFact[0].IdFactor;
        }

        const payload = {
            IdVigencia: carga.vigenciaId,
            IdMapa: realIdMapa,
            IdCargoEjecutor: realIdCargo, 
            IdFactorFrecuencia: realIdFactor,
            Volumen: carga.volumenQ,
            UnidadTiempoInput: (carga.unidadTiempo || 'minutos').toLowerCase(),
            Tmin_Horas: carga.tiempoMin,
            Tnorm_Horas: carga.tiempoNormal,
            Tmax_Horas: carga.tiempoMax,
            CreatedBy: carga.usuarioId || 'Sistema',
            Activo: true
         };
         console.log("Supabase insert CargasTrabajo Payload:", payload);
         
        const { data, error } = await supabase
          .schema('Ops')
          .from('CargasTrabajo')
          .insert(payload)
          .select();
        
        if (!error && data && data.length > 0) {
          return data[0]; // Retorna la fila
        } else {
          console.error("Supabase Insert Error:", error);
          throw new Error(error?.message || "Error al insertar en DB");
        }
      } catch (e: any) {
        console.error("Supabase Insert Exception:", e);
        throw e; // Throw so frontend sees it instead of falling back seamlessly!
      }
    }

    throw new Error("No hay conexión a base de datos real (Simulación desactivada).");
  },

  updateCarga: async (id: string, updates: Partial<any>): Promise<any> => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .schema('Ops')
          .from('CargasTrabajo')
          .update({ 
             Volumen: updates.volumenQ, 
             UpdatedBy: updates.usuarioId || 'Sistema' 
          })
          .eq('IdCarga', id)
          .select();

        if (!error && data && data.length > 0) {
          return data[0];
        } else {
          console.error("Supabase Update Error:", error);
        }
      } catch (e) {
        console.error("Supabase Update Exception:", e);
      }
    }

    await delay(SIMULATED_DELAY_MS);
    let existing = await get(STORAGE_KEY);
    if (!existing) existing = [];
    const index = existing.findIndex((c: any) => c.id === id);
    if (index === -1) throw new Error("Carga de trabajo no encontrada");

    const updated = {
      ...existing[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    existing[index] = updated;
    await set(STORAGE_KEY, existing);

    return updated;
  },

  deleteCarga: async (id: string): Promise<void> => {
    if (supabase) {
      try {
         await supabase
          .schema('Ops')
          .from('CargasTrabajo')
          .update({ Activo: false })
          .eq('IdCarga', id);
      } catch (e) {
         console.error("Supabase Delete Exception:", e);
      }
    }

    await delay(SIMULATED_DELAY_MS);
    let existing = await get(STORAGE_KEY);
    if (!existing) existing = [];
    const filtered = existing.filter((c: any) => c.id !== id);
    await set(STORAGE_KEY, filtered);
  },
};
