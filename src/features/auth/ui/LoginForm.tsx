"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../model/useAuth";
import { SecurityService } from "@/services/securityService";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield } from "react-icons/fi";
import { Logo } from "@/shared/ui/Logo";

export function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: ""
  });
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState("");

  const { login, isLoading } = useAuth();
  const router = useRouter();

  // Validar formulario en tiempo real
  const validateForm = () => {
    const emailValid = Boolean(formData.email.trim() && /\S+@\S+\.\S+/.test(formData.email));
    const passwordValid = Boolean(formData.password.length >= 6);
    setIsFormValid(emailValid && passwordValid);
  };

  // Actualizar validación cuando cambian los campos
  useEffect(() => {
    validateForm();
    
    // Verificar si la cuenta está bloqueada cuando cambia el email
    if (formData.email.trim()) {
      const lockStatus = SecurityService.isAccountLocked(formData.email);
      setIsLocked(lockStatus.locked);
      
      if (lockStatus.locked && lockStatus.remainingTime) {
        setLockoutTime(SecurityService.getRemainingLockoutTime(lockStatus.remainingTime));
      }
    } else {
      setIsLocked(false);
      setLockoutTime("");
    }
  }, [formData.email, formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Verificar si la cuenta está bloqueada
    const lockStatus = SecurityService.isAccountLocked(formData.email);
    if (lockStatus.locked) {
      const remainingTime = lockStatus.remainingTime 
        ? SecurityService.getRemainingLockoutTime(lockStatus.remainingTime)
        : "unos minutos";
      setError(`Cuenta temporalmente bloqueada. Intente nuevamente en ${remainingTime}.`);
      return;
    }

    // Validaciones básicas
    if (!formData.email.trim()) {
      setError("El email es requerido");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Ingrese un email válido");
      return;
    }

    if (!formData.password.trim()) {
      setError("La contraseña es requerida");
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      const result = await login(formData.email.trim(), formData.password);
      
      if (!result.success) {
        // Registrar intento fallido
        SecurityService.registerFailedAttempt(formData.email);
        
        // Verificar si ahora está bloqueada
        const newLockStatus = SecurityService.isAccountLocked(formData.email);
        if (newLockStatus.locked) {
          const remainingTime = newLockStatus.remainingTime 
            ? SecurityService.getRemainingLockoutTime(newLockStatus.remainingTime)
            : "unos minutos";
          setError(`Demasiados intentos fallidos. Cuenta bloqueada por ${remainingTime}.`);
          setIsLocked(true);
          setLockoutTime(remainingTime);
        } else {
          setError(result.error || "Error de autenticación");
        }
      } else {
        // Login exitoso - resetear intentos
        SecurityService.resetAttempts(formData.email);
        
        // Esperar un momento para que el estado se actualice
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const currentUser = useAuth.getState().user;
        
        // Redirigir según el rol del usuario
        if (currentUser) {
          const redirectPath = currentUser.rol === 'admin' ? '/admin' : '/dashboard';
          router.push(redirectPath);
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err) {
      console.error("Error en login:", err);
      SecurityService.registerFailedAttempt(formData.email);
      setError("Ocurrió un error inesperado. Intente nuevamente.");
    }
  };

  return (
    <div 
      className="relative min-h-screen overflow-hidden"
      style={{ 
        background: 'linear-gradient(135deg, var(--accent-bg) 0%, var(--bg-primary) 50%, var(--accent-bg) 100%)'
      }}
    >
      {/* Decoración de fondo */}
      <div className="pointer-events-none absolute inset-0">
        <div 
          className="absolute -top-10 -left-10 w-80 h-80 blur-3xl rounded-full animate-pulse opacity-30"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        />
        <div 
          className="absolute top-40 right-10 w-96 h-96 blur-3xl rounded-full animate-pulse opacity-20"
          style={{ backgroundColor: 'var(--accent-secondary)' }}
        />
        <div 
          className="absolute -bottom-16 left-1/3 w-96 h-96 blur-3xl rounded-full animate-pulse opacity-25"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        />
      </div>

      {/* Contenido centrado */}
      <div className="relative z-10 px-4 py-10 sm:px-6 md:px-8 lg:px-10 min-h-screen grid place-items-center">
        <div className="w-full max-w-5xl">
          {/* Card con panel lateral en desktop */}
          <div 
            className="grid lg:grid-cols-2 rounded-3xl overflow-hidden border"
            style={{ 
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-subtle)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            {/* Panel lateral (solo desktop) */}
            <div 
              className="hidden lg:flex flex-col justify-between p-10 text-white relative"
              style={{ 
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)'
              }}
            >
              <div>
                <h2 className="text-3xl font-extrabold leading-tight">
                  Gestiona cotizaciones con estilo
                </h2>
                <p className="mt-3 text-white/90 text-lg">
                  Una experiencia rápida, moderna y centrada en productividad.
                </p>
              </div>
              <ul className="mt-10 space-y-4 text-white/80">
                {[
                  "Nueva cotización en segundos",
                  "Métricas claras y accionables", 
                  "Interfaz responsive y accesible"
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Panel del formulario */}
            <div className="p-6 sm:p-8 md:p-10">
              {/* Marca */}
              <div className="mb-8 flex items-center gap-3">
                <Logo height={32} />
                <div 
                  className="hidden sm:block"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Sistema de Cotizaciones
                </div>
              </div>

              <h1 
                className="text-2xl sm:text-3xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                Bienvenido
              </h1>
              <p 
                className="mt-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Accede a tu panel administrativo
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {/* Email */}
                <div>
                  <label 
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Email
                  </label>
                  <div className="relative mt-1">
                    <FiMail 
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, email: e.target.value }));
                        setError(""); // Limpiar error cuando el usuario empiece a escribir
                      }}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: error && !formData.email.trim() ? 'var(--danger)' : 'var(--border)',
                        color: 'var(--text-primary)',
                        '--tw-ring-color': 'var(--accent-primary)'
                      } as any}
                      placeholder="tu@email.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label 
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Contraseña
                  </label>
                  <div className="relative mt-1">
                    <FiLock 
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, password: e.target.value }));
                        setError(""); // Limpiar error cuando el usuario empiece a escribir
                      }}
                      className="w-full pl-10 pr-12 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: error && formData.password.length < 6 ? 'var(--danger)' : 'var(--border)',
                        color: 'var(--text-primary)',
                        '--tw-ring-color': 'var(--accent-primary)'
                      } as any}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Error o advertencia de bloqueo */}
                {error && (
                  <div 
                    className="px-4 py-3 rounded-xl text-sm border flex items-center gap-2"
                    style={{ 
                      backgroundColor: isLocked ? 'var(--warning-bg)' : 'var(--danger-bg)',
                      borderColor: isLocked ? 'var(--warning)' : 'var(--danger)',
                      color: isLocked ? 'var(--warning-text)' : 'var(--danger-text)'
                    }}
                  >
                    {isLocked && <FiShield className="w-4 h-4" />}
                    {error}
                  </div>
                )}

                {/* Advertencia cuando se acerque al límite */}
                {!error && !isLocked && formData.email.trim() && (() => {
                  const attempts = SecurityService.isAccountLocked(formData.email);
                  return null; // Por seguridad, no mostrar número de intentos restantes
                })()} 

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !isFormValid || isLocked}
                  className="w-full py-3 px-4 rounded-xl font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-offset-2 text-white"
                  style={{
                    background: (isFormValid && !isLoading && !isLocked)
                      ? 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)'
                      : 'var(--border)',
                    boxShadow: (isFormValid && !isLoading && !isLocked) ? 'var(--shadow)' : 'none',
                    '--tw-ring-color': 'var(--accent-primary)',
                    '--tw-ring-offset-color': 'var(--bg-primary)'
                  } as any}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Iniciando sesión...
                    </div>
                  ) : isLocked ? (
                    <div className="flex items-center justify-center gap-2">
                      <FiShield className="w-5 h-5" />
                      <span>Cuenta Bloqueada</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Iniciar Sesión</span>
                      <FiArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </button>

                {/* Footer */}
                <p 
                  className="text-center text-xs mt-6"
                  style={{ color: 'var(--text-muted)' }}
                >
                  © 2025 Sistema de Cotizaciones – Acceso Seguro
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
