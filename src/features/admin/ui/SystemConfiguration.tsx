"use client";

import { useState } from "react";
import { FiSave, FiRefreshCw, FiGlobe, FiMail, FiClock, FiToggleLeft, FiToggleRight, FiCheck, FiSettings } from "react-icons/fi";

interface SystemSettings {
  siteName: string;
  supportEmail: string;
  defaultLanguage: string;
  timezone: string;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  maintenanceMode: boolean;
  sessionTimeout: number;
  itemsPerPage: number;
}

const defaultSettings: SystemSettings = {
  siteName: "Sistema de Cotizaciones Empresariales",
  supportEmail: "soporte@empresa.com",
  defaultLanguage: "es",
  timezone: "America/Mexico_City",
  allowRegistration: false,
  requireEmailVerification: true,
  maintenanceMode: false,
  sessionTimeout: 480, // 8 horas en minutos
  itemsPerPage: 25,
};

const languages = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' }
];

const timezones = [
  'America/Mexico_City',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/Madrid',
  'UTC'
];

export function SystemConfiguration() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSettingChange = <K extends keyof SystemSettings>(
    key: K, 
    value: SystemSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1500));
      setHasChanges(false);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (error) {
      console.error('Error al guardar configuración:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('¿Estás seguro de que quieres restaurar la configuración por defecto?')) {
      setSettings(defaultSettings);
      setHasChanges(true);
    }
  };

  const ToggleSwitch = ({ 
    enabled, 
    onChange, 
    label 
  }: { 
    enabled: boolean; 
    onChange: (value: boolean) => void;
    label: string;
  }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}
      `}
      aria-label={label}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );

  return (
    <div className="space-y-8 max-w-4xl animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
              <FiSettings className="w-6 h-6" />
            </div>
            Configuración del Sistema
          </h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            Personaliza la configuración general del sistema y ajusta las preferencias
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="btn-secondary flex items-center gap-2"
            disabled={isSaving}
          >
            <FiRefreshCw className="w-4 h-4" />
            Restaurar por Defecto
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`
              btn-primary flex items-center gap-2
              ${(!hasChanges || isSaving) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : savedMessage ? (
              <>
                <FiCheck className="w-4 h-4" />
                ¡Guardado!
              </>
            ) : (
              <>
                <FiSave className="w-4 h-4" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>

      {/* Configuration Sections */}
      <div className="grid gap-8">
        {/* General Settings */}
        <div 
          className="p-6 rounded-xl"
          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FiGlobe className="w-5 h-5 text-blue-500" />
            Configuración General
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Nombre del Sistema
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => handleSettingChange('siteName', e.target.value)}
                className="input-field"
                placeholder="Nombre que aparecerá en el sistema"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Email de Soporte
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => handleSettingChange('supportEmail', e.target.value)}
                className="input-field"
                placeholder="soporte@empresa.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Idioma por Defecto
              </label>
              <select
                value={settings.defaultLanguage}
                onChange={(e) => handleSettingChange('defaultLanguage', e.target.value)}
                className="input-field"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Zona Horaria
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => handleSettingChange('timezone', e.target.value)}
                className="input-field"
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* User & Security Settings */}
        <div 
          className="p-6 rounded-xl"
          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FiMail className="w-5 h-5 text-green-500" />
            Configuración de Usuarios
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div>
                <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Permitir Registro de Usuarios
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Los usuarios pueden crear cuentas por sí mismos
                </p>
              </div>
              <ToggleSwitch 
                enabled={settings.allowRegistration}
                onChange={(value) => handleSettingChange('allowRegistration', value)}
                label="Permitir registro"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div>
                <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Verificación de Email Requerida
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Los usuarios deben verificar su email antes de acceder
                </p>
              </div>
              <ToggleSwitch 
                enabled={settings.requireEmailVerification}
                onChange={(value) => handleSettingChange('requireEmailVerification', value)}
                label="Verificación de email"
              />
            </div>
          </div>
        </div>

        {/* System Behavior */}
        <div 
          className="p-6 rounded-xl"
          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FiClock className="w-5 h-5 text-orange-500" />
            Comportamiento del Sistema
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Tiempo de Sesión (minutos)
              </label>
              <input
                type="number"
                min="30"
                max="1440"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                className="input-field"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Tiempo antes de cerrar sesión automáticamente
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Elementos por Página
              </label>
              <select
                value={settings.itemsPerPage}
                onChange={(e) => handleSettingChange('itemsPerPage', parseInt(e.target.value))}
                className="input-field"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div>
                <h3 className="font-medium text-red-700 dark:text-red-400">
                  Modo de Mantenimiento
                </h3>
                <p className="text-sm text-red-600 dark:text-red-300">
                  Desactiva el acceso al sistema para todos los usuarios excepto administradores
                </p>
              </div>
              <ToggleSwitch 
                enabled={settings.maintenanceMode}
                onChange={(value) => handleSettingChange('maintenanceMode', value)}
                label="Modo mantenimiento"
              />
            </div>
          </div>
        </div>
      </div>

      {hasChanges && (
        <div 
          className="p-4 rounded-lg border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20"
          style={{ borderLeftColor: 'var(--warning-border)' }}
        >
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Tienes cambios sin guardar. No olvides hacer clic en &quot;Guardar Cambios&quot; para aplicarlos.
          </p>
        </div>
      )}
    </div>
  );
}

export default SystemConfiguration;
