"use client";

import { useState } from "react";
import { AuditLogsPage } from "./AuditLogsPage";
import { UsersManagementPage } from "./UsersManagementPage";
import { SystemSettingsPage } from "./SystemSettingsPage";
import { FiActivity, FiUsers, FiSettings } from "react-icons/fi";

type AdminTab = 'audit' | 'users' | 'settings';

const adminTabs = [
  {
    key: 'audit' as AdminTab,
    label: 'Registro de Auditoría',
    icon: FiActivity,
    description: 'Monitoreo de actividad del sistema'
  },
  {
    key: 'users' as AdminTab,
    label: 'Gestión de Usuarios',
    icon: FiUsers,
    description: 'Administración de usuarios y roles'
  },
  {
    key: 'settings' as AdminTab,
    label: 'Configuración',
    icon: FiSettings,
    description: 'Ajustes del sistema'
  }
];

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('audit');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header del panel */}
      <div className="space-y-2">
        <h1 
          className="text-3xl font-bold" 
          style={{ color: 'var(--text-primary)' }}
        >
          Panel de Administración
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Gestiona usuarios, supervisa actividad y configura el sistema
        </p>
      </div>

      {/* Tabs de navegación */}
      <div 
        className="rounded-lg p-1"
        style={{ 
          backgroundColor: 'var(--bg-primary)', 
          border: '1px solid var(--border-subtle)' 
        }}
      >
        <nav className="flex space-x-1" role="tablist">
          {adminTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all
                `}
                style={isActive 
                  ? { 
                      backgroundColor: 'var(--accent-primary)', 
                      color: 'white',
                      boxShadow: 'var(--shadow-sm)' 
                    } 
                  : { 
                      color: 'var(--text-secondary)'
                    }
                }
                onMouseEnter={!isActive ? (e) => {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                } : undefined}
                onMouseLeave={!isActive ? (e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.backgroundColor = '';
                } : undefined}
                role="tab"
                aria-selected={isActive}
                title={tab.description}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">
                  {tab.key === 'audit' ? 'Auditoría' : tab.key === 'users' ? 'Usuarios' : 'Config'}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenido del tab activo */}
      <div role="tabpanel">
        {activeTab === 'audit' && <AuditLogsPage />}
        {activeTab === 'users' && <UsersManagementPage />}
        {activeTab === 'settings' && <SystemSettingsPage />}
      </div>
    </div>
  );
}
