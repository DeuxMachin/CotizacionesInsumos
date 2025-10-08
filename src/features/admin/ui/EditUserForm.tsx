"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUsuarios } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { FiMail, FiUser, FiLock, FiEye, FiEyeOff, FiCheck, FiAlertCircle, FiArrowLeft, FiEdit3, FiCheckCircle, FiXCircle, FiShield } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";

type DbUser = {
  id: string;
  email: string;
  nombre: string | null;
  apellido: string | null;
  rol: string;
  activo: boolean;
  created_at: string;
  last_login_at: string | null;
};

interface EditUserForm {
  email: string;
  name: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  role?: 'dueño' | 'admin' | 'vendedor' | 'cliente';
}

type EditUserFormErrors = Partial<Record<keyof EditUserForm, string>>;

// Lista de contraseñas comunes prohibidas
const commonPasswords = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'qwerty123', 'admin123', 'root', 'user', 'guest', 'test', 'demo'
];

// Requisitos de contraseña
const passwordRequirements = [
  { key: 'length', label: 'Mínimo 8 caracteres', regex: /.{8,}/ },
  { key: 'uppercase', label: 'Al menos una mayúscula', regex: /[A-Z]/ },
  { key: 'lowercase', label: 'Al menos una minúscula', regex: /[a-z]/ },
  { key: 'number', label: 'Al menos un número', regex: /\d/ },
  { key: 'special', label: 'Al menos un carácter especial', regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/ }
];

// Función para calcular la fortaleza de la contraseña
const calculatePasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;

  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[a-z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 15;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 20;

  // Penalizaciones
  if (password.length < 6) score -= 30;
  if (commonPasswords.includes(password.toLowerCase())) score -= 50;

  if (score >= 80) return { score, label: 'Muy fuerte', color: '#10b981' };
  if (score >= 60) return { score, label: 'Fuerte', color: '#059669' };
  if (score >= 40) return { score, label: 'Media', color: '#f59e0b' };
  if (score >= 20) return { score, label: 'Débil', color: '#ef4444' };
  return { score: Math.max(0, score), label: 'Muy débil', color: '#dc2626' };
};

// Función para verificar si la contraseña contiene información personal
const containsPersonalInfo = (password: string, name: string, lastName: string, email: string): boolean => {
  const personalInfo = [
    name.toLowerCase(),
    lastName.toLowerCase(),
    email.toLowerCase().split('@')[0], // parte antes del @
    name.toLowerCase() + lastName.toLowerCase(),
    lastName.toLowerCase() + name.toLowerCase()
  ];

  return personalInfo.some(info => password.toLowerCase().includes(info) && info.length > 2);
};

