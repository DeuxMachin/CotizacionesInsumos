"use client";

import { useState } from "react";
import { useAuth } from "@/features/auth/model/useAuth";
import { FiUsers, FiShield, FiEdit3, FiTrash2, FiPlus, FiMail, FiCalendar } from "react-icons/fi";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

// Datos mock de usuarios para localhost
const mockUsers: User[] = [
  {
    id: "1",
    email: "admin@empresa.com",
    name: "Administrador",
    role: "admin",
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
    isActive: true
  },
  {
    id: "2",
    email: "user@empresa.com",
    name: "Usuario Estándar",
    role: "user",
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
    isActive: true
  },
  {
    id: "3",
    email: "demo@empresa.com",
    name: "Usuario Demo",
    role: "demo",
    createdAt: new Date('2024-02-01'),
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 día atrás
    isActive: true
  }
];

export function UsersManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'badge-red';
      case 'user':
        return 'badge-blue';
      case 'demo':
        return 'badge-gray';
      default:
        return 'badge-gray';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'Administrador';
      case 'user':
        return 'Usuario';
      case 'demo':
        return 'Demo';
      default:
        return role;
    }
  };

  const handleToggleStatus = (userId: string) => {
    if (userId === currentUser?.id) {
      alert('No puedes desactivar tu propia cuenta');
      return;
    }
    
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, isActive: !u.isActive } : u
    ));
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      alert('No puedes eliminar tu propia cuenta');
      return;
    }

    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div>
          <h2 
            className="text-2xl font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Gestión de Usuarios
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Administra usuarios, roles y permisos del sistema
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded"
              style={{ 
                backgroundColor: 'var(--info-bg)',
                color: 'var(--info-text)'
              }}
            >
              <FiUsers className="w-5 h-5" />
            </div>
            <div>
              <div 
                className="text-2xl font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {users.length}
              </div>
              <div 
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Total Usuarios
              </div>
            </div>
          </div>
        </div>
        
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded"
              style={{ 
                backgroundColor: 'var(--success-bg)',
                color: 'var(--success-text)'
              }}
            >
              <FiShield className="w-5 h-5" />
            </div>
            <div>
              <div 
                className="text-2xl font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {users.filter(u => u.role === 'admin').length}
              </div>
              <div 
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Administradores
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded"
              style={{ 
                backgroundColor: 'var(--warning-bg)',
                color: 'var(--warning-text)'
              }}
            >
              <FiUsers className="w-5 h-5" />
            </div>
            <div>
              <div 
                className="text-2xl font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {users.filter(u => u.isActive).length}
              </div>
              <div 
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Usuarios Activos
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded"
              style={{ 
                backgroundColor: '#f3e8ff', // purple-100
                color: '#7e22ce'  // purple-700
              }}
            >
              <FiCalendar className="w-5 h-5" />
            </div>
            <div>
              <div 
                className="text-2xl font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {users.filter(u => u.lastLogin && u.lastLogin > new Date(Date.now() - 24*60*60*1000)).length}
              </div>
              <div 
                className="text-sm"
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
                  className="px-4 py-3 text-left text-sm font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Usuario
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Rol
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-secondary">Estado</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-secondary">Creado</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-secondary">Último Acceso</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-secondary">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr 
                  key={user.id}
                  className="hover:bg-theme-secondary/50 transition-colors"
                  style={{ borderTop: '1px solid var(--border-subtle)' }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-theme-accent text-orange-600 dark:text-orange-400 flex items-center justify-center font-medium">
                        {user.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-theme-primary">{user.name}</div>
                        <div className="text-sm text-theme-secondary flex items-center gap-1">
                          <FiMail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${getRoleBadgeColor(user.role)}`}>
                      {getRoleDisplayName(user.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${user.isActive ? 'badge-green' : 'badge-gray'}`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-theme-secondary">
                    {user.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-theme-secondary">
                    {user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Nunca'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="btn-icon-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        title="Editar usuario"
                      >
                        <FiEdit3 className="w-4 h-4" />
                      </button>
                      {user.id !== currentUser?.id && (
                        <>
                          <button
                            onClick={() => handleToggleStatus(user.id)}
                            className={`btn-icon-sm ${user.isActive 
                              ? 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' 
                              : 'hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400'
                            }`}
                            title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            <FiShield className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="btn-icon-sm hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                            title="Eliminar usuario"
                          >
                            <FiTrash2 className="w-4 h-4" />
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

      {/* Modal de creación (placeholder) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div 
            className="w-full max-w-md rounded-lg p-6"
            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
          >
            <h3 className="text-lg font-semibold text-theme-primary mb-4">Crear Nuevo Usuario</h3>
            <p className="text-theme-secondary mb-6">
              Funcionalidad disponible cuando se conecte con la base de datos.
            </p>
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición (placeholder) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div 
            className="w-full max-w-md rounded-lg p-6"
            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
          >
            <h3 className="text-lg font-semibold text-theme-primary mb-4">
              Editar Usuario: {editingUser.name}
            </h3>
            <p className="text-theme-secondary mb-6">
              Funcionalidad completa disponible cuando se conecte con la base de datos.
            </p>
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setEditingUser(null)}
                className="btn-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
