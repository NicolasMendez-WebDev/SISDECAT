import React, { useState } from 'react';
import { User } from '../../domain/models/types';
import { Settings, User as UserIcon, Lock, Bell, Building2, Shield, Mail, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthService } from '../../application/services/AuthService';

interface ConfiguracionModuleProps {
  currentUser: User;
}

export const ConfiguracionModule: React.FC<ConfiguracionModuleProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'perfil' | 'seguridad' | 'notificaciones' | 'sistema'>('perfil');

  // Change Password State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);

  const handlePasswordChange = async () => {
    setPwdError(null);
    setPwdSuccess(null);
    
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPwdError("Todos los campos son requeridos.");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPwdError("La nueva contraseña y la confirmación no coinciden.");
      return;
    }
    if (newPassword.length < 6) {
      setPwdError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setPwdLoading(true);
    try {
      await AuthService.changePassword(currentUser.email, oldPassword, newPassword);
      setPwdSuccess("La contraseña se actualizó correctamente.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwdError(err.message || "No se pudo actualizar la contraseña.");
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>
          <p className="text-slate-500 mt-1">
            Administra tus preferencias personales y opciones del sistema.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Navigation Sidebar */}
          <div className="w-full md:w-64 shrink-0 space-y-1">
            <button
              onClick={() => setActiveTab('perfil')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                activeTab === 'perfil' ? 'bg-institutional-blue text-white font-medium shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UserIcon size={18} />
              <span>Perfil de Usuario</span>
            </button>
            <button
              onClick={() => setActiveTab('seguridad')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                activeTab === 'seguridad' ? 'bg-institutional-blue text-white font-medium shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Lock size={18} />
              <span>Seguridad</span>
            </button>
            {currentUser.rol !== 'Funcionario' && (
              <button
                onClick={() => setActiveTab('notificaciones')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                  activeTab === 'notificaciones' ? 'bg-institutional-blue text-white font-medium shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Bell size={18} />
                <span>Notificaciones</span>
              </button>
            )}
            {['AdminFuncional', 'Administrador'].includes(currentUser.rol) && (
              <button
                onClick={() => setActiveTab('sistema')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left mt-4 border-t border-slate-200 rounded-none rounded-b-xl ${
                  activeTab === 'sistema' ? 'bg-institutional-green text-white font-medium shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Settings size={18} />
                <span>Ajustes del Sistema</span>
              </button>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
            <AnimatePresence mode="wait">
              {activeTab === 'perfil' && (
                <motion.div
                  key="perfil"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-8 space-y-8"
                >
                  <div className="border-b border-slate-100 pb-6">
                    <h2 className="text-xl font-bold text-slate-800">Perfil de Usuario</h2>
                    <p className="text-sm text-slate-500 mt-1">Información de tu cuenta.</p>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-institutional-green text-white rounded-full flex items-center justify-center font-bold text-3xl shadow-sm">
                      {currentUser.nombre.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <button className="px-4 py-2 border border-slate-200 text-slate-600 font-medium text-sm rounded-lg hover:bg-slate-50 transition-colors">
                        Cambiar Avatar
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Nombre Completo</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <UserIcon size={16} className="text-slate-400" />
                        </div>
                        <input
                          type="text"
                          defaultValue={currentUser.nombre}
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Correo Electrónico</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail size={16} className="text-slate-400" />
                        </div>
                        <input
                          type="email"
                          defaultValue={currentUser.email}
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Rol</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Shield size={16} className="text-slate-400" />
                        </div>
                        <input
                          type="text"
                          defaultValue={currentUser.rol}
                          disabled
                          className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button className="px-6 py-2 bg-institutional-blue text-white font-medium rounded-lg hover:bg-institutional-blue/90 transition-colors shadow-sm">
                      Guardar Cambios
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'seguridad' && (
                <motion.div
                  key="seguridad"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-8 space-y-8"
                >
                  <div className="border-b border-slate-100 pb-6">
                    <h2 className="text-xl font-bold text-slate-800">Seguridad</h2>
                    <p className="text-sm text-slate-500 mt-1">Administra tus credenciales y opciones de acceso.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2 max-w-md">
                      <label className="text-sm font-medium text-slate-700">Contraseña Actual *</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue transition-all"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        readOnly={pwdLoading}
                      />
                    </div>
                    
                    <div className="space-y-2 max-w-md">
                      <label className="text-sm font-medium text-slate-700">Nueva Contraseña *</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue transition-all"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        readOnly={pwdLoading}
                      />
                    </div>
                    
                    <div className="space-y-2 max-w-md">
                      <label className="text-sm font-medium text-slate-700">Confirmar Nueva Contraseña *</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue transition-all"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        readOnly={pwdLoading}
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {pwdError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 bg-red-50 border border-red-100 rounded-sm flex items-start gap-2 text-red-600 max-w-md">
                          <AlertCircle size={16} className="mt-0.5 shrink-0" />
                          <p className="text-xs">{pwdError}</p>
                        </div>
                      </motion.div>
                    )}
                    {pwdSuccess && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-sm flex items-start gap-2 text-emerald-600 max-w-md">
                          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                          <p className="text-xs">{pwdSuccess}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex justify-start pt-6 border-t border-slate-100">
                    <button 
                      disabled={pwdLoading}
                      onClick={handlePasswordChange}
                      className="px-6 py-2 bg-institutional-blue disabled:bg-institutional-blue/60 text-white font-medium rounded-lg hover:bg-institutional-blue/90 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      {pwdLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                      Actualizar Contraseña
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notificaciones' && (
                <motion.div
                  key="notificaciones"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-8 space-y-8"
                >
                  <div className="border-b border-slate-100 pb-6">
                    <h2 className="text-xl font-bold text-slate-800">Ajustes de Notificaciones</h2>
                    <p className="text-sm text-slate-500 mt-1">Configura qué eventos quieres recibir por correo.</p>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 text-institutional-blue rounded border-slate-300 focus:ring-institutional-blue" />
                      <div>
                        <div className="font-medium text-slate-800">Modificaciones en Estructura</div>
                        <div className="text-sm text-slate-500 mt-0.5">Recibir alertas cuando se creen o editen organismos, dependencias, etc.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 text-institutional-blue rounded border-slate-300 focus:ring-institutional-blue" />
                      <div>
                        <div className="font-medium text-slate-800">Captura de Cargas</div>
                        <div className="text-sm text-slate-500 mt-0.5">Notificar cuando un usuario termine la captura metodológica de un procedimiento.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <input type="checkbox" className="mt-1 w-4 h-4 text-institutional-blue rounded border-slate-300 focus:ring-institutional-blue" />
                      <div>
                        <div className="font-medium text-slate-800">Alertas de Expiración</div>
                        <div className="text-sm text-slate-500 mt-0.5">Avisos semanales sobre vigencias u objetivos próximos a finalizar.</div>
                      </div>
                    </label>
                  </div>
                </motion.div>
              )}

              {activeTab === 'sistema' && (
                <motion.div
                  key="sistema"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-8 space-y-8"
                >
                  <div className="border-b border-slate-100 pb-6">
                    <h2 className="text-xl font-bold text-slate-800">Ajustes del Sistema</h2>
                    <p className="text-sm text-slate-500 mt-1">Propiedades globales de la plataforma.</p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-800">
                    <AlertCircle size={24} className="shrink-0 text-amber-600" />
                    <div>
                      <h4 className="font-bold text-sm">Área Restringida</h4>
                      <p className="text-sm mt-1">
                        Las configuraciones aquí afectan a todos los usuarios de la plataforma y el comportamiento de cálculo de carga de trabajo.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Días Laborales por Año (Típico: 240)</label>
                      <input
                        type="number"
                        defaultValue={240}
                        className="w-full max-w-xs px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue transition-all"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Horas Laborales por Día (Típico: 8)</label>
                      <input
                        type="number"
                        defaultValue={8}
                        className="w-full max-w-xs px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-start pt-6 border-t border-slate-100">
                    <button className="px-6 py-2 bg-institutional-green text-white font-medium rounded-lg hover:bg-institutional-green/90 transition-colors shadow-sm">
                      Guardar Configuración Global
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
