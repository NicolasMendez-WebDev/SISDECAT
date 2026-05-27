import { supabase } from './supabaseClient';
import { User as UserType } from '../../domain/models/types';

// Use LocalStorage as a fallback DB for the first phase of testing
const LOCAL_USERS_KEY = 'sisdecat_local_users';

interface LocalUser {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  passwordHash: string; // In a real app never store passwords plainly, but this is a local mock
}

const getLocalUsers = (): LocalUser[] => {
  const data = localStorage.getItem(LOCAL_USERS_KEY);
  return data ? JSON.parse(data) : [];
};

const saveLocalUsers = (users: LocalUser[]) => {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
};

export const AuthService = {
  async register(email: string, password: string, nombre: string): Promise<UserType> {
    if (supabase) {
      // Logic inside Supabase should ideally assign role using triggers or functions 
      // but for now, we pass it in metadata if we want. It's safer to just let it be Funcionario unless it's the first.
      const { data: usersData } = await supabase.schema('Sec').from('UsuariosDependencia').select('IdUsuarioDep', { count: 'exact', head: true });
      const isFirstUser = usersData === null || usersData === undefined || usersData.length === 0; // rough proxy
      const assignedRole = isFirstUser ? 'AdminFuncional' : 'Funcionario';

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: nombre,
            rol: assignedRole
          }
        }
      });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("Error en el registro");
      
      return {
        id: data.user.id,
        nombre: data.user.user_metadata?.full_name || nombre,
        email: data.user.email!,
        rol: data.user.user_metadata?.rol || assignedRole
      };
    } else {
      // Mock Local Storage Auth
      const users = getLocalUsers();
      if (users.find(u => u.email === email)) {
        throw new Error("El correo ya está registrado.");
      }
      
      const isFirstUser = users.length === 0;
      const assignedRole = isFirstUser ? 'AdminFuncional' : 'Funcionario';

      const newUser: LocalUser = {
        id: `USR-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        email,
        nombre,
        rol: assignedRole,
        passwordHash: btoa(password), // simple mock hash
      };
      saveLocalUsers([...users, newUser]);

      return {
        id: newUser.id,
        nombre: newUser.nombre,
        email: newUser.email,
        rol: newUser.rol as any
      };
    }
  },

  async login(email: string, password: string, globalUsers: UserType[]): Promise<UserType> {
    // Backdoor for developer testing ONLY in dev
    if (!import.meta.env.PROD && (email === "desarrollador" || email === "admin")) {
      if (password === "admin123") {
        return {
          id: "USR-DEV",
          nombre: "Desarrollador SISDECAT",
          rol: "AdminFuncional",
          email: "dev@sisdecat.gov.co",
        };
      } else {
        throw new Error("Contraseña incorrecta (Sugerencia dev: admin123)");
      }
    }

    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw new Error("Credenciales incorrectas (Supabase)");
      if (!data.user) throw new Error("Error al consultar el usuario");
      
      return {
        id: data.user.id,
        nombre: data.user.user_metadata?.full_name || email.split('@')[0],
        email: data.user.email!,
        rol: data.user.user_metadata?.rol || 'Funcionario'
      };
    } else {
      // Mock Auth via LocalStorage
      const users = getLocalUsers();
      const match = users.find(u => u.email === email && atob(u.passwordHash) === password);
      
      if (!match) {
        throw new Error("Usuario o contraseña incorrectos. Por favor, regístrese.");
      }
      
      return {
        id: match.id,
        nombre: match.nombre,
        email: match.email,
        rol: match.rol as any
      };
    }
  },

  async changePassword(email: string, oldPassword: string, newPassword: string): Promise<boolean> {
    if (supabase) {
        // Technically supabase user session is needed to update user
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) throw new Error(error.message);
        return true;
    } else {
       const users = getLocalUsers();
       const userIdx = users.findIndex(u => u.email === email && atob(u.passwordHash) === oldPassword);
       if (userIdx === -1) {
           throw new Error("La contraseña actual es incorrecta.");
       }
       users[userIdx].passwordHash = btoa(newPassword);
       saveLocalUsers(users);
       return true;
    }
  }
};
