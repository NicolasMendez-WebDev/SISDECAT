import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.log("No Supabase configuration in process.env");
} else {
  const supabase = createClient(url, key);
  
  async function check() {
    const { data: users, error: error1 } = await supabase.schema('Sec').from('UsuariosOrganismos').select('*');
    if (error1) {
      console.error("Error fetching users:", error1);
    } else {
      console.log("USERS_TOTAL:", users.length);
      console.log("UPNS:", users.map(u => ({ EntraIdObjectId: u.EntraIdObjectId, UPN: u.UPN, RolFuncional: u.RolFuncional, IdNodoOrg: u.IdNodoOrg })));
    }
  }
  check();
}
