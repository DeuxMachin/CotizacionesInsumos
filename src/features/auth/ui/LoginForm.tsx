"use client";

import { useState } from "react";
import { useAuth } from "../model/useAuth";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiCheck } from "react-icons/fi";
import { Logo } from "@/shared/ui/Logo";
import { BRAND } from "@/shared/ui/brand";

const demoCredentials = [
  { email: "admin@empresa.com", password: "admin123", role: "Administrador" },
  { email: "user@empresa.com", password: "user123", role: "Usuario" },
  { email: "demo@empresa.com", password: "demo123", role: "Demo" },
];

export function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await login(formData.email, formData.password);
    
    if (!result.success) {
      setError(result.error || "Error desconocido");
    }
  };

  const handleDemoLogin = (credentials: typeof demoCredentials[0]) => {
    setFormData({
      email: credentials.email,
      password: credentials.password
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Decoración de fondo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-10 -left-10 w-80 h-80 bg-orange-200/40 blur-3xl rounded-full animate-blob" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-amber-200/40 blur-3xl rounded-full animate-blob animation-delay-2000" />
        <div className="absolute -bottom-16 left-1/3 w-96 h-96 bg-orange-300/30 blur-3xl rounded-full animate-blob animation-delay-4000" />
      </div>

      {/* Contenido centrado */}
      <div className="relative z-10 px-4 py-10 sm:px-6 md:px-8 lg:px-10 min-h-screen grid place-items-center">
        <div className="w-full max-w-5xl">
          {/* Card premium con panel lateral en desktop */}
          <div className="grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl border border-orange-100 bg-white/80 backdrop-blur-xl">
            {/* Panel lateral (solo desktop) */}
            <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-orange-500 to-orange-600 text-white relative">
              <div>
                <h2 className="text-3xl font-extrabold leading-tight">Gestiona cotizaciones con estilo</h2>
                <p className="mt-3 text-orange-100 text-lg">Una experiencia rápida, moderna y centrada en productividad.</p>
              </div>
              <ul className="mt-10 space-y-4 text-orange-50/90">
                {["Nueva cotización en segundos","Métricas claras y accionables","Interfaz responsive y accesible"].map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                      <FiCheck className="w-3.5 h-3.5" />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Panel del formulario */}
            <div className="p-6 sm:p-8 md:p-10">
              {/* Marca */}
              <div className="mb-8 flex items-center gap-3">
                <Logo height={32} />
                <div className="hidden sm:block text-gray-600">Sistema de Cotizaciones</div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bienvenido</h1>
              <p className="mt-2 text-gray-600">Accede a tu panel administrativo</p>

              {/* Credenciales demo */}
              <div className="mt-6 bg-orange-50/70 border border-orange-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-orange-900">Credenciales de prueba</h3>
                  <button
                    onClick={() => setShowDemoCredentials(!showDemoCredentials)}
                    className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                  >
                    {showDemoCredentials ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                {showDemoCredentials && (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {demoCredentials.map((cred, index) => (
                      <button
                        key={index}
                        onClick={() => handleDemoLogin(cred)}
                        className="text-left p-3 bg-white rounded-lg border border-orange-200 hover:border-orange-300 transition-colors group"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-orange-900">{cred.email}</div>
                            <div className="text-sm text-orange-600">{cred.role}</div>
                          </div>
                          <FiArrowRight className="w-4 h-4 text-orange-400 group-hover:text-orange-600 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <div className="relative mt-1">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Contraseña</label>
                  <div className="relative mt-1">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <label className="inline-flex items-center gap-2 text-gray-600">
                      <input type="checkbox" className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                      Recuérdame
                    </label>
                    <button type="button" className="text-orange-600 hover:text-orange-700">¿Olvidaste tu contraseña?</button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-gradient-to-r ${BRAND.accentFrom} ${BRAND.accentTo} text-white py-3 px-4 rounded-xl font-medium shadow-md hover:shadow-lg hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Iniciando sesión...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Iniciar Sesión</span>
                      <FiArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </button>

                <p className="text-center text-xs text-gray-500">© 2025 Panel Admin – Sistema de Cotizaciones</p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
