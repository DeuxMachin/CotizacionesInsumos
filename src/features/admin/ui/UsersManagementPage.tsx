"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/features/auth/model/useAuth";
import { useUsuarios } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { FiUsers, FiShield, FiEdit3, FiTrash2, FiPlus, FiMail, FiCalendar, FiEye, FiEyeOff, FiX, FiCheck, FiUser, FiLock, FiAlertCircle } from "react-icons/fi";

interface User {
  id: string;
  email: string;
  name: string;
  lastName: string;
  role: 'admin' | 'vendedor' | 'cliente';
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

interface NewUserForm {
  email: string;
  name: string;
  lastName: string;
  role: 'admin' | 'vendedor';
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

const roleOptions: Array<{ value: 'admin' | 'vendedor'; label: string; description: string }> = [
  { value: 'admin', label: 'Administrador', description: 'Acceso completo al sistema' },
  { value: 'vendedor', label: 'Vendedor', description: 'Gestión de cotizaciones y clientes' }
];

export function UsersManagementPage() {
  const { user: currentUser } = useAuth();
  // Cargar usuarios desde la BD
  const { data: dbUsers, loading: loadingUsers, error: loadError, refetch } = useUsuarios();
  const users: User[] = useMemo(() => {
    type DbUser = {
      id: string;
      email: string;
      nombre?: string | null;
      apellido?: string | null;
      rol: 'admin' | 'vendedor' | 'cliente';
      created_at?: string | null;
      last_login_at?: string | null;
      activo?: boolean | null;
    };
    return (dbUsers || []).map((u: DbUser) => ({
      id: u.id,
      email: u.email,
      name: u.nombre ?? '',
      lastName: u.apellido ?? '',
      role: u.rol as 'admin' | 'vendedor' | 'cliente',
      createdAt: new Date(u.created_at || Date.now()),
      lastLogin: u.last_login_at ? new Date(u.last_login_at) : undefined,
      isActive: Boolean(u.activo)
    }));
  }, [dbUsers]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<NewUserForm>(initialFormState);
  const [formErrors, setFormErrors] = useState<NewUserFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit modal state
  type EditUserForm = { email: string; name: string; lastName: string; password: string; confirmPassword: string };
  type EditUserFormErrors = Partial<Record<keyof EditUserForm, string>>;
  const [editFormData, setEditFormData] = useState<EditUserForm | null>(null);
  const [editFormErrors, setEditFormErrors] = useState<EditUserFormErrors>({});
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      email: user.email,
      name: user.name,
      lastName: user.lastName,
      password: '',
      confirmPassword: ''
    });
    setEditFormErrors({});
    setShowEditPassword(false);
    setShowEditConfirmPassword(false);
  };

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

    // Validar contraseña
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
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

