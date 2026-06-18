import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function query() {
  const { data: rows, error } = await supabase.schema('Cat').from('EstructuraProcesos').select('*');
  if (error) {
    console.error("Error:", error);
    return;
  }
  console.log("TOTAL ROWS:", rows.length);
  // Log a few rows, especially anything containing "Plan Anual de Adquisiciones" or similar code
  const target = rows.filter(r => r.Nombre.toLowerCase().includes("adquisic") || r.CodigoInterno?.toLowerCase().includes("p6"));
  console.log("MATCHING ROWS:", target.map(t => ({
    IdNodoProceso: t.IdNodoProceso,
    IdVigencia: t.IdVigencia,
    IdPadre: t.IdPadre,
    Nivel: t.Nivel,
    CodigoInterno: t.CodigoInterno,
    Nombre: t.Nombre
  })));
}

query();
