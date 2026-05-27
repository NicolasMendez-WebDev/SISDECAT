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
        const { data, error } = await supabase
          .schema('Ops')
          .from('CargasTrabajo')
          .insert({
            IdVigencia: carga.vigenciaId,
            IdMapa: 1, // TODO: Interceptar o mapear contra el catálogo Ops.MapaRelaciones real
            IdCargoEjecutor: 1, // TODO: Mapear contra catálogo Org.Cargos real
            IdFactorFrecuencia: 1, // TODO: Mapear contra catálogo real
            Volumen: carga.volumenQ,
            UnidadTiempoInput: 'Minutos',
            Tmin_Horas: carga.tiempoMin,
            Tnorm_Horas: carga.tiempoNormal,
            Tmax_Horas: carga.tiempoMax,
            CreatedBy: carga.usuarioId,
          })
          .select();
        
        if (!error && data && data.length > 0) {
          return data[0]; // Retorna la fila con todos los triggers calculados.
        } else {
          console.error("Supabase Insert Error:", error);
        }
      } catch (e) {
        console.error("Supabase Insert Exception:", e);
      }
    }

    await delay(SIMULATED_DELAY_MS);
    const newCarga = {
      ...carga,
      id: `CRG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let existing = await get(STORAGE_KEY);
    if (!existing) existing = [];
    existing.push(newCarga);
    await set(STORAGE_KEY, existing);

    return newCarga;
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
