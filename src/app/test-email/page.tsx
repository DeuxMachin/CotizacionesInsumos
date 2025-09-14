'use client';

import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface EmailConfig {
  gmail: {
    configured: boolean;
    userPreview: string;
    service: string;
    limitation: string;
  };
  endpoints: {
    simple: string;
    attachment: string;
  };
}

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
  emailId?: string;
  service?: string;
  timestamp?: string;
}

export default function TestEmailPage() {
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachmentContent, setAttachmentContent] = useState('');
  const [attachmentName, setAttachmentName] = useState('prueba.txt');
  const [results, setResults] = useState<TestResult[]>([]);

  // Cargar configuración al montar
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/test-email');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    }
  };

  const sendTestEmail = async (action: 'simple' | 'attachment') => {
    if (!email) {
      addResult({
        success: false,
        error: 'El email es requerido',
        timestamp: new Date().toISOString()
      });
      return;
    }

    setLoading(true);
    
    try {
      const body = {
        action,
        email,
        subject: subject || (action === 'simple' ? 'Email de prueba simple' : 'Email con adjunto de prueba'),
        message: message || (action === 'simple' ? 'Este es un email de prueba básico.' : 'Este email incluye un archivo adjunto.'),
        ...(action === 'attachment' && {
          attachmentContent: attachmentContent || 'Este es el contenido del archivo de prueba.',
          attachmentName
        })
      };

      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      addResult(result);

    } catch (error) {
      addResult({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const addResult = (result: TestResult) => {
    setResults(prev => [result, ...prev]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const fillSampleData = () => {
    setEmail('ejemplo@ejemplo.com');
    setSubject('Email de prueba desde la aplicación');
    setMessage('Este es un mensaje de prueba para verificar que el servicio de email funciona correctamente.');
    setAttachmentContent('Este es el contenido del archivo de prueba.\nLínea 2\nLínea 3');
    setAttachmentName('ejemplo.txt');
  };

  if (!config) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-[var(--text-primary)]">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--card-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Test de Envío de Emails
            </h1>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Panel de Configuración y Test */}
          <div className="space-y-6">
            
            {/* Estado de Configuración */}
            <div className="bg-[var(--card-bg)] rounded-lg border border-[var(--border)] p-6">
              <h2 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
                Estado de Configuración
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">Servicio:</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {config.gmail.service}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">Estado:</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    config.gmail.configured 
                      ? 'bg-[var(--success-bg)] text-[var(--success-text)]'
                      : 'bg-[var(--danger-bg)] text-[var(--danger-text)]'
                  }`}>
                    {config.gmail.configured ? 'Configurado' : 'No configurado'}
                  </span>
                </div>
                
                {config.gmail.configured && (
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-secondary)]">Usuario:</span>
                    <span className="font-mono text-sm text-[var(--text-primary)]">
                      {config.gmail.userPreview}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">Limitación:</span>
                  <span className="text-sm text-[var(--success-text)]">
                    {config.gmail.limitation}
                  </span>
                </div>
              </div>
            </div>

            {/* Formulario de Test */}
            <div className="bg-[var(--card-bg)] rounded-lg border border-[var(--border)] p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Enviar Email de Prueba
                </h2>
                <button
                  onClick={fillSampleData}
                  className="text-sm px-3 py-1 bg-[var(--accent-bg)] text-[var(--accent-text)] rounded hover:bg-[var(--accent-soft)] transition-colors"
                >
                  Llenar ejemplo
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Email destinatario *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                    placeholder="ejemplo@ejemplo.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Asunto
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                    placeholder="Asunto del email (opcional)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Mensaje
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent resize-none"
                    placeholder="Contenido del mensaje (opcional)"
                  />
                </div>
                
                <div className="border-t border-[var(--border)] pt-4">
                  <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                    Para email con adjunto:
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                        Nombre del archivo
                      </label>
                      <input
                        type="text"
                        value={attachmentName}
                        onChange={(e) => setAttachmentName(e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                        placeholder="archivo.txt"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                        Contenido del archivo
                      </label>
                      <textarea
                        value={attachmentContent}
                        onChange={(e) => setAttachmentContent(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent resize-none"
                        placeholder="Contenido del archivo adjunto..."
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => sendTestEmail('simple')}
                    disabled={loading || !config.gmail.configured}
                    className="flex-1 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-md hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Enviando...' : 'Enviar Simple'}
                  </button>
                  
                  <button
                    onClick={() => sendTestEmail('attachment')}
                    disabled={loading || !config.gmail.configured}
                    className="flex-1 px-4 py-2 bg-[var(--info)] text-white rounded-md hover:bg-[var(--info-text)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Enviando...' : 'Con Adjunto'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Panel de Resultados */}
          <div className="space-y-6">
            <div className="bg-[var(--card-bg)] rounded-lg border border-[var(--border)] p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Resultados ({results.length})
                </h2>
                {results.length > 0 && (
                  <button
                    onClick={clearResults}
                    className="text-sm px-3 py-1 text-[var(--danger-text)] hover:bg-[var(--danger-bg)] rounded transition-colors"
                  >
                    Limpiar
                  </button>
                )}
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.length === 0 ? (
                  <div className="text-center py-8 text-[var(--text-muted)]">
                    No hay resultados aún. Envía un email de prueba para ver los resultados aquí.
                  </div>
                ) : (
                  results.map((result, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        result.success
                          ? 'bg-[var(--success-bg)] border-[var(--success)] text-[var(--success-text)]'
                          : 'bg-[var(--danger-bg)] border-[var(--danger)] text-[var(--danger-text)]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${
                              result.success ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'
                            }`} />
                            <span className="font-medium">
                              {result.success ? 'Éxito' : 'Error'}
                            </span>
                          </div>
                          
                          <div className="text-sm space-y-1">
                            {result.success ? (
                              <>
                                <div>{result.message}</div>
                                {result.service && (
                                  <div className="font-mono text-xs opacity-75">
                                    Servicio: {result.service}
                                  </div>
                                )}
                                {result.emailId && (
                                  <div className="font-mono text-xs opacity-75">
                                    ID: {result.emailId}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div>{result.error}</div>
                            )}
                          </div>
                        </div>
                        
                        {result.timestamp && (
                          <div className="text-xs opacity-75 ml-3">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
