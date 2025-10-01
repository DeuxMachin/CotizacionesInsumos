"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SecurityService } from "@/services/securityService";
import { SecurityLogger } from "@/services/securityLogger";
import {  XSSProtection } from "@/services/csrfProtection";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield, FiAlertCircle, FiWifi, FiUserX } from "react-icons/fi";
import { Logo } from "@/shared/ui/Logo";

export function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreLockModal, setShowPreLockModal] = useState(false);
  const [attemptCount, setAttemptCount] = useState<number | null>(null);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const [isLocked, setIsLocked] = useState(false);
  const [, setLockoutTime] = useState("");

  const { login } = useAuth();


  // Validar formulario en tiempo real
  const validateForm = () => {
    const emailValid = Boolean(formData.email.trim() && /\S+@\S+\.\S+/.test(formData.email));
    // Permitir contraseñas de hasta 128 caracteres, sin reglas arbitrarias de complejidad
    const passwordValid = Boolean(formData.password.length >= 6 && formData.password.length <= 128);
    setIsFormValid(emailValid && passwordValid);
  };

  // Prefill last attempted email al montar
  useEffect(() => {
    try {
      const last = localStorage.getItem('last-login-email');
      if (last) {
        setFormData(prev => ({ ...prev, email: last }));
      }
    } catch {}
  }, []);

  // Actualizar validación cuando cambian los campos
  useEffect(() => {
    validateForm();

    // Limpiar errores cuando el usuario empiece a escribir
    if (error && !isLocked && (formData.email.trim() || formData.password.trim()) && !isSubmitting) {
      if (!error.includes('contraseña') && !error.includes('cuenta') && !error.includes('correo')) {
        setError("");
      }
    }

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
  }, [formData.email, formData.password, error, isLocked, isSubmitting, validateForm]);

  // Diagnóstico: log de visibilidad del modal y conteo
  useEffect(() => {
    if (showPreLockModal) {
      console.log('[LoginForm] Modal de advertencia abierto. intentos =', attemptCount);
    } else {
      console.log('[LoginForm] Modal de advertencia cerrado. intentos =', attemptCount);
    }
  }, [showPreLockModal, attemptCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

  setError("");
  setWarning("");
    setIsSubmitting(true);

    try {
      // Verificar si ya hay intentos fallidos previos para mostrar advertencia temprana
      const storedAttempts = localStorage.getItem('login_attempts');
      if (storedAttempts) {
        let attempts: Record<string, { count: number; timestamp: number }> = {};
        try { attempts = JSON.parse(storedAttempts); } catch {}
        const emailKey = formData.email.trim().toLowerCase();
        const userAttempts = attempts[emailKey];
        
        if (userAttempts && userAttempts.count >= 3) {
          // Si ya tiene 3+ intentos fallidos, mostrar advertencia proactivamente
          console.log('[LoginForm] Detectados intentos previos (localStorage):', userAttempts.count);
          setAttemptCount(userAttempts.count);
          setShowPreLockModal(true);
        }
      }
    } catch (e) {
      // Ignorar errores al leer localStorage
    }

    // Validaciones de seguridad XSS
    if (!XSSProtection.validateEmail(formData.email)) {
      setError("Email contiene caracteres no válidos");
      setIsSubmitting(false);
      SecurityLogger.logSuspiciousActivity('invalid_email_format', { email: formData.email });
      return;
    }

    if (!XSSProtection.validatePassword(formData.password)) {
      setError("Contraseña contiene caracteres no válidos");
      setIsSubmitting(false);
      SecurityLogger.logSuspiciousActivity('invalid_password_format', { email: formData.email });
      return;
    }

    // Verificar si la cuenta está bloqueada
    const lockStatus = SecurityService.isAccountLocked(formData.email);
    if (lockStatus.locked) {
      const remainingTime = lockStatus.remainingTime
        ? SecurityService.getRemainingLockoutTime(lockStatus.remainingTime)
        : "unos minutos";
      setError(`Demasiados intentos fallidos. Intente nuevamente en ${remainingTime}.`);
      setIsSubmitting(false);
      return;
    }

    // Validaciones básicas
    if (!formData.email.trim()) {
      setError("El email es requerido");
      setIsSubmitting(false);
      return;
    }

    if (!formData.password.trim()) {
      setError("La contraseña es requerida");
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length > 128) {
      setError("La contraseña no puede exceder los 128 caracteres");
      setIsSubmitting(false);
      return;
    }

    try {
      // Log del intento de login
      SecurityLogger.logLoginAttempt(formData.email, false);

  const emailTrimmed = formData.email.trim();
  const result = await login(emailTrimmed, formData.password);

      if (!result.success) {
        // Persist last attempted email
        try { localStorage.setItem('last-login-email', emailTrimmed); } catch {}
        if (result.error) setError(result.error);
        if (result.warning) {
          setWarning(result.warning);
          // Mostrar modal de advertencia siempre que el servidor envíe warning
          setShowPreLockModal(true);
        }
        
        // Si la cuenta ha sido desactivada, mostrar modal de recuperación
        if (result.deactivated) {
          setShowForgotPasswordModal(true);
        }
        
        // Registrar intento fallido y usar conteo actualizado del cliente
        const clientCount = SecurityService.registerFailedAttempt(emailTrimmed);
        setAttemptCount(clientCount);
        // Abrir modal exactamente desde el 3er al 5to intento incluido
        if (clientCount >= 3 && clientCount < 6) {
          console.log('[LoginForm] Abriendo modal por intentos cliente =', clientCount);
          setShowPreLockModal(true);
        }

  const newLockStatus = SecurityService.isAccountLocked(emailTrimmed);
        if (newLockStatus.locked) {
          const remainingTime = newLockStatus.remainingTime
            ? SecurityService.getRemainingLockoutTime(newLockStatus.remainingTime)
            : "unos minutos";
          setError(`Demasiados intentos fallidos. Intente nuevamente en ${remainingTime}.`);
          setIsLocked(true);
          setLockoutTime(remainingTime);
        } else {
          // Mensaje genérico ya puesto en result.error; si faltó, fallback
          if (!result.error) setError("Credenciales incorrectas. Verifique su email y contraseña.");
        }
      } else {
        console.log('[LoginForm] Login result success, esperando redirección del contexto...')
        setError("");
        setWarning("");
  SecurityService.resetAttempts(emailTrimmed);
  SecurityLogger.logLoginAttempt(emailTrimmed, true);
        // Limpiar last email tras éxito
        try { localStorage.removeItem('last-login-email'); } catch {}
      }
    } catch (err) {
      console.error("Error en login:", err);
      const clientCount = SecurityService.registerFailedAttempt(formData.email.trim());
      // Mostrar modal también en errores de red si cruza umbral 3-5
      if (clientCount >= 3 && clientCount < 6) {
        console.log('[LoginForm] Abriendo modal (catch) por intentos cliente =', clientCount);
        setAttemptCount(clientCount);
        setShowPreLockModal(true);
      }

      if (err instanceof Error) {
        if (err.message.includes('fetch')) {
          setError("Error de conexión. Verifique su conexión a internet e intente nuevamente.");
        } else if (err.message.includes('network')) {
          setError("Error de red. Intente nuevamente en unos momentos.");
        } else {
          setError(err.message || "Ocurrió un error inesperado. Intente nuevamente.");
        }
      } else {
        setError("Ocurrió un error inesperado. Intente nuevamente.");
      }
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
      }, 100);
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
                      }}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: error && !formData.email.trim() ? 'var(--danger)' : 'var(--border)',
                        color: 'var(--text-primary)',
                        '--tw-ring-color': 'var(--accent-primary)'
                      } as React.CSSProperties & {
                        '--tw-ring-color': string;
                      }}
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
                      }}
                      className="w-full pl-10 pr-12 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: error && formData.password.length < 6 ? 'var(--danger)' : 'var(--border)',
                        color: 'var(--text-primary)',
                        '--tw-ring-color': 'var(--accent-primary)'
                      } as React.CSSProperties & {
                        '--tw-ring-color': string;
                      }}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      minLength={6}
                      maxLength={128}
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

                {/* Error */}
                {error && (() => {
                  return (
                    <div
                      className="px-4 py-3 rounded-xl text-sm border flex items-center gap-2"
                      style={{
                        backgroundColor: isLocked ? 'var(--warning-bg)' : 'var(--danger-bg)',
                        borderColor: isLocked ? 'var(--warning)' : 'var(--danger)',
                        color: isLocked ? 'var(--warning-text)' : 'var(--danger-text)'
                      }}
                    >
                      {/* Icono específico según el tipo de error */}
                      {isLocked ? (
                        <FiShield className="w-4 h-4 flex-shrink-0" />
                      ) : error.includes('conexión') || error.includes('red') ? (
                        <FiWifi className="w-4 h-4 flex-shrink-0" />
                      ) : error.includes('correo') || error.includes('email') ? (
                        <FiMail className="w-4 h-4 flex-shrink-0" />
                      ) : error.includes('contraseña') ? (
                        <FiLock className="w-4 h-4 flex-shrink-0" />
                      ) : error.includes('deshabilitada') || error.includes('inactivo') ? (
                        <FiUserX className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className="flex-1">{error}</span>
                    </div>
                  );
                })()}

                {/* Advertencia previa a lock */}
                {!error && warning && (
                  <div
                    className="px-4 py-3 rounded-xl text-sm border flex items-center gap-2"
                    style={{
                      backgroundColor: 'var(--warning-bg)',
                      borderColor: 'var(--warning)',
                      color: 'var(--warning-text)'
                    }}
                  >
                    <FiShield className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{warning}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !isFormValid || isLocked}
                  className="w-full py-3 px-4 rounded-xl font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-offset-2 text-white"
                  style={{
                    background: (isFormValid && !isSubmitting && !isLocked)
                      ? 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)'
                      : 'var(--border)',
                    boxShadow: (isFormValid && !isSubmitting && !isLocked) ? 'var(--shadow)' : 'none',
                    '--tw-ring-color': 'var(--accent-primary)',
                    '--tw-ring-offset-color': 'var(--bg-primary)'
                  } as React.CSSProperties & {
                    '--tw-ring-color': string;
                    '--tw-ring-offset-color': string;
                  }}
                >
                  {isSubmitting ? (
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
              {/* Modal de advertencia previa a inhabilitación */}
              {showPreLockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="w-full max-w-md rounded-2xl border p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-subtle)', boxShadow: 'var(--shadow-lg)' }}>
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <FiShield className="w-6 h-6" style={{ color: 'var(--warning)' }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Advertencia de seguridad</h3>
                        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {attemptCount && attemptCount >= 3 && attemptCount < 6
                            ? `Has realizado ${attemptCount} intentos fallidos. Si te equivocas ${6 - attemptCount} vez${6 - attemptCount === 1 ? '' : 'es'} más, tu cuenta será inhabilitada por seguridad y necesitarás restablecer tu contraseña para reactivarla.`
                            : 'Has realizado varios intentos fallidos. Si alcanzas 6 intentos fallidos, tu cuenta será inhabilitada por seguridad y necesitarás restablecer tu contraseña para reactivarla. '}
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPreLockModal(false)}
                        className="px-4 py-2 rounded border"
                        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                      >
                        Entendido
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Modal de recuperación de cuenta desactivada */}
              {showForgotPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="w-full max-w-md rounded-2xl border p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-subtle)', boxShadow: 'var(--shadow-lg)' }}>
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <FiUserX className="w-6 h-6" style={{ color: 'var(--danger)' }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Cuenta inhabilitada</h3>
                        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Su cuenta ha sido inhabilitada por seguridad tras múltiples intentos fallidos. 
                          Para reactivarla, debe restablecer su contraseña.
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowForgotPasswordModal(false)}
                        className="px-4 py-2 rounded border"
                        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                      >
                        Cerrar
                      </button>
                      <a
                        href="/recuperar-password"
                        className="px-4 py-2 rounded text-white"
                        style={{
                          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                        }}
                      >
                        Restablecer contraseña
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
