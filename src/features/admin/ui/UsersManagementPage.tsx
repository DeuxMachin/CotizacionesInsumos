"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useUsuarios } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { FiUsers, FiShield, FiEdit3, FiTrash2, FiPlus, FiMail, FiCalendar, FiUserCheck, FiUserX } from "react-icons/fi";

interface User {
  id: string;
  email: string;
  name: string;
  lastName: string;
  role: 'dueño' | 'dueno' | 'admin' | 'vendedor' | 'cliente';
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export function UsersManagementPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  // Cargar usuarios desde la BD
  const { data: dbUsers, loading: loadingUsers, refetch } = useUsuarios();
  const users: User[] = useMemo(() => {
    type DbUser = {
      id: string;
      email: string;
      nombre?: string | null;
      apellido?: string | null;
  rol: 'dueño' |  'admin' | 'vendedor' | 'cliente';
      created_at?: string | null;
      last_login_at?: string | null;
      activo?: boolean | null;
    };
    return (dbUsers || []).map((u: DbUser) => ({
      id: u.id,
      email: u.email,
      name: u.nombre ?? '',
      lastName: u.apellido ?? '',
  role: u.rol as 'dueño' | 'dueno' | 'admin' | 'vendedor' | 'cliente',
      createdAt: new Date(u.created_at || Date.now()),
      lastLogin: u.last_login_at ? new Date(u.last_login_at) : undefined,
      isActive: Boolean(u.activo)
    }));
  }, [dbUsers]);

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'dueño':
      case 'dueno':
        return 'badge-purple';
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

  const handleToggleStatus = async (userId: string) => {
    if (userId === currentUser?.id) {
      alert('No puedes desactivar tu propia cuenta');
      return;
    }

    try {
      const target = users.find(u => u.id === userId);
      if (!target) return;
      // Optional confirm to make intent clearer for users
      const confirmed = confirm(target.isActive ? '¿Desactivar este usuario? No podrá iniciar sesión.' : '¿Activar este usuario?');
      if (!confirmed) return;
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
            Gestión de Usuarios
          </h1>
          <p className="mt-1 md:mt-2 text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
            Administra el equipo de usuarios y sus permisos en el sistema
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/usuarios/crear')}
          className="flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium text-white transition-all duration-200 shadow-md md:shadow-lg hover:shadow-xl hover:scale-105 text-sm md:text-base w-full sm:w-auto justify-center sm:justify-start"
          style={{ background: 'linear-gradient(135deg, #ff5600, #e6004d)' }}
        >
          <FiPlus className="w-3.5 h-3.5 md:w-4 md:h-4" />
          Nuevo Usuario
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
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
                {loadingUsers ? '—' : users.filter(u => (u.role === 'dueño' || u.role === 'dueno')).length}
              </div>
              <div 
                className="text-xs md:text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Dueños
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
                backgroundColor: 'var(--info-bg)',
                color: 'var(--info-text)'
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
                        onClick={() => router.push(`/admin/usuarios/${user.id}/editar`)}
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
                            className="px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg transition-all duration-200 hover:scale-[1.02] flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                            style={{ 
                              backgroundColor: user.isActive ? 'var(--warning-bg)' : 'var(--success-bg)',
                              color: user.isActive ? 'var(--warning-text)' : 'var(--success-text)'
                            }}
                            title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                            aria-label={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            {user.isActive ? (
                              <>
                                <FiUserX className="w-3 h-3 md:w-4 md:h-4" />
                                <span className="hidden sm:inline">Desactivar</span>
                              </>
                            ) : (
                              <>
                                <FiUserCheck className="w-3 h-3 md:w-4 md:h-4" />
                                <span className="hidden sm:inline">Activar</span>
                              </>
                            )}
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
    </div>
  );
}
