import { get, set } from 'idb-keyval';

// Puente local para persistir cargas de trabajo mientras simulamos backend On-premise
// Inicializamos con datos mock, pero guardamos/recuperamos de IndexedDB en el uso

const STORAGE_KEY = "sdmct_cargas_trabajo";
const SIMULATED_DELAY_MS = 600;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const captureService = {
  // Inicialización (Llama a esto solo una vez al cargar si necesitas poblar el mock inicial)
  initialize: async (initialData: any[]) => {
    await set(STORAGE_KEY, initialData);
  },

  getCargas: async (): Promise<any[]> => {
    await delay(SIMULATED_DELAY_MS);
    const data = await get(STORAGE_KEY);
    return data || [];
  },

  createCarga: async (
    carga: Omit<any, "id" | "createdAt" | "updatedAt">,
  ): Promise<any> => {
    await delay(SIMULATED_DELAY_MS);
    const newCarga = {
      ...carga,
      id: `CRG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existing = await captureService.getCargas();
    existing.push(newCarga);
    await set(STORAGE_KEY, existing);

    return newCarga;
  },

  updateCarga: async (id: string, updates: Partial<any>): Promise<any> => {
    await delay(SIMULATED_DELAY_MS);
    const existing = await captureService.getCargas();
    const index = existing.findIndex((c) => c.id === id);
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
    await delay(SIMULATED_DELAY_MS);
    const existing = await captureService.getCargas();
    const filtered = existing.filter((c) => c.id !== id);
    await set(STORAGE_KEY, filtered);
  },
};
