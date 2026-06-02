import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function test() {
  const schemas = ['public', 'Cat', 'Ops', 'Org', 'Conf', 'auth', 'Sec'];
  for (const s of schemas) {
      const { data, error } = await supabase.schema(s).from('EstructuraProcesos').select('*').limit(1);
      console.log(`Schema ${s} -> data: ${data ? data.length : null}, error: ${error?.message || error?.code}`);
  }
}

test();
