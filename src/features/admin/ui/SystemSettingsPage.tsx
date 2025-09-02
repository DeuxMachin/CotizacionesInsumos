"use client";

import { useState } from "react";
import { FiSettings, FiDatabase, FiShield, FiGlobe, FiSave, FiRefreshCw } from "react-icons/fi";

interface SystemSettings {
  siteName: string;
  supportEmail: string;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  backupFrequency: string;
  maintenanceMode: boolean;
}

const defaultSettings: SystemSettings = {
  siteName: "Sistema de Cotizaciones",
  supportEmail: "soporte@empresa.com",
  allowRegistration: false,
  requireEmailVerification: true,
  sessionTimeout: 480, // minutos
  maxLoginAttempts: 5,
  backupFrequency: "daily",
  maintenanceMode: false,
};

export function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSettingChange = (key: keyof SystemSettings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setHasChanges(false);
    alert('Configuración guardada exitosamente');
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
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
            Configuración del Sistema
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Administra la configuración general y políticas de seguridad
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="btn-secondary flex items-center gap-2"
            disabled={isSaving}
          >
            <FiRefreshCw className="w-4 h-4" />
            Restablecer
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex items-center gap-2"
            disabled={!hasChanges || isSaving}
          >
            <FiSave className="w-4 h-4" />
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Alerta de cambios pendientes */}
      {hasChanges && (
        <div 
          className="p-4 rounded-lg border-l-4"
          style={{ 
            backgroundColor: 'var(--warning-bg)', 
            borderLeftColor: 'var(--warning)',
            color: 'var(--warning-text)'
          }}
        >
          <div className="flex items-center gap-2">
            <FiSettings className="w-5 h-5" />
            <span>
              Tienes cambios sin guardar. No olvides hacer clic en &quot;Guardar Cambios&quot;.
            </span>
          </div>
        </div>
      )}

      {/* Configuración General */}
      <div 
        className="p-6 rounded-lg space-y-6"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <FiGlobe className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Configuración General</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Nombre del Sitio
            </label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => handleSettingChange('siteName', e.target.value)}
              className="w-full p-2 rounded-md border"
              style={{ 
                backgroundColor: 'var(--bg-primary)', 
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
              placeholder="Sistema de Cotizaciones"
            />
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Email de Soporte
            </label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => handleSettingChange('supportEmail', e.target.value)}
              className="w-full p-2 rounded-md border"
              style={{ 
                backgroundColor: 'var(--bg-primary)', 
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
              placeholder="soporte@empresa.com"
            />
          </div>
        </div>
      </div>

      {/* Configuración de Seguridad */}
      <div 
        className="p-6 rounded-lg space-y-6"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <FiShield className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Configuración de Seguridad</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Tiempo de Sesión (minutos)
            </label>
            <input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
              className="input-field w-full"
              min="30"
              max="1440"
            />
            <p className="text-xs text-theme-secondary mt-1">
              Entre 30 minutos y 24 horas
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Máximo Intentos de Login
            </label>
            <input
              type="number"
              value={settings.maxLoginAttempts}
              onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
              className="input-field w-full"
              min="3"
              max="10"
            />
            <p className="text-xs text-theme-secondary mt-1">
              Entre 3 y 10 intentos
            </p>
          </div>
        </div>

        {/* Toggles de seguridad */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-theme-subtle">
            <div>
              <div className="font-medium text-theme-primary">Permitir Registro de Usuarios</div>
              <div className="text-sm text-theme-secondary">
                Los usuarios pueden crear cuentas nuevas sin invitación
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowRegistration}
                onChange={(e) => handleSettingChange('allowRegistration', e.target.checked)}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${
                settings.allowRegistration 
                  ? 'bg-orange-500' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.allowRegistration ? 'translate-x-5' : 'translate-x-0'
                } mt-0.5 ml-0.5`}></div>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-theme-subtle">
            <div>
              <div className="font-medium text-theme-primary">Verificación de Email</div>
              <div className="text-sm text-theme-secondary">
                Requerir verificación de email para nuevas cuentas
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireEmailVerification}
                onChange={(e) => handleSettingChange('requireEmailVerification', e.target.checked)}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${
                settings.requireEmailVerification 
                  ? 'bg-orange-500' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.requireEmailVerification ? 'translate-x-5' : 'translate-x-0'
                } mt-0.5 ml-0.5`}></div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Configuración del Sistema */}
      <div 
        className="p-6 rounded-lg space-y-6"
        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <FiDatabase className="w-5 h-5 text-theme-secondary" />
          <h3 className="text-lg font-semibold text-theme-primary">Configuración del Sistema</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Frecuencia de Backup
            </label>
            <select
              value={settings.backupFrequency}
              onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
              className="input-field w-full"
            >
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
              <option value="manual">Solo Manual</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-theme-subtle">
            <div>
              <div className="font-medium text-theme-primary">Modo Mantenimiento</div>
              <div className="text-sm text-theme-secondary">
                Bloquear acceso temporalmente para mantenimiento del sistema
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${
                settings.maintenanceMode 
                  ? 'bg-red-500' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                } mt-0.5 ml-0.5`}></div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Información del sistema */}
      <div 
        className="p-6 rounded-lg"
        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
      >
        <h3 className="text-lg font-semibold text-theme-primary mb-4">Información del Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-theme-secondary">Versión:</span>
            <span className="ml-2 text-theme-primary">v1.0.0</span>
          </div>
          <div>
            <span className="text-theme-secondary">Entorno:</span>
            <span className="ml-2 text-theme-primary">Desarrollo</span>
          </div>
          <div>
            <span className="text-theme-secondary">Base de Datos:</span>
            <span className="ml-2 text-theme-primary">Local Storage</span>
          </div>
        </div>
      </div>
    </div>
  );
}