      setFormData(initialFormState);
      setFormErrors({});
      setShowCreateModal(false);
      alert('Usuario creado exitosamente');
    } catch (error) {
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
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setFormErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'badge-red';
      case 'vendedor':
        return 'badge-blue';
      case 'cliente':
        return 'badge-gray';
      default:
        return 'badge-gray';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role.toLowerCase()) {
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

  const handleToggleStatus = async (userId: string) => {
    if (userId === currentUser?.id) {
      alert('No puedes desactivar tu propia cuenta');
      return;
    }

    try {
      const target = users.find(u => u.id === userId);
      if (!target) return;
      const { error } = await supabase
        .from('usuarios')
        .update({ activo: !target.isActive })
        .eq('id', userId);
      if (error) throw error;
      await refetch();
    } catch (e) {
      alert('No se pudo actualizar el estado');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      alert('No puedes eliminar tu propia cuenta');
      return;
    }

    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        const { error } = await supabase
          .from('usuarios')
          .delete()
          .eq('id', userId);
        if (error) throw error;
        await refetch();
      } catch (e) {
        alert('No se pudo eliminar el usuario');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-between items-start">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 md:gap-3" style={{ color: 'var(--text-primary)' }}>
            <div 
              className="p-1.5 md:p-2 rounded-lg"
              style={{ 
                background: 'linear-gradient(135deg, #ff5600, #e6004d)',
                color: 'white'
              }}
            >
              <FiUsers className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            Gestión de Vendedores
          </h1>
          <p className="mt-1 md:mt-2 text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
            Administra el equipo de vendedores y sus permisos en el sistema
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium text-white transition-all duration-200 shadow-md md:shadow-lg hover:shadow-xl hover:scale-105 text-sm md:text-base w-full sm:w-auto justify-center sm:justify-start"
          style={{ background: 'linear-gradient(135deg, #ff5600, #e6004d)' }}
        >
          <FiPlus className="w-3.5 h-3.5 md:w-4 md:h-4" />
          Nuevo Vendedor
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div 
          className="p-3 md:p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 md:gap-3">
            <div 
              className="p-1.5 md:p-2 rounded"
              style={{ 
                backgroundColor: 'var(--info-bg)',
                color: 'var(--info-text)'
              }}
            >
              <FiUsers className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div>
              <div 
                className="text-lg md:text-2xl font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {loadingUsers ? '—' : users.length}
              </div>
              <div 
                className="text-xs md:text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Total Usuarios
              </div>
            </div>
          </div>
        </div>
        
        <div 
          className="p-3 md:p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 md:gap-3">
            <div 
              className="p-1.5 md:p-2 rounded"
              style={{ 
                backgroundColor: 'var(--success-bg)',
                color: 'var(--success-text)'
              }}
            >
              <FiShield className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div>
              <div 
                className="text-lg md:text-2xl font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {loadingUsers ? '—' : users.filter(u => u.role === 'admin').length}
              </div>
              <div 
                className="text-xs md:text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Administradores
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-3 md:p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 md:gap-3">
            <div 
              className="p-1.5 md:p-2 rounded"
              style={{ 
                backgroundColor: 'var(--warning-bg)',
                color: 'var(--warning-text)'
              }}
            >
              <FiUsers className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div>
              <div 
                className="text-lg md:text-2xl font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {loadingUsers ? '—' : users.filter(u => u.isActive).length}
              </div>
              <div 
                className="text-xs md:text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Usuarios Activos
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-3 md:p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 md:gap-3">
            <div 
              className="p-1.5 md:p-2 rounded"
              style={{ 
                background: 'linear-gradient(135deg, #ff5600, #e6004d)',
                color: 'white'
              }}
            >
              <FiCalendar className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div>
              <div 
                className="text-lg md:text-2xl font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {loadingUsers ? '—' : users.filter(u => u.lastLogin && u.lastLogin > new Date(Date.now() - 24*60*60*1000)).length}
              </div>
              <div 
                className="text-xs md:text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Activos Hoy
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div 
        className="rounded-lg overflow-hidden"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <tr>
                <th 
                  className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Usuario
                </th>
                <th 
                  className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Rol
                </th>
                <th 
                  className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-medium hidden sm:table-cell"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Estado
                </th>
                <th 
                  className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-medium hidden md:table-cell"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Creado
                </th>
                <th 
                  className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-medium hidden lg:table-cell"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Último Acceso
                </th>
                <th 
                  className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr 
                  key={user.id}
                  className="transition-colors hover:opacity-80"
                  style={{ 
                    borderTop: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-primary)'
                  }}
                >
                  <td className="px-2 md:px-4 py-2 md:py-3">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div 
                        className="h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center font-medium text-white shadow-md text-xs md:text-base"
                        style={{ background: 'linear-gradient(135deg, #ff5600, #e6004d)' }}
                      >
                        {user.name[0].toUpperCase()}{user.lastName[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-xs md:text-sm" style={{ color: 'var(--text-primary)' }}>
                          {user.name} {user.lastName}
                        </div>
                        <div className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                          <FiMail className="w-2.5 h-2.5 md:w-3 md:h-3" />
                          <span className="truncate max-w-[100px] md:max-w-full">{user.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 md:px-4 py-2 md:py-3">
                    <span className={`badge ${getRoleBadgeColor(user.role)} text-xs`}>
                      {getRoleDisplayName(user.role)}
                    </span>
                  </td>
                  <td className="px-2 md:px-4 py-2 md:py-3 hidden sm:table-cell">
                    <span className={`badge ${user.isActive ? 'badge-green' : 'badge-gray'} text-xs`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-2 md:px-4 py-2 md:py-3 text-xs hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>
                    {user.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-2 md:px-4 py-2 md:py-3 text-xs hidden lg:table-cell" style={{ color: 'var(--text-secondary)' }}>
                    {user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Nunca'}
                  </td>
                  <td className="px-2 md:px-4 py-2 md:py-3">
                    <div className="flex items-center gap-1 md:gap-2">
                      <button
                        onClick={() => openEdit(user)}
                        className="p-1.5 md:p-2 rounded-lg transition-all duration-200 hover:scale-105"
                        style={{ 
                          backgroundColor: 'var(--info-bg)',
                          color: 'var(--info-text)'
                        }}
                        title="Editar usuario"
                      >
                        <FiEdit3 className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                      {user.id !== currentUser?.id && (
                        <>
                          <button
                            onClick={() => handleToggleStatus(user.id)}
                            className="p-1.5 md:p-2 rounded-lg transition-all duration-200 hover:scale-105"
                            style={{ 
                              backgroundColor: user.isActive ? 'var(--warning-bg)' : 'var(--success-bg)',
                              color: user.isActive ? 'var(--warning-text)' : 'var(--success-text)'
                            }}
                            title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            <FiShield className="w-3 h-3 md:w-4 md:h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1.5 md:p-2 rounded-lg transition-all duration-200 hover:scale-105"
                            style={{ 
                              backgroundColor: 'var(--danger-bg)',
                              color: 'var(--danger-text)'
                            }}
                            title="Eliminar usuario"
                          >
                            <FiTrash2 className="w-3 h-3 md:w-4 md:h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de creación */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/50 backdrop-blur-sm">
          <div 
            className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-xl shadow-2xl"
            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
          >
            {/* Header */}
            <div 
              className="p-4 md:p-6 border-b"
              style={{ 
                background: 'linear-gradient(135deg, #ff5600, #e6004d)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <FiUser className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-white">Crear Nuevo Vendedor</h3>
                    <p className="text-orange-100 text-xs md:text-sm">Complete todos los campos para crear el usuario</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Email */}
                <div className="md:col-span-2">
                  <label className="block text-xs md:text-sm font-semibold mb-1 md:mb-2" style={{ color: 'var(--text-primary)' }}>
                    <FiMail className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
                    Email corporativo *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="ejemplo@empresa.com"
                    className={`w-full px-3 md:px-4 py-2 md:py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
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
                    <div className="flex items-center gap-1 mt-1 md:mt-2 text-red-600 text-xs md:text-sm">
                      <FiAlertCircle className="w-3 h-3 md:w-4 md:h-4" />
                      {formErrors.email}
                    </div>
                  )}
                </div>

                {/* Nombre */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold mb-1 md:mb-2" style={{ color: 'var(--text-primary)' }}>
                    <FiUser className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Juan"
                    className={`w-full px-3 md:px-4 py-2 md:py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
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
                    <div className="flex items-center gap-1 mt-1 md:mt-2 text-red-600 text-xs md:text-sm">
                      <FiAlertCircle className="w-3 h-3 md:w-4 md:h-4" />
                      {formErrors.name}
                    </div>
                  )}
                </div>

                {/* Apellido */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold mb-1 md:mb-2" style={{ color: 'var(--text-primary)' }}>
                    <FiUser className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Pérez"
                    className={`w-full px-3 md:px-4 py-2 md:py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
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
                    <div className="flex items-center gap-1 mt-1 md:mt-2 text-red-600 text-xs md:text-sm">
                      <FiAlertCircle className="w-3 h-3 md:w-4 md:h-4" />
                      {formErrors.lastName}
                    </div>
                  )}
                </div>

                {/* Rol */}
                <div className="md:col-span-2">
                  <label className="block text-xs md:text-sm font-semibold mb-1 md:mb-2" style={{ color: 'var(--text-primary)' }}>
                    <FiShield className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
                    Rol del usuario *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                    {roleOptions.map((option) => (
                      <div
                        key={option.value}
                        onClick={() => handleInputChange('role', option.value)}
                        className={`p-3 md:p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
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
                        <div className="flex items-center justify-between mb-1 md:mb-2">
                          <span className="font-semibold text-xs md:text-sm">{option.label}</span>
                          {formData.role === option.value && (
                            <FiCheck className="w-4 h-4 md:w-5 md:h-5" style={{ color: '#ff5600' }} />
                          )}
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {option.description}
                        </p>
                      </div>
                    ))}
                  </div>
                  {formErrors.role && (
                    <div className="flex items-center gap-1 mt-1 md:mt-2 text-red-600 text-xs md:text-sm">
                      <FiAlertCircle className="w-3 h-3 md:w-4 md:h-4" />
                      {formErrors.role}
                    </div>
                  )}
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold mb-1 md:mb-2" style={{ color: 'var(--text-primary)' }}>
                    <FiLock className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
                    Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className={`w-full px-3 md:px-4 py-2 md:py-3 pr-10 md:pr-12 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
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
                      className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      {showPassword ? (
                        <FiEyeOff className="w-3 h-3 md:w-4 md:h-4" style={{ color: 'var(--text-secondary)' }} />
                      ) : (
                        <FiEye className="w-3 h-3 md:w-4 md:h-4" style={{ color: 'var(--text-secondary)' }} />
                      )}
                    </button>
                  </div>
                  {formErrors.password && (
                    <div className="flex items-center gap-1 mt-1 md:mt-2 text-red-600 text-xs md:text-sm">
                      <FiAlertCircle className="w-3 h-3 md:w-4 md:h-4" />
                      {formErrors.password}
                    </div>
                  )}
                </div>

                {/* Confirmar Contraseña */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold mb-1 md:mb-2" style={{ color: 'var(--text-primary)' }}>
                    <FiLock className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
                    Confirmar contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Repite la contraseña"
                      className={`w-full px-3 md:px-4 py-2 md:py-3 pr-10 md:pr-12 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
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
                      className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      {showConfirmPassword ? (
                        <FiEyeOff className="w-3 h-3 md:w-4 md:h-4" style={{ color: 'var(--text-secondary)' }} />
                      ) : (
                        <FiEye className="w-3 h-3 md:w-4 md:h-4" style={{ color: 'var(--text-secondary)' }} />
                      )}
                    </button>
                  </div>
                  {formErrors.confirmPassword && (
                    <div className="flex items-center gap-1 mt-1 md:mt-2 text-red-600 text-xs md:text-sm">
                      <FiAlertCircle className="w-3 h-3 md:w-4 md:h-4" />
                      {formErrors.confirmPassword}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-end pt-4 md:pt-6 mt-4 md:mt-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 md:px-6 py-2 md:py-3 rounded-lg border transition-all duration-200 font-medium text-xs md:text-sm"
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
                  className="px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium text-white transition-all duration-200 flex items-center justify-center gap-1.5 md:gap-2 shadow-md md:shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
                  style={{ 
                    background: isSubmitting 
                      ? 'var(--bg-tertiary)' 
                      : 'linear-gradient(135deg, #ff5600, #e6004d)'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4 md:w-5 md:h-5" />
                      Crear Vendedor
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

  {/* Modal de edición */}
  {editingUser && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/50 backdrop-blur-sm">
          <div 
            className="w-full max-w-md rounded-xl shadow-2xl"
            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
          >
            {/* Header */}
            <div 
              className="p-4 md:p-6 border-b"
              style={{ 
                background: 'linear-gradient(135deg, #ff5600, #e6004d)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <FiEdit3 className="w-4 h-4 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-xl font-bold text-white">Editar Usuario</h3>
                    <p className="text-orange-100 text-xs md:text-sm">{editingUser.name} {editingUser.lastName}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setEditingUser(null); setEditFormData(null); }}
                  className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                >
                  <FiX className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editingUser || !editFormData) return;

                // Validate
                const errs: EditUserFormErrors = {};
                if (!editFormData.email || !/^([^\s@]+)@([^\s@]+)\.[^\s@]+$/.test(editFormData.email)) {
                  errs.email = 'Email inválido';
                } else if ((dbUsers || []).some((u: { id: string; email: string }) => u.email === editFormData.email && u.id !== editingUser.id)) {
                  errs.email = 'Este email ya está registrado';
                }
                if (!editFormData.name || editFormData.name.trim().length < 2) {
                  errs.name = 'El nombre debe tener al menos 2 caracteres';
                }
                if (!editFormData.lastName || editFormData.lastName.trim().length < 2) {
                  errs.lastName = 'El apellido debe tener al menos 2 caracteres';
                }
                if (editFormData.password || editFormData.confirmPassword) {
                  if ((editFormData.password || '').length < 6) {
                    errs.password = 'La contraseña debe tener al menos 6 caracteres';
                  }
                  if (editFormData.password !== editFormData.confirmPassword) {
                    errs.confirmPassword = 'Las contraseñas no coinciden';
                  }
                }
                setEditFormErrors(errs);
                if (Object.keys(errs).length > 0) return;

                setIsEditing(true);
                try {
                  const payload: Record<string, unknown> = {
                    email: editFormData.email,
                    nombre: editFormData.name,
                    apellido: editFormData.lastName
                  };
                  if (editFormData.password) {
                    const newHash = await bcrypt.hash(editFormData.password, 10);
                    (payload as { password_hash?: string }).password_hash = newHash;
                    (payload as { password_updated_at?: string }).password_updated_at = new Date().toISOString();
                  }

                  const { error } = await supabase
                    .from('usuarios')
                    .update(payload)
                    .eq('id', editingUser.id);
                  if (error) throw error;

                  await refetch();
                  alert('Usuario actualizado');
                  setEditingUser(null);
                  setEditFormData(null);
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : 'Error al actualizar el usuario';
                  alert(msg);
                } finally {
                  setIsEditing(false);
                }
              }}
              className="p-4 md:p-6"
            >
              <div className="text-center mb-4 md:mb-6">
                <div 
                  className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full flex items-center justify-center text-xl md:text-2xl font-bold text-white shadow-lg mb-3 md:mb-4"
                  style={{ background: 'linear-gradient(135deg, #ff5600, #e6004d)' }}
                >
                  {editingUser.name[0]}{editingUser.lastName[0]}
                </div>
                <div className="space-y-1 md:space-y-2">
                  <p className="font-semibold text-sm md:text-base" style={{ color: 'var(--text-primary)' }}>
                    {editingUser.name} {editingUser.lastName}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span 
                      className="px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: 'var(--accent-bg)', color: '#ff5600' }}
                    >
                      {getRoleDisplayName(editingUser.role)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:gap-5">
                {/* Email */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold mb-1 md:mb-2" style={{ color: 'var(--text-primary)' }}>
                    <FiMail className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData(prev => prev ? { ...prev, email: e.target.value } : prev)}
                    className={`w-full px-3 md:px-4 py-2 md:py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                      editFormErrors.email ? 'border-red-400 focus:border-red-500' : 'focus:border-orange-500'
                    }`}
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: editFormErrors.email ? undefined : 'var(--border)', color: 'var(--text-primary)' }}
                  />
                  {editFormErrors.email && (
                    <div className="flex items-center gap-1 mt-1 md:mt-2 text-red-600 text-xs md:text-sm">
                      <FiAlertCircle className="w-3 h-3 md:w-4 md:h-4" />
                      {editFormErrors.email}
                    </div>
                  )}
                </div>

                {/* Nombre */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold mb-1 md:mb-2" style={{ color: 'var(--text-primary)' }}>
                    <FiUser className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => prev ? { ...prev, name: e.target.value } : prev)}
                    className={`w-full px-3 md:px-4 py-2 md:py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                      editFormErrors.name ? 'border-red-400 focus:border-red-500' : 'focus:border-orange-500'
                    }`}
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: editFormErrors.name ? undefined : 'var(--border)', color: 'var(--text-primary)' }}
                  />
                  {editFormErrors.name && (
                    <div className="flex items-center gap-1 mt-1 md:mt-2 text-red-600 text-xs md:text-sm">
                      <FiAlertCircle className="w-3 h-3 md:w-4 md:h-4" />
                      {editFormErrors.name}
                    </div>
                  )}
                </div>

                {/* Apellido */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold mb-1 md:mb-2" style={{ color: 'var(--text-primary)' }}>
                    <FiUser className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData(prev => prev ? { ...prev, lastName: e.target.value } : prev)}
                    className={`w-full px-3 md:px-4 py-2 md:py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                      editFormErrors.lastName ? 'border-red-400 focus:border-red-500' : 'focus:border-orange-500'
                    }`}
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: editFormErrors.lastName ? undefined : 'var(--border)', color: 'var(--text-primary)' }}
                  />
                  {editFormErrors.lastName && (
                    <div className="flex items-center gap-1 mt-1 md:mt-2 text-red-600 text-xs md:text-sm">
                      <FiAlertCircle className="w-3 h-3 md:w-4 md:h-4" />
                      {editFormErrors.lastName}
                    </div>
                  )}
                </div>

                {/* Nueva contraseña */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold mb-1 md:mb-2" style={{ color: 'var(--text-primary)' }}>
                    <FiLock className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
                    Nueva contraseña (opcional)
                  </label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={editFormData.password}
                      onChange={(e) => setEditFormData(prev => prev ? { ...prev, password: e.target.value } : prev)}
                      placeholder="Mínimo 6 caracteres"
                      className={`w-full px-3 md:px-4 py-2 md:py-3 pr-10 md:pr-12 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                        editFormErrors.password ? 'border-red-400 focus:border-red-500' : 'focus:border-orange-500'
                      }`}
                      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: editFormErrors.password ? undefined : 'var(--border)', color: 'var(--text-primary)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      {showEditPassword ? (
                        <FiEyeOff className="w-3 h-3 md:w-4 md:h-4" style={{ color: 'var(--text-secondary)' }} />
                      ) : (
                        <FiEye className="w-3 h-3 md:w-4 md:h-4" style={{ color: 'var(--text-secondary)' }} />
                      )}
                    </button>
                  </div>
                  {editFormErrors.password && (
                    <div className="flex items-center gap-1 mt-1 md:mt-2 text-red-600 text-xs md:text-sm">
                      <FiAlertCircle className="w-3 h-3 md:w-4 md:h-4" />
                      {editFormErrors.password}
                    </div>
                  )}
                </div>

                {/* Confirmar nueva contraseña */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold mb-1 md:mb-2" style={{ color: 'var(--text-primary)' }}>
                    <FiLock className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
                    Confirmar nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showEditConfirmPassword ? 'text' : 'password'}
                      value={editFormData.confirmPassword}
                      onChange={(e) => setEditFormData(prev => prev ? { ...prev, confirmPassword: e.target.value } : prev)}
                      placeholder="Repite la contraseña"
                      className={`w-full px-3 md:px-4 py-2 md:py-3 pr-10 md:pr-12 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                        editFormErrors.confirmPassword ? 'border-red-400 focus:border-red-500' : 'focus:border-orange-500'
                      }`}
                      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: editFormErrors.confirmPassword ? undefined : 'var(--border)', color: 'var(--text-primary)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditConfirmPassword(!showEditConfirmPassword)}
                      className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      {showEditConfirmPassword ? (
                        <FiEyeOff className="w-3 h-3 md:w-4 md:h-4" style={{ color: 'var(--text-secondary)' }} />
                      ) : (
                        <FiEye className="w-3 h-3 md:w-4 md:h-4" style={{ color: 'var(--text-secondary)' }} />
                      )}
                    </button>
                  </div>
                  {editFormErrors.confirmPassword && (
                    <div className="flex items-center gap-1 mt-1 md:mt-2 text-red-600 text-xs md:text-sm">
                      <FiAlertCircle className="w-3 h-3 md:w-4 md:h-4" />
                      {editFormErrors.confirmPassword}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 md:gap-3 justify-end pt-4 mt-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => { setEditingUser(null); setEditFormData(null); }}
                  className="px-4 md:px-6 py-2 md:py-3 rounded-lg border font-medium transition-all duration-200 text-xs md:text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-md md:shadow-lg hover:shadow-xl disabled:opacity-50 text-xs md:text-sm"
                  style={{ background: isEditing ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #ff5600, #e6004d)' }}
                >
                  {isEditing ? (
                    <>
                      <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4 md:w-5 md:h-5" />
                      Guardar cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
