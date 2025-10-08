"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUsuarios } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import bcrypt from "bcryptjs";
import { isCommonPassword, validatePassword } from "@/lib/auth/passwordPolicy";
import { FiMail, FiUser, FiShield, FiLock, FiEye, FiEyeOff, FiCheck, FiAlertCircle, FiArrowLeft, FiCheckCircle, FiXCircle } from "react-icons/fi";

interface NewUserForm {
  email: string;
  name: string;
  lastName: string;
  role: 'dueño' | 'dueno' | 'admin' | 'vendedor';
  password: string;
  confirmPassword: string;
}

type NewUserFormErrors = Partial<Record<keyof NewUserForm, string>>;

const initialFormState: NewUserForm = {
  email: '',
  name: '',
  lastName: '',
  role: 'vendedor',
  password: '',
  confirmPassword: ''
};

const getRoleOptions = (userRole: string) => {
  if (['dueño', 'dueno'].includes(userRole.toLowerCase())) {
    return [
      { value: 'dueño' as const, label: 'Dueño', description: 'Acceso total al sistema' },
      { value: 'admin' as const, label: 'Administrador', description: 'Acceso completo al sistema' },
      { value: 'vendedor' as const, label: 'Vendedor', description: 'Gestión de cotizaciones y clientes' }
    ];
  } else if (userRole.toLowerCase() === 'admin') {
    return [
      { value: 'vendedor' as const, label: 'Vendedor', description: 'Gestión de cotizaciones y clientes' }
    ];
  }
  return [];
};

// Lista de contraseñas comunes centralizada en passwordPolicy

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
  if (isCommonPassword(password)) score -= 50;

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

