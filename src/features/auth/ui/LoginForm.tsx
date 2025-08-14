"use client";

import { useState } from "react";
import { useAuth } from "../model/useAuth";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiCheck } from "react-icons/fi";

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
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Diseño innovador */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        {/* Patrón de fondo animado */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-20 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Contenido del panel izquierdo */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-xl font-bold">PA</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Panel Admin</h1>
                <p className="text-purple-200">Sistema de Cotizaciones</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-4xl font-bold leading-tight">
                Bienvenido de vuelta
              </h2>
              <p className="text-xl text-purple-100 leading-relaxed">
                Gestiona tus cotizaciones, clientes y reportes de manera eficiente 
                con nuestra plataforma intuitiva y poderosa.
              </p>
            </div>

            {/* Características destacadas */}
            <div className="space-y-4 pt-8">
              {[
                "Gestión completa de cotizaciones",
                "Dashboard con métricas en tiempo real", 
                "Reportes avanzados y análisis",
                "Interfaz moderna y responsive"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="h-5 w-5 bg-green-400 rounded-full flex items-center justify-center">
                    <FiCheck className="w-3 h-3 text-green-900" />
                  </div>
                  <span className="text-purple-100">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - Formulario de login */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 lg:px-16 bg-gray-50">
        <div className="w-full max-w-md mx-auto">
          {/* Header móvil */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-10 w-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">PA</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Panel Admin</h1>
            </div>
          </div>

          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-gray-900">Iniciar Sesión</h2>
              <p className="mt-2 text-gray-600">
                Ingresa a tu cuenta para continuar
              </p>
            </div>

            {/* Credenciales de demo */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-blue-900">Credenciales de prueba</h3>
                <button
                  onClick={() => setShowDemoCredentials(!showDemoCredentials)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {showDemoCredentials ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              
              {showDemoCredentials && (
                <div className="space-y-2">
                  {demoCredentials.map((cred, index) => (
                    <button
                      key={index}
                      onClick={() => handleDemoLogin(cred)}
                      className="w-full text-left p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors group"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-blue-900">{cred.email}</div>
                          <div className="text-sm text-blue-600">{cred.role}</div>
                        </div>
                        <FiArrowRight className="w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              {/* Campo contraseña */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* Botón submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
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
            </form>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500">
              <p>© 2025 Panel Admin - Sistema de Cotizaciones</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
