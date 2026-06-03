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
import logoImg from "../../assets/images/regenerated_image_1779288798044.png";
import { AuthService } from "../../application/services/AuthService";

export function Login({ onLogin, usuarios = [] }: { onLogin: (user: UserType) => void, usuarios?: UserType[] }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [viewState, setViewState] = useState<"login" | "forgot" | "register">("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regName, setRegName] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
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
      onLogin(loggedUser);
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
        onLogin(newUser);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Error al registrarse");
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!forgotEmail.includes("@")) {
      setIsLoading(false);
      setError("Por favor, ingrese un correo electrónico válido.");
      return;
    }

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage(
        "Se han enviado las instrucciones de recuperación a su correo electrónico.",
      );
      setTimeout(() => {
        setViewState("login");
        setSuccessMessage(null);
        setForgotEmail("");
      }, 4000);
    }, 1500);
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

              {/* Links */}
              <div className="flex justify-between items-center px-1">
                <button
                  type="button"
                  onClick={() => setViewState("forgot")}
                  className="text-xs text-slate-500 hover:text-institutional-blue transition-colors font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
                <button
                  type="button"
                  onClick={() => setViewState("register")}
                  className="text-xs text-institutional-blue underline hover:text-institutional-blue/80 transition-colors font-medium"
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
              <svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 shrink-0" preserveAspectRatio="none" viewBox="0 0 2048 2016" display="block">
                <path fill="#2cbb47" d="M 413.511 1655.7 C 347.538 1650.6 292.008 1631.69 240.794 1588.13 C 202.735 1555.76 175.592 1519.54 156.855 1472.89 C 133.534 1414.84 133.86 1354.28 133.874 1292.6 C 133.736 1256.04 134.055 1219.49 134.829 1182.94 C 135.927 1115.4 134.953 1044.82 134.95 977.055 L 134.939 644.431 L 134.937 540.849 C 134.941 509.922 134.548 483.182 136.906 452.384 C 142.837 374.909 179.124 307.207 238.032 257.101 C 280.898 220.639 324.572 201.873 379.829 192.494 C 413.092 186.847 440.943 187.423 474.501 187.414 L 557.667 187.45 L 843.347 187.554 L 1212.78 187.618 L 1328.96 187.594 C 1451.17 187.583 1522.8 191.29 1608.45 292.126 C 1620 305.791 1630.99 319.927 1641.38 334.498 C 1623.66 334.788 1604.89 334.41 1587.4 336.798 C 1484.4 350.864 1403.86 438.804 1404.03 543.577 C 1404.07 572.212 1410.89 597.426 1419.23 624.317 C 1402.8 614.657 1389.27 602.567 1374.14 591.491 C 1337.89 565.098 1304.39 536.065 1273.41 503.587 C 1253.5 482.718 1236.44 458.865 1214.67 439.902 C 1185.08 414.121 1150.12 416.813 1113.74 416.909 L 1049.93 417.082 C 1044.51 404.694 1039.99 394.061 1031.37 383.36 C 998.889 343.066 945.247 354.032 899.528 352.621 C 895.488 338.112 892.631 328.38 885.718 314.819 C 858.969 262.349 797.61 234.693 740.495 250.971 C 707.617 260.464 679.827 282.573 663.186 312.476 C 656.095 325.39 651.455 338.247 647.386 352.353 C 580.473 352.404 525.54 343.401 497.595 417.04 L 445.26 416.982 C 401.082 416.985 367.451 418.57 332.948 452.031 C 300.476 483.522 296.186 522.973 296.124 565.797 L 296.19 1048.29 L 296.136 1182.43 C 296.127 1224.83 294.115 1270.42 303.268 1311.68 C 314.714 1362.35 340.442 1408.68 377.406 1445.19 C 506.747 1574.94 724.837 1631.05 904.102 1630.92 C 1123.64 1630.77 1354.92 1560.09 1514.24 1403.41 C 1587.66 1331.2 1642.05 1240.94 1641.7 1135.38 C 1641.2 985.384 1538.37 854.993 1435.89 755.39 C 1395.27 715.913 1354.49 676.613 1316.41 634.608 C 1298.92 615.312 1280.07 596.188 1264.58 575.083 C 1284.2 589.498 1303.51 606.868 1323.06 621.8 C 1414.53 691.687 1519.3 761.912 1635.02 780.74 C 1794.28 806.654 1847.04 628.684 1824.55 503.962 C 1819.51 475.971 1813.63 451.745 1806.71 424.217 C 1883.61 531.755 1916.77 688.088 1922.96 818.688 C 1925.3 868.039 1923.21 902.366 1914.99 951.456 C 1883.63 1138.82 1780.07 1309.11 1643.11 1438.51 C 1613.59 1466.34 1579.9 1495.76 1546.71 1519.43 C 1322.7 1679.63 1043.96 1743.66 772.492 1697.27 C 771.023 1697.03 769.559 1696.76 768.098 1696.47 L 764.129 1698.82 C 793.378 1708.2 853.73 1717.7 884.283 1721.84 C 1066.61 1746.58 1237.3 1722.81 1406.49 1649.92 C 1636.7 1550.59 1818.43 1364.45 1912.21 1131.93 C 1913.21 1134.32 1913.98 1135.87 1914.45 1138.46 C 1869.15 1372.92 1753.6 1561.65 1554.74 1696.29 C 1512.99 1724.05 1468.82 1748 1422.77 1767.83 C 1246.97 1844.22 1052.13 1865.45 864.005 1828.71 C 749.9 1806.66 635.688 1766.59 537.008 1703.76 C 402.136 1617.9 267.13 1491.67 225.968 1331.68 C 219.777 1307.61 215.494 1283.25 211.662 1258.8 C 210.411 1276.19 211.688 1299.28 213.287 1316.77 C 223.119 1424.33 266.968 1494.55 335.493 1573.83 C 350.91 1591.41 366.962 1608.43 383.615 1624.86 C 391.494 1632.72 407.401 1647.37 413.511 1655.7 z" className="color30b04b svgShape"></path>
                <path fill="#cdfcd6" d="M 740.642 1692.27 C 749.441 1693.06 759.299 1694.98 768.098 1696.47 L 764.129 1698.82 C 756.761 1697.54 747.923 1694.52 740.642 1692.27 z" className="colorcdfcd4 svgShape"></path>
                <path fill="#2cbb47" d="M 764.365 280.384 C 781.053 278.261 802.298 282.137 817.219 290.03 C 839.535 301.686 856.428 321.581 864.311 345.491 C 866.647 352.494 872.14 381.009 878.541 382.553 C 940.149 397.421 1023.05 356.322 1023.42 457.005 C 1023.46 467.376 1024.89 503.161 1020.98 510.314 C 1010.82 514.133 812.183 512.072 783.022 512.102 C 697.502 511.98 609.365 513.551 524.236 512.177 L 524.102 473.909 C 524.053 448.781 522.856 429.446 539.632 407.794 C 566.757 372.786 614.104 390.747 652.031 386.408 C 656.31 386.864 671.973 384.127 673.8 379.757 C 683.58 356.359 682.713 336.183 700.663 315.607 C 719.293 294.253 735.744 283.092 764.365 280.384 z" className="color30b04b svgShape"></path>
                <path fill="#f4f4f4" d="M 766.796 329.448 C 786.889 325.013 806.759 337.758 811.106 357.871 C 815.453 377.983 802.622 397.797 782.491 402.056 C 762.483 406.289 742.818 393.554 738.498 373.565 C 734.177 353.577 746.827 333.856 766.796 329.448 z" className="colorf4f4f4 svgShape"></path>
                <path fill="#2cbb47" d="M1294.51 970.444C1317.94 969.763 1378.28 965.617 1398.49 978.629 1404.12 982.888 1408.67 992.201 1408.66 999.112 1408.62 1029.52 1388.66 1029.9 1366.71 1030.79 1366.25 1040.88 1366.27 1049.98 1366.37 1060.04 1429.69 1068.5 1468.4 1087.1 1519.63 1123.63 1524.25 1119.61 1528.61 1115.45 1533.07 1111.25 1508.69 1089.85 1507.3 1088.02 1534.24 1071.03 1551.06 1079.01 1582.86 1106.98 1594.69 1122.09 1597.28 1125.4 1599.05 1130.18 1600.51 1134.19 1594.6 1163.53 1585.29 1157.41 1567.91 1141.9 1563.68 1147.79 1561.11 1151.56 1557.54 1157.84 1567.3 1174.23 1580.35 1186.83 1590.96 1205.44 1586.94 1222.63 1574.6 1253.83 1565.47 1269.11 1560.69 1263.08 1554.25 1250.96 1550.15 1243.91 1540.37 1227.12 1531.91 1214.39 1518.85 1199.68 1473.62 1147.73 1409.25 1116.35 1340.47 1112.7 1341.01 1125.17 1344.99 1165.88 1328.99 1169.54 1312.48 1166.1 1316.33 1125.11 1316.79 1112.76 1253.65 1114.42 1188.96 1145.62 1145.09 1190.54 1097.75 1242.94 1078.81 1287.29 1070.66 1357.28 1083.48 1357.08 1127.88 1354.31 1132.34 1369.21 1128.56 1385.34 1083.38 1382.03 1070.74 1381.88 1074.42 1430.9 1085.42 1470.75 1114.64 1511.5 1123.05 1523.24 1135.5 1535.54 1142.44 1547.47L1143.22 1548.83C1130.58 1553.26 1117.76 1555.67 1104.96 1558.84 1081.63 1564.62 1077.62 1554.24 1065.6 1536.8 996.304 1436.25 998.018 1301.08 1066.68 1200.75 1121.81 1120.18 1197.56 1075.7 1292.55 1058.7 1292.24 1050.06 1292.33 1040.66 1292.23 1031.95 1281.51 1030.57 1264.86 1029.43 1256.79 1022.57 1245.64 1013.08 1246.56 989.862 1256.35 979.74 1265.45 970.325 1282.33 970.903 1294.51 970.444zM1619.93 404.347C1701.55 401.264 1770.24 464.869 1773.43 546.483 1776.63 628.097 1713.11 696.875 1631.5 700.176 1549.74 703.484 1480.8 639.824 1477.6 558.056 1474.41 476.288 1538.16 407.437 1619.93 404.347z" className="color30b04b svgShape"></path>
                <path fill="#2cbb47" d="M953.946 868.353C969.093 866.337 1061.82 866.001 1073.22 871.067 1083.01 881.757 1081.21 907.854 1082.57 922.175 1082.95 926.212 1082.9 932.391 1082.82 936.472 1081.69 998.199 1082.74 1059.96 1082.27 1121.69 1082.25 1123.95 1081.5 1132.58 1080.52 1134.29 1074.45 1144.92 1064 1153.23 1056.82 1163.23 984.835 1253.77 963.248 1365.48 1001.01 1475.79 1008.2 1493.83 1016.77 1511.45 1024.55 1529.33 1009.06 1531.36 953.609 1534.26 940.039 1525.12 936.315 1522.62 935.11 1520.46 934.634 1516.02 931.152 1483.56 932.163 1447.64 932.125 1414.89 931.803 1351.09 931.993 1287.28 932.693 1223.48 933.531 1155 933.88 1086.51 933.74 1018.02 933.648 975.141 932.771 931.845 934.016 888.977 934.189 883.007 935.516 878.902 938.857 873.97 942.105 869.177 948.23 869.131 953.946 868.353zM784.831 1064.44C800.649 1063.35 878.791 1062.84 887.317 1068.83 894.687 1074.01 894.893 1093.45 895.349 1101.74 896.794 1128.04 895.851 1154.42 895.829 1180.76L895.865 1315.51 895.865 1439.06C895.894 1459.74 896.974 1480.05 895.907 1500.76 894.342 1531.13 887.036 1530.6 860.5 1530.57L803.886 1530.89C786.293 1530.97 749.102 1535.67 748.407 1511.16 747.938 1494.64 747.949 1477.81 747.789 1461.24L747.55 1340.32 747.578 1169.69C747.741 1142.27 747.601 1114.98 748.545 1087.56 749.412 1062.4 765.005 1065.64 784.831 1064.44zM1146.54 708.443C1147.58 708.388 1148.61 708.341 1149.65 708.303 1171.5 707.574 1194.19 708.012 1216.1 707.856 1229.16 708.177 1242.49 707.15 1255.46 708.952 1263.32 709.9 1267.14 718.428 1267.9 725.436 1270.98 753.761 1269.86 783.417 1269.79 811.901L1269.7 942.162C1266.44 943.056 1263.2 944.01 1259.98 945.024 1228.89 955.071 1215.55 985.09 1223.19 1015.77 1225.23 1023.99 1228.35 1032.02 1231.14 1040.02 1223.85 1044.28 1212.72 1047.96 1204.57 1050.97 1173.25 1062.75 1148.33 1080.34 1121.1 1098.67 1120.61 1096.52 1120.25 1094.35 1120.02 1092.16 1118.66 1080.24 1119.35 1054.79 1119.36 1041.63L1119.44 945.376 1119.41 816.854C1119.41 787.338 1118.08 755.922 1122.35 726.698 1124.83 709.695 1131.21 708.807 1146.54 708.443zM595.943 1235.43C622.235 1234.55 649.22 1235.27 675.576 1235.24 691.223 1235.22 707.25 1235.75 709.029 1254.68 713.886 1306.37 711.031 1358.07 710.592 1409.89 710.348 1438.67 712.119 1467.41 710.681 1496.14 710.168 1504.23 709.867 1521.77 703.256 1527.35 697.102 1532.55 686.423 1530.5 678.752 1529.91 650.489 1528.63 590.469 1518.08 567.865 1502.68 559.87 1497.24 562.385 1377.05 562.396 1363.98 562.375 1341.49 562.481 1319 562.712 1296.51 562.851 1283.99 562.916 1271.9 563.676 1259.41 565.022 1237.29 576.731 1236.34 595.943 1235.43zM428.687 796.455C447.024 796.252 515.409 793.148 527.073 803.594 535.192 810.865 536.079 831.369 536.521 841.476 537.268 858.505 539.438 934.047 529.896 943.748 520.858 952.936 501.564 951.564 489.406 951.996 471.509 952.123 399.607 955.292 387.337 944.227 381.142 938.642 379.577 927.344 378.782 919.414 376.824 899.882 373.912 817.799 385.215 805.228 394.731 794.642 415.479 796.764 428.687 796.455z" className="color30b04b svgShape"></path>
                <path fill="#f4f4f4" d="M 494.201 831.571 C 498.383 832.321 501.676 833.73 504.988 836.465 C 507.782 838.772 509.886 841.952 509.916 845.687 C 510.002 856.617 457.971 906.179 448.247 915.497 L 428.898 897.096 C 420.195 888.711 396.589 869.574 421.165 862.922 C 428.405 860.962 442.27 876.287 447.708 881.049 C 463.917 865.168 478.61 847.56 494.201 831.571 z" className="colorf4f4f4 svgShape"></path>
                <path fill="#2cbb47" d="M 432.208 1005.45 C 450.134 1004.46 512.55 1002.53 525.388 1011.95 C 532.525 1017.18 534.458 1030.88 535.37 1039.18 C 537.435 1057.99 540.135 1140.79 529.478 1152.66 C 520.506 1162.66 496.815 1160.25 484.117 1160.7 C 464.222 1160.98 401.326 1163.83 388.049 1154.09 C 371.946 1142.28 378.111 1050.02 379.124 1030.31 C 380.607 1001.44 411.6 1006.05 432.208 1005.45 z" className="color30b04b svgShape"></path>
                <path fill="#f4f4f4" d="M 494.348 1041.69 C 505.466 1042.27 513.725 1053.02 506.832 1061.51 C 489.752 1082.55 467.768 1106.19 448.526 1124.76 C 440.463 1117.78 434.162 1111.58 426.644 1104.09 C 419.814 1097.67 405.409 1085.4 412.659 1075.11 C 425.215 1067.22 438.898 1082.54 446.949 1090.52 C 462.623 1076.49 478.521 1054.47 494.348 1041.69 z" className="colorf4f4f4 svgShape"></path>
                <path fill="#2cbb47" d="M 445.809 587.483 C 460.864 587.442 516.133 584.668 526.487 594.441 C 534.195 601.716 535.257 615.049 535.835 625.014 C 536.875 642.945 540.298 724.047 528.976 735.458 C 519.33 745.18 483.311 742.834 469.608 743.062 C 453.405 743.085 401.056 744.629 387.813 736.076 C 379.479 730.694 377.406 699.871 377.819 687.882 C 378.477 668.757 373.717 609.897 385.894 594.802 C 392.818 586.218 432.891 587.654 445.809 587.483 z" className="color30b04b svgShape"></path>
                <path fill="#f4f4f4" d="M 494.438 623.66 C 505.321 624.148 514.653 634.346 507.342 643.074 C 489.734 664.093 467.768 688.485 448.082 707.251 L 427.775 687.338 C 417.456 677.623 396.228 661.283 422.529 653.158 C 427.13 651.737 443.395 669.195 446.854 672.57 C 462.328 659.416 478.722 638.278 494.438 623.66 z" className="colorf4f4f4 svgShape"></path>
                <path fill="#2cbb47" d="M1442.43 1229.79C1468.53 1231.7 1443.74 1261.73 1437.92 1270.77 1418.93 1300.3 1396.17 1326.73 1376.09 1355.34 1370.19 1366.22 1373.64 1379.56 1368.03 1390.76 1361.43 1403.94 1347.69 1412.15 1333.14 1413.55 1322.57 1414.57 1314.13 1411.49 1304.74 1406.74 1289.74 1394.92 1281.38 1379.76 1285.89 1359.98 1287.81 1351.55 1292.36 1344.57 1298.68 1338.67 1311.74 1326.47 1330.97 1330.59 1343.99 1318.73 1355.05 1309.47 1364.22 1300.23 1374.59 1290.29 1387.67 1277.74 1400.91 1265.36 1414.31 1253.15 1422.1 1246.01 1433.68 1234.84 1442.43 1229.79zM622.624 834.452C683.617 832.883 747.91 833.356 808.988 836.425 815.998 836.778 822.95 840.237 823.316 848.074 818.751 860.407 790.021 859.031 778.578 859.276 752.716 860.082 591.262 862.988 581.251 855.039 579.238 853.441 577.657 850.701 577.381 848.093 577.041 844.866 578.034 841.483 580.528 839.28 588.073 832.617 612.409 834.705 622.624 834.452zM698.291 890.487C710.451 890.437 754.021 886.783 755.854 904.045 755.407 905.735 754.962 906.445 753.687 907.72 741.362 920.044 654.979 916.097 634.504 916.03 620.061 916.045 596.102 916.202 582.085 911.481 574.366 908.882 576.384 894.577 586.202 892.873 601.543 890.21 617.532 890.85 633.241 890.802L698.291 890.487zM606.618 681.45C625.994 680.378 648.975 681.656 668.673 681.633 689.785 682.107 711.306 680.87 732.307 683.166 740.372 684.048 751.776 686.372 753.35 695.484 750.382 706.16 731.73 705.088 722.357 705.559 686.69 707.985 648.949 706.147 613.189 706.13 607.781 706.128 583.448 706.716 580.918 702.435 568.023 680.614 593.051 681.794 606.618 681.45zM591.474 1044.33C597.633 1043.82 617.184 1043.37 622.556 1043.81 638.249 1045.07 702.398 1040.61 712.239 1047.48 714.563 1049.12 716.145 1051.61 716.642 1054.41 718.284 1063.58 710.944 1065.89 703.874 1067.13 687.462 1069.13 590.859 1070.81 581.639 1065.14 579.286 1063.69 577.757 1061.68 577.149 1058.98 576.44 1055.82 576.882 1051.68 579.104 1049.19 582.036 1045.89 587.402 1045.09 591.474 1044.33z" className="color30b04b svgShape"></path>
                <path fill="#5d8d66" d="M 1912.21 1131.93 C 1913.28 1126.41 1915.84 1119.68 1918.05 1114.43 L 1914.45 1138.46 C 1913.98 1135.87 1913.21 1134.32 1912.21 1131.93 z" className="color5d8d69 svgShape"></path>
              </svg>
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
