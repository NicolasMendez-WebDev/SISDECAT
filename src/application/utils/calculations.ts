export const CALC_CONFIG = {
  TS_FATIGA: 0.07,
  HORAS_EFECTIVAS_MES: 167.2,
  JORNADA_DIARIA: 8.8,
  MATRIZ_TIEMPOS: {
    seg: 0.000277,
    min: 0.016666,
    minutos: 0.016666,
    hor: 1,
    horas: 1,
    dias: 8.8,
    "días": 8.8,
  },
  MATRIZ_FRECUENCIAS: {
    diaria: 19,
    semanal: 4,
    quincenal: 2,
    mensual: 1,
    bimestral: 0.5,
    trimestral: 0.3333,
    semestral: 0.1666,
    anual: 0.083,
  }
};

export const calculateETP = (formData: any) => {
  const { volumenQ, frecuencia, unidadTiempo, tiempoMin, tiempoNormal, tiempoMax } = formData;
  
  const vol = parseFloat(volumenQ) || 0;
  const tm = parseFloat(tiempoMin) || 0;
  const tn = parseFloat(tiempoNormal) || 0;
  const tM = parseFloat(tiempoMax) || 0;
  
  const uTiempoStr = String(unidadTiempo || '').toLowerCase();
  const freqStr = String(frecuencia || '').toLowerCase();

  const timeFactor = CALC_CONFIG.MATRIZ_TIEMPOS[uTiempoStr as keyof typeof CALC_CONFIG.MATRIZ_TIEMPOS] || 0;
  const freqFactor = CALC_CONFIG.MATRIZ_FRECUENCIAS[freqStr as keyof typeof CALC_CONFIG.MATRIZ_FRECUENCIAS] || 0;
  
  if ((unidadTiempo && timeFactor === 0) || (frecuencia && freqFactor === 0)) {
    console.warn('calculateETP missing factor: ', { unidadTiempo, uTiempoStr, timeFactor, frecuencia, freqStr, freqFactor });
  }

  // 1. Convert to hours
  const tmH = tm * timeFactor;
  const tnH = tn * timeFactor;
  const tMH = tM * timeFactor;
  
  // 2. TR = (Tm + 4*TN + TM) / 6
  const TR = (tmH + (4 * tnH) + tMH) / 6;
  
  // 3. TE = TR * (1 + TS)
  const TE = TR * (1 + CALC_CONFIG.TS_FATIGA);
  
  // 4. CTM = TE * Volumen * Factor_Frecuencia_Mes
  const CTM = TE * vol * freqFactor;
  
  // 5. ETP = CTM / Horas_Efectivas_Mes
  const ETP = CTM / CALC_CONFIG.HORAS_EFECTIVAS_MES;
  
  return {
    TR,
    TE,
    CTM,
    ETP
  };
};