export function EditUserForm() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { data: dbUsers, refetch } = useUsuarios();
  const { user: authUser, logout } = useAuth();
  const [formData, setFormData] = useState<EditUserForm | null>(null);
  const [formErrors, setFormErrors] = useState<EditUserFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  // Derived values via useMemo to reduce state updates
  const isOwner = useMemo(() => {
    const r = authUser?.role?.toLowerCase();
    return r === 'dueño' || r === 'dueno';
  }, [authUser?.role]);

  const users = useMemo(() => (dbUsers || []).map((u: DbUser) => ({
    id: u.id,
    email: u.email,
    nombre: u.nombre ?? '',
    apellido: u.apellido ?? '',
    rol: u.rol as 'dueño' | 'admin' | 'vendedor' | 'cliente'
  })), [dbUsers]);

  const currentUser = useMemo(() => users.find(u => u.id === userId), [users, userId]);

  useEffect(() => {
    if (currentUser && !formData) {
      setFormData({
        email: currentUser.email,
        name: currentUser.nombre,
        lastName: currentUser.apellido,
        password: '',
        confirmPassword: '',
        role: currentUser.rol
      });
      setLoading(false);
    } else if (!currentUser && dbUsers) {
      // User not found
      setLoading(false);
    }
  }, [currentUser, formData, dbUsers]);

  const validateForm = (): boolean => {
    if (!formData) return false;

    const errors: EditUserFormErrors = {};

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    } else if (users.some(u => u.email === formData.email && u.id !== userId)) {
      errors.email = 'Este email ya está registrado';
    }

    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.lastName || formData.lastName.trim().length < 2) {
      errors.lastName = 'El apellido debe tener al menos 2 caracteres';
    }

    if (formData.password || formData.confirmPassword) {
      if (!formData.password) {
        errors.password = 'La contraseña es requerida';
      } else {
        const errorsList: string[] = [];

        // Verificar longitud mínima
        if (formData.password.length < 8) {
          errorsList.push('Mínimo 8 caracteres');
        }

        // Verificar complejidad
        if (!/[A-Z]/.test(formData.password)) {
          errorsList.push('Al menos una mayúscula');
        }
        if (!/[a-z]/.test(formData.password)) {
          errorsList.push('Al menos una minúscula');
        }
        if (!/\d/.test(formData.password)) {
          errorsList.push('Al menos un número');
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
          errorsList.push('Al menos un carácter especial');
        }

        // Verificar contraseñas comunes
        if (commonPasswords.includes(formData.password.toLowerCase())) {
          errorsList.push('Esta contraseña es muy común, elige una más segura');
        }

        // Verificar información personal
        if (containsPersonalInfo(formData.password, formData.name, formData.lastName, formData.email)) {
          errorsList.push('No uses tu nombre, apellido o email en la contraseña');
        }

        // Verificar secuencias comunes
        if (/(.)\1{2,}/.test(formData.password)) {
          errorsList.push('Evita caracteres repetidos consecutivos');
        }

        if (errorsList.length > 0) {
          errors.password = errorsList.join('. ');
        }
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !validateForm()) return;

    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        email: formData.email,
        nombre: formData.name,
        apellido: formData.lastName
      };

      const changedPassword = !!formData.password;
      if (changedPassword) {
        const newHash = await bcrypt.hash(formData.password, 10);
        (payload as { password_hash?: string }).password_hash = newHash;
        (payload as { password_updated_at?: string }).password_updated_at = new Date().toISOString();
      }

      // Only owners can change roles
      if (isOwner && formData.role) {
        (payload as { rol?: EditUserForm['role'] }).rol = formData.role;
      }

      const { error } = await supabase
        .from('usuarios')
        .update(payload)
        .eq('id', userId);

      if (error) throw error;

      await refetch();
      // If the logged-in user changed their own password, force logout to apply change
      if (changedPassword && authUser?.id === userId) {
        alert('Contraseña actualizada. Se cerrará la sesión para aplicar los cambios.');
        await logout();
        return;
      }

      alert('Usuario actualizado exitosamente');
      router.push('/admin/usuarios');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar el usuario';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof EditUserForm, value: string | undefined) => {
    if (!formData) return;

    setFormData(prev => prev ? { ...prev, [field]: value } : prev);

    // Limpiar error del campo cuando el usuario empieza a escribir
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Derived password strength and requirements to avoid extra state updates
  const derivedPasswordStrength = useMemo(() => calculatePasswordStrength(formData?.password || ''), [formData?.password]);
  const derivedPasswordRequirementsStatus = useMemo(() => {
    const pwd = formData?.password || '';
    const name = formData?.name || '';
    const lastName = formData?.lastName || '';
    const email = formData?.email || '';
    const reqs: Record<string, boolean> = {};
    passwordRequirements.forEach(req => {
      reqs[req.key] = req.regex.test(pwd);
    });
    reqs.common = !commonPasswords.includes(pwd.toLowerCase());
    reqs.personal = !containsPersonalInfo(pwd, name, lastName, email);
    reqs.sequences = !/(.)\1{2,}/.test(pwd);
    return reqs;
  }, [formData?.password, formData?.name, formData?.lastName, formData?.email]);

  const getRoleDisplayName = (role: string) => {
    switch (role.toLowerCase()) {
      case 'dueño':
      case 'dueno':
        return 'Dueño';
      case 'admin':
        return 'Administrador';
      case 'vendedor':
        return 'Vendedor';
      case 'cliente':
        return 'Cliente';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Cargando usuario...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <FiAlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--danger-text)' }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Usuario no encontrado</h2>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>El usuario que buscas no existe o ha sido eliminado.</p>
          <button
            onClick={() => router.push('/admin/usuarios')}
            className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #ff5600, #e6004d)' }}
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  if (!formData) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b shadow-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 md:gap-4 py-4">
            <button
              onClick={() => router.push('/admin/usuarios')}
              className="p-2 rounded-lg transition-all duration-200 hover:scale-105 flex-shrink-0"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div
                className="p-2 rounded-lg flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #ff5600, #e6004d)',
                  color: 'white'
                }}
              >
                <FiEdit3 className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  Editar Usuario
                </h1>
                <p className="text-xs sm:text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                  {currentUser.nombre} {currentUser.apellido}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div
          className="rounded-xl shadow-lg overflow-hidden"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8">
            {/* User Info Header */}
            <div className="text-center mb-6 md:mb-8">
              <div
                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg mb-4"
                style={{ background: 'linear-gradient(135deg, #ff5600, #e6004d)' }}
              >
                {(currentUser.nombre?.[0] || '?')}{(currentUser.apellido?.[0] || '')}
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {currentUser.nombre} {currentUser.apellido}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ backgroundColor: 'var(--accent-bg)', color: '#ff5600' }}
                  >
                    {getRoleDisplayName(currentUser.rol)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Rol (solo visible para Dueño) */}
              {isOwner && (
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    <FiShield className="w-4 h-4" />
                    <span>Rol del usuario</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-orange-500"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  >
                    {(['dueño',  'admin', 'vendedor', 'cliente'] as const).map(r => (
                      <option key={r} value={r}>{getRoleDisplayName(r)}</option>
                    ))}
                  </select>
                </div>
              )}
              {/* Email */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  <FiMail className="w-4 h-4" />
                  <span>Email</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                    formErrors.email ? 'border-red-400 focus:border-red-500' : 'focus:border-orange-500'
                  }`}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: formErrors.email ? undefined : 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
                {formErrors.email && (
                  <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                    <FiAlertCircle className="w-4 h-4" />
                    {formErrors.email}
                  </div>
                )}
              </div>

              {/* Nombre */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  <FiUser className="w-4 h-4" />
                  <span>Nombre</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                    formErrors.name ? 'border-red-400 focus:border-red-500' : 'focus:border-orange-500'
                  }`}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: formErrors.name ? undefined : 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
                {formErrors.name && (
                  <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                    <FiAlertCircle className="w-4 h-4" />
                    {formErrors.name}
                  </div>
                )}
              </div>

              {/* Apellido */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  <FiUser className="w-4 h-4" />
                  <span>Apellido</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                    formErrors.lastName ? 'border-red-400 focus:border-red-500' : 'focus:border-orange-500'
                  }`}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: formErrors.lastName ? undefined : 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
                {formErrors.lastName && (
                  <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                    <FiAlertCircle className="w-4 h-4" />
                    {formErrors.lastName}
                  </div>
                )}
              </div>

              {/* Nueva contraseña */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  <FiLock className="w-4 h-4" />
                  <span>Nueva contraseña (opcional)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className={`w-full px-4 py-3 pr-12 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                      formErrors.password ? 'border-red-400 focus:border-red-500' : 'focus:border-orange-500'
                    }`}
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: formErrors.password ? undefined : 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    {showPassword ? (
                      <FiEyeOff className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                    ) : (
                      <FiEye className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                    )}
                  </button>
                </div>

                {/* Indicador de Fortaleza de Contraseña */}
                {formData.password && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Fortaleza:
                      </span>
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded"
                        style={{ backgroundColor: derivedPasswordStrength.color + '20', color: derivedPasswordStrength.color }}
                      >
                        {derivedPasswordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${derivedPasswordStrength.score}%`,
                          backgroundColor: derivedPasswordStrength.color
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Lista de Requisitos */}
                {formData.password && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Requisitos de seguridad:
                    </p>
                    {passwordRequirements.map((req) => (
                      <div key={req.key} className="flex items-center gap-2">
                        {derivedPasswordRequirementsStatus[req.key] ? (
                          <FiCheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        ) : (
                          <FiXCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                        )}
                        <span
                          className={`text-xs ${
                            derivedPasswordRequirementsStatus[req.key] ? 'text-green-600' : 'text-red-500'
                          }`}
                        >
                          {req.label}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      {derivedPasswordRequirementsStatus.common !== false ? (
                        <FiCheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      ) : (
                        <FiXCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                      )}
                      <span
                        className={`text-xs ${
                          derivedPasswordRequirementsStatus.common !== false ? 'text-green-600' : 'text-red-500'
                        }`}
                      >
                        No usar contraseñas comunes
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {derivedPasswordRequirementsStatus.personal !== false ? (
                        <FiCheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      ) : (
                        <FiXCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                      )}
                      <span
                        className={`text-xs ${
                          derivedPasswordRequirementsStatus.personal !== false ? 'text-green-600' : 'text-red-500'
                        }`}
                      >
                        No usar información personal
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {derivedPasswordRequirementsStatus.sequences !== false ? (
                        <FiCheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      ) : (
                        <FiXCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                      )}
                      <span
                        className={`text-xs ${
                          derivedPasswordRequirementsStatus.sequences !== false ? 'text-green-600' : 'text-red-500'
                        }`}
                      >
                        Evitar caracteres repetidos
                      </span>
                    </div>
                  </div>
                )}

                {formErrors.password && (
                  <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                    <FiAlertCircle className="w-4 h-4" />
                    {formErrors.password}
                  </div>
                )}
              </div>

              {/* Confirmar nueva contraseña */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  <FiLock className="w-4 h-4" />
                  <span>Confirmar nueva contraseña</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Repite la contraseña"
                    className={`w-full px-4 py-3 pr-12 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                      formErrors.confirmPassword ? 'border-red-400 focus:border-red-500' : 'focus:border-orange-500'
                    }`}
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: formErrors.confirmPassword ? undefined : 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                    ) : (
                      <FiEye className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                    )}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                    <FiAlertCircle className="w-4 h-4" />
                    {formErrors.confirmPassword}
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 mt-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => router.push('/admin/usuarios')}
                className="px-6 py-3 rounded-lg border transition-all duration-200 font-medium"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: isSubmitting
                    ? 'var(--bg-tertiary)'
                    : 'linear-gradient(135deg, #ff5600, #e6004d)'
                }}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <FiCheck className="w-5 h-5" />
                    Guardar cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}