export function CreateUserForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: dbUsers, refetch } = useUsuarios();
  const [formData, setFormData] = useState<NewUserForm>(initialFormState);
  const [formErrors, setFormErrors] = useState<NewUserFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });
  const [passwordRequirementsStatus, setPasswordRequirementsStatus] = useState<Record<string, boolean>>({});

  const users = (dbUsers || []).map((u: DbUser) => ({
    id: u.id,
    email: u.email,
    name: u.nombre ?? '',
    lastName: u.apellido ?? '',
    role: u.rol as 'admin' | 'vendedor' | 'cliente'
  }));

  const validateForm = (): boolean => {
    const errors: NewUserFormErrors = {};

    // Validar email
    if (!formData.email) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'El formato del email no es válido';
    } else if (users.some(u => u.email === formData.email)) {
      errors.email = 'Este email ya está registrado';
    }

    // Validar nombre
    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    // Validar apellido
    if (!formData.lastName.trim()) {
      errors.lastName = 'El apellido es requerido';
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'El apellido debe tener al menos 2 caracteres';
    }

    // Validar rol
    if (!formData.role) {
      errors.role = 'Debes seleccionar un rol';
    }

    // Validar contraseña con requisitos avanzados
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

      // Verificar contraseñas comunes (política central)
      if (isCommonPassword(formData.password)) {
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

      // Validación central adicional (longitud 6-128 y común)
      const policy = validatePassword(formData.password);
      if (!policy.valid && policy.error) {
        errorsList.push(policy.error);
      }

      if (errorsList.length > 0) {
        errors.password = errorsList.join('. ');
      }
    }

    // Validar confirmación de contraseña
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Debes confirmar la contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Hashear contraseña en el cliente (para simplificar). Alternativa: mover a una API route.
      const passwordHash = await bcrypt.hash(formData.password, 10);

      const { error: insertError } = await supabase
        .from('usuarios')
        .insert({
          email: formData.email,
          nombre: formData.name,
          apellido: formData.lastName,
          rol: formData.role,
          password_hash: passwordHash,
          activo: true
        });

      if (insertError) throw insertError;

      // Refrescar lista
      await refetch();

      alert('Usuario creado exitosamente');
      router.push('/admin/usuarios');
    } catch (_error) {
      alert('Error al crear el usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof NewUserForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Limpiar error del campo cuando el usuario empieza a escribir
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Actualizar fortaleza de contraseña en tiempo real
    if (field === 'password') {
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);

      // Verificar requisitos individuales
      const requirements: Record<string, boolean> = {};
      passwordRequirements.forEach(req => {
        requirements[req.key] = req.regex.test(value);
      });

      // Verificaciones adicionales
  requirements.common = !isCommonPassword(value);
      requirements.personal = !containsPersonalInfo(value, formData.name, formData.lastName, formData.email);
      requirements.sequences = !/(.)\1{2,}/.test(value);

      setPasswordRequirementsStatus(requirements);
    }

    // Si cambiamos nombre, apellido o email, actualizar verificación de información personal
    if (['name', 'lastName', 'email'].includes(field)) {
      const requirements = { ...passwordRequirementsStatus };
      requirements.personal = !containsPersonalInfo(formData.password, field === 'name' ? value : formData.name, field === 'lastName' ? value : formData.lastName, field === 'email' ? value : formData.email);
      setPasswordRequirementsStatus(requirements);
    }
  };

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
                <FiUser className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  Crear Nuevo Usuario
                </h1>
                <p className="text-xs sm:text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                  Complete todos los campos para crear el usuario
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Email */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  <FiMail className="w-4 h-4" />
                  <span>Email corporativo *</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="ejemplo@empresa.com"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                    formErrors.email
                      ? 'border-red-400 focus:border-red-500'
                      : 'focus:border-orange-500'
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
                  <span>Nombre *</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Juan"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                    formErrors.name
                      ? 'border-red-400 focus:border-red-500'
                      : 'focus:border-orange-500'
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
                  <span>Apellido *</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Pérez"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                    formErrors.lastName
                      ? 'border-red-400 focus:border-red-500'
                      : 'focus:border-orange-500'
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

              {/* Rol */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  <FiShield className="w-4 h-4" />
                  <span>Rol del usuario *</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getRoleOptions(user?.role || '').map((option) => (
                    <div
                      key={option.value}
                      onClick={() => handleInputChange('role', option.value)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        formData.role === option.value
                          ? 'border-orange-500 shadow-md'
                          : ''
                      }`}
                      style={{
                        backgroundColor: formData.role === option.value ? 'var(--accent-bg)' : 'var(--bg-secondary)',
                        borderColor: formData.role === option.value ? '#ff5600' : 'var(--border)',
                        color: formData.role === option.value ? '#ff5600' : 'var(--text-primary)'
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">{option.label}</span>
                        {formData.role === option.value && (
                          <FiCheck className="w-5 h-5" style={{ color: '#ff5600' }} />
                        )}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {option.description}
                      </p>
                    </div>
                  ))}
                </div>
                {formErrors.role && (
                  <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                    <FiAlertCircle className="w-4 h-4" />
                    {formErrors.role}
                  </div>
                )}
              </div>

              {/* Contraseña */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  <FiLock className="w-4 h-4" />
                  <span>Contraseña *</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Crea una contraseña segura"
                    className={`w-full px-4 py-3 pr-12 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                      formErrors.password
                        ? 'border-red-400 focus:border-red-500'
                        : 'focus:border-orange-500'
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

                {/* Indicador de Fortaleza */}
                {formData.password && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Fortaleza:
                      </span>
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded"
                        style={{ backgroundColor: passwordStrength.color + '20', color: passwordStrength.color }}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${passwordStrength.score}%`,
                          backgroundColor: passwordStrength.color
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
                        {passwordRequirementsStatus[req.key] ? (
                          <FiCheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        ) : (
                          <FiXCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                        )}
                        <span
                          className={`text-xs ${
                            passwordRequirementsStatus[req.key] ? 'text-green-600' : 'text-red-500'
                          }`}
                        >
                          {req.label}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      {passwordRequirementsStatus.common !== false ? (
                        <FiCheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      ) : (
                        <FiXCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                      )}
                      <span
                        className={`text-xs ${
                          passwordRequirementsStatus.common !== false ? 'text-green-600' : 'text-red-500'
                        }`}
                      >
                        No usar contraseñas comunes
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordRequirementsStatus.personal !== false ? (
                        <FiCheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      ) : (
                        <FiXCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                      )}
                      <span
                        className={`text-xs ${
                          passwordRequirementsStatus.personal !== false ? 'text-green-600' : 'text-red-500'
                        }`}
                      >
                        No usar información personal
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordRequirementsStatus.sequences !== false ? (
                        <FiCheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      ) : (
                        <FiXCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                      )}
                      <span
                        className={`text-xs ${
                          passwordRequirementsStatus.sequences !== false ? 'text-green-600' : 'text-red-500'
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

              {/* Confirmar Contraseña */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  <FiLock className="w-4 h-4" />
                  <span>Confirmar contraseña *</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Repite la contraseña"
                    className={`w-full px-4 py-3 pr-12 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                      formErrors.confirmPassword
                        ? 'border-red-400 focus:border-red-500'
                        : 'focus:border-orange-500'
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
                    Creando...
                  </>
                ) : (
                  <>
                    <FiCheck className="w-5 h-5" />
                    Crear Vendedor
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