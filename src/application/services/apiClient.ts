/**
 * Simula un cliente HTTP RESTful (Axios/Fetch wrapper).
 * En el futuro esto apuntará a tu backend On-Premise (Express/NestJS)
 * conectado a SQL Server mediante Active Directory.
 */

// Retraso simulado para representar latencia de red
const SIMULATED_DELAY_MS = 600;

export const apiClient = {
  get: async <T>(url: string, params?: any): Promise<T> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Aquí puedes conectar el Mock
        // resolve(mockData);
        reject(new Error("No implementado aún"));
      }, SIMULATED_DELAY_MS);
    });
  },

  post: async <T>(url: string, data: any): Promise<T> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data } as unknown as T);
      }, SIMULATED_DELAY_MS);
    });
  },

  put: async <T>(url: string, data: any): Promise<T> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data } as unknown as T);
      }, SIMULATED_DELAY_MS);
    });
  },

  delete: async <T>(url: string): Promise<T> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true } as unknown as T);
      }, SIMULATED_DELAY_MS);
    });
  },
};
