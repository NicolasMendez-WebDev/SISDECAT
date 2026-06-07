import React, { useState } from 'react';
import { ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface ResetPasswordModuleProps {
  onPasswordReset: () => void;
  onCancel: () => void;
}

export const ResetPasswordModule: React.FC<ResetPasswordModuleProps> = ({ onPasswordReset, onCancel }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);

    try {
      if (supabase) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (error) throw error;
        
        setSuccess(true);
        setTimeout(() => {
          onPasswordReset();
        }, 3000);
      } else {
        throw new Error('Servicio de autenticación no disponible');
      }
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans text-slate-800">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="h-2 w-full bg-institutional-blue"></div>
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <ShieldAlert className="text-institutional-blue w-8 h-8" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">
            Restablecer Contraseña
          </h2>
          <p className="text-center text-slate-500 mb-8 text-sm">
            Ingrese su nueva contraseña para continuar accediendo al sistema SISDECAT.
          </p>

          {success ? (
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 flex items-center gap-3 text-sm animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p>¡Contraseña actualizada exitosamente! Redirigiendo...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm border border-red-100 animate-fade-in break-words">
                  {error}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700">Nueva Contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue transition-all"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700">Confirmar Contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue transition-all"
                  placeholder="Confirme su nueva contraseña"
                  minLength={6}
                  required
                />
              </div>

              <div className="pt-4 space-y-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-institutional-blue hover:bg-institutional-blue/90 text-white font-semibold rounded-lg text-sm transition-all shadow-sm flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                  {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="w-full py-3 bg-white text-slate-600 font-semibold rounded-lg text-sm border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
