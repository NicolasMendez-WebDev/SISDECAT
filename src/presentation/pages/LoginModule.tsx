import React, { useState } from "react";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User as UserType } from "../../domain/models/types";
import { Logo } from "../components/shared/Logo";
import logoImg from "../../assets/images/regenerated_image_1779288798044.png";
import { AuthService } from "../../application/services/AuthService";

export function Login({ onLogin, usuarios = [] }: { onLogin: (user: UserType, remember?: boolean) => void, usuarios?: UserType[] }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [viewState, setViewState] = useState<"login" | "forgot" | "register">("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regName, setRegName] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const emailInput = username.trim().toLowerCase();
      const pwdInput = password.trim();
      
      if (!emailInput) throw new Error("Ingrese un usuario");
      if (!pwdInput) throw new Error("Ingrese su contraseña");

      const loggedUser = await AuthService.login(emailInput, pwdInput, usuarios);
      onLogin(loggedUser, rememberMe);
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const emailInput = regEmail.trim().toLowerCase();
      const pwdInput = regPassword.trim();
      const nameInput = regName.trim();
      
      if (!emailInput || !emailInput.includes('@')) throw new Error("Ingrese un correo válido");
      if (!pwdInput || pwdInput.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");
      if (!nameInput) throw new Error("Ingrese su nombre");

      const newUser = await AuthService.register(emailInput, pwdInput, nameInput);
      setSuccessMessage("Registro exitoso. Iniciando sesión...");
      setTimeout(() => {
        onLogin(newUser, true);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Error al registrarse");
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!forgotEmail.includes("@")) {
      setIsLoading(false);
      setError("Por favor, ingrese un correo electrónico válido.");
      return;
    }

    // Verificar si el usuario existe antes de intentar recuperar
    const emailToCheck = forgotEmail.trim().toLowerCase();
    if (!usuarios.some((u) => u.email.toLowerCase() === emailToCheck)) {
      setIsLoading(false);
      setError("El correo ingresado no se encuentra registrado en el sistema. Verifique su cuenta o solicite ayuda al administrador.");
      return;
    }

    try {
      await AuthService.resetPassword(emailToCheck);
      setSuccessMessage(
        "Se han enviado las instrucciones de recuperación a su correo electrónico.",
      );
      setTimeout(() => {
        setViewState("login");
        setSuccessMessage(null);
        setForgotEmail("");
      }, 4000);
    } catch (err: any) {
      setError(err.message || "Error al solicitar recuperación");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 w-full h-2 bg-institutional-blue"></div>

      {/* Main Container */}
      <div className="flex-1 w-full max-w-md mx-auto px-6 flex flex-col justify-center z-10 min-h-0">
        {/* Logos Area */}
        <div className="flex flex-col items-center mb-4">
          <div className="h-32 sm:h-48 w-auto flex items-center justify-center p-2 overflow-hidden relative">
            <img
              src={logoImg}
              alt="Gobernación de Antioquia"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <div className="w-full h-px bg-slate-200 my-4 mb-6"></div>

        <h1 className="text-2xl font-light text-institutional-blue text-center mb-6 tracking-wide">
          Ingreso al Sistema
        </h1>

        <AnimatePresence mode="wait">
          {viewState === "login" ? (
            <motion.form
              key="login-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              {/* Username Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Correo / Usuario"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-institutional-blue focus:ring-2 focus:ring-institutional-blue/20 outline-none transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  readOnly={isLoading}
                />
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-slate-400">
                  <User size={18} />
                </div>
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  className="w-full pl-12 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-institutional-blue focus:ring-2 focus:ring-institutional-blue/20 outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  readOnly={isLoading}
                />
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-slate-400">
                  <Lock size={18} />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Recordarme and forgot password inline */}
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-institutional-blue focus:ring-institutional-blue/20 border-slate-200 rounded cursor-pointer accent-institutional-blue"
                    disabled={isLoading}
                  />
                  <label 
                    htmlFor="rememberMe" 
                    className="text-xs text-slate-500 font-medium select-none cursor-pointer hover:text-slate-700 transition-colors"
                  >
                    Recordarme
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setViewState("forgot")}
                  className="text-xs text-slate-500 hover:text-institutional-blue transition-colors font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Register link centered below */}
              <div className="flex justify-center pt-1 text-xs text-slate-500">
                <span>¿No tienes cuenta?&nbsp;</span>
                <button
                  type="button"
                  onClick={() => setViewState("register")}
                  className="text-institutional-blue underline hover:text-institutional-blue/80 transition-colors font-bold"
                >
                  Regístrate
                </button>
              </div>

              {/* Error and Success Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 bg-red-50 border border-red-100 rounded-sm flex items-start gap-2 text-red-600">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <p className="text-xs">{error}</p>
                    </div>
                  </motion.div>
                )}
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-sm flex items-start gap-2 text-emerald-600">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                      <p className="text-xs">{successMessage}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login Button */}
              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  disabled={isLoading || !username || !password}
                  className="bg-institutional-blue hover:bg-institutional-blue/90 active:bg-institutional-blue/80 text-white px-10 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : null}
                  <span>Ingreso</span>
                </button>
              </div>
            </motion.form>
          ) : viewState === "forgot" ? (
            <motion.form
              key="forgot-password-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleForgotPassword}
              className="space-y-5"
            >
              <div className="mb-4">
                <p className="text-sm text-slate-600 text-center mb-6">
                  Ingrese su correo electrónico institucional para recibir un
                  enlace de recuperación.
                </p>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Correo de recuperación"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-institutional-blue focus:ring-2 focus:ring-institutional-blue/20 outline-none transition-all"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    readOnly={isLoading}
                  />
                  <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-slate-400">
                    <Mail size={18} />
                  </div>
                </div>
              </div>

              {/* Error and Success Messages */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 bg-red-50 border border-red-100 rounded-sm flex items-start gap-2 text-red-600">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <p className="text-xs">{error}</p>
                    </div>
                  </motion.div>
                )}
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-sm flex items-start gap-2 text-emerald-600">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                      <p className="text-xs">{successMessage}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading || !forgotEmail}
                  className="bg-institutional-blue hover:bg-institutional-blue/90 active:bg-institutional-blue/80 text-white px-10 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm w-full md:w-auto justify-center"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : null}
                  <span>Enviar recuperación</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewState("login")}
                  disabled={isLoading}
                  className="text-xs text-slate-500 hover:text-slate-700 transition-colors mt-2"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </motion.form>
          ) : viewState === "register" ? (
            <motion.form
              key="register-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleRegister}
              className="space-y-4"
            >
              {/* Name Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nombre completo"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-institutional-blue focus:ring-2 focus:ring-institutional-blue/20 outline-none transition-all"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  readOnly={isLoading}
                />
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-slate-400">
                  <User size={18} />
                </div>
              </div>

              {/* Email Input */}
              <div className="relative">
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-institutional-blue focus:ring-2 focus:ring-institutional-blue/20 outline-none transition-all"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  readOnly={isLoading}
                />
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-slate-400">
                  <Mail size={18} />
                </div>
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  className="w-full pl-12 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-institutional-blue focus:ring-2 focus:ring-institutional-blue/20 outline-none transition-all"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  readOnly={isLoading}
                />
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-slate-400">
                  <Lock size={18} />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Error and Success Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 bg-red-50 border border-red-100 rounded-sm flex items-start gap-2 text-red-600">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <p className="text-xs">{error}</p>
                    </div>
                  </motion.div>
                )}
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-sm flex items-start gap-2 text-emerald-600">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                      <p className="text-xs">{successMessage}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="flex flex-col items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading || !regEmail || !regPassword || !regName}
                  className="bg-institutional-blue hover:bg-institutional-blue/90 active:bg-institutional-blue/80 text-white px-10 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm w-full md:w-auto justify-center"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                  <span>Registrar Cuenta</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewState("login")}
                  disabled={isLoading}
                  className="text-xs text-slate-500 hover:text-slate-700 transition-colors mt-2"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </motion.form>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Footer Area */}
      <div className="w-full shrink-0 pb-6 pt-4">
        <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-center text-xs text-slate-800 px-8 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center text-institutional-blue">
              <Logo className="w-24 h-24" />
              <div className="flex flex-col ml-3 leading-none text-left tracking-tight">
                <span className="text-xl font-bold">SISDECAT</span>
                <span className="text-[10px] font-medium text-slate-500 mt-1 max-w-[130px]">
                  Sistema digital para la medición de cargas de trabajo.
                </span>
              </div>
            </div>
          </div>

          <div className="w-px h-12 bg-slate-200 hidden md:block"></div>

          <div className="flex flex-col leading-relaxed font-medium justify-center text-slate-500 text-left">
            <span>Medellín, Colombia</span>
            <span className="text-slate-400 font-normal">v0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
