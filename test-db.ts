import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function test() {
  const words = ["Minutos", "Horas", "Días", "Dias", "minuto", "hora", "dia", "Minuto", "Hora", "Día", "minutos", "horas", "dias"];
  for (const w of words) {
    const payload = {
        IdVigencia: "test-vigencia",
        IdMapa: 1,
        IdCargoEjecutor: 1, 
        IdFactorFrecuencia: 1,
        Volumen: 1,
        UnidadTiempoInput: w,
        Tmin_Horas: 1,
        Tnorm_Horas: 1,
        Tmax_Horas: 1,
        CreatedBy: 'Sistema',
        Activo: true
    };
    const { error } = await supabase.schema('Ops').from('CargasTrabajo').insert(payload);
    console.log(w, "->", error?.message || "SUCCESS!");
  }
}

test();
