'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { AILoader } from '@/components/ui/ai-loader';
import { Dialog } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface Project {
  id: number;
  name: string;
  description?: string;
  pattern: string;
  status: string;
  tags: string;
  lastSync: string;
  iaInsights: string;
  owner: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface CreateProjectData {
  name: string;
  description: string;
  pattern: string;
  tags: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingIA, setLoadingIA] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filterPattern, setFilterPattern] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form state
  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    description: '',
    pattern: 'monolith',
    tags: '',
  });

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProjects();
  }, [token, router]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(response.data);
    } catch (error) {
      toast.error('Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre del proyecto es requerido');
      return;
    }

    setLoadingIA(true);
    try {
      await api.post('/projects', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success('Proyecto creado exitosamente');
      setShowCreateModal(false);
      setFormData({ name: '', description: '', pattern: 'monolith', tags: '' });
      fetchProjects();
    } catch (error) {
      toast.error('Error al crear proyecto');
    } finally {
      setLoadingIA(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      await api.delete(`/projects/${selectedProject.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success('Proyecto eliminado exitosamente');
      setShowDeleteModal(false);
      setSelectedProject(null);
      fetchProjects();
    } catch (error) {
      toast.error('Error al eliminar proyecto');
    }
  };

  const handleAnalyzeIA = async (projectId: number) => {
    setLoadingIA(true);
    try {
      await api.post(`/projects/${projectId}/analyze-ia`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success('Análisis IA completado');
      fetchProjects();
    } catch (error) {
      toast.error('Error en el análisis IA');
    } finally {
      setLoadingIA(false);
    }
  };

  const handleSyncProject = async (projectId: number) => {
    setLoadingIA(true);
    try {
      await api.post(`/projects/${projectId}/sync`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success('Proyecto sincronizado');
      fetchProjects();
    } catch (error) {
      toast.error('Error al sincronizar');
    } finally {
      setLoadingIA(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    if (filterPattern !== 'all' && project.pattern !== filterPattern) return false;
    if (filterStatus !== 'all' && project.status !== filterStatus) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPatternIcon = (pattern: string) => {
    switch (pattern) {
      case 'monolith': return '🏗️';
      case 'microservices': return '🔗';
      case 'serverless': return '⚡';
      case 'event-driven': return '📡';
      default: return '📁';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <AILoader size="lg" text="Cargando proyectos..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Proyectos</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Gestiona y analiza tus proyectos de desarrollo
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear Proyecto
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex flex-wrap gap-4">
              <select
                value={filterPattern}
                onChange={(e) => setFilterPattern(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Todos los patrones</option>
                <option value="monolith">Monolito</option>
                <option value="microservices">Microservicios</option>
                <option value="serverless">Serverless</option>
                <option value="event-driven">Event-Driven</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="archived">Archivado</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📁</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay proyectos</h3>
            <p className="text-gray-600 mb-6">Crea tu primer proyecto para comenzar</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Crear Proyecto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const iaInsights = JSON.parse(project.iaInsights);
              const components = JSON.parse(project.components || '[]');
              
              return (
                <div key={project.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getPatternIcon(project.pattern)}</span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                          <p className="text-sm text-gray-500">{project.pattern}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedProject(project);
                            setShowDeleteModal(true);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{components.length}</div>
                        <div className="text-xs text-gray-500">Componentes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{iaInsights.recommendations?.length || 0}</div>
                        <div className="text-xs text-gray-500">Recomendaciones</div>
                      </div>
                    </div>

                    {/* Tags */}
                    {project.tags && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {project.tags.split(',').map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAnalyzeIA(project.id)}
                        disabled={loadingIA}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingIA ? (
                          <AILoader size="sm" text="" />
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Analizar IA
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleSyncProject(project.id)}
                        disabled={loadingIA}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Sincronizar
                      </button>
                    </div>

                    {/* Last sync */}
                    <div className="mt-4 text-xs text-gray-500">
                      Última sincronización: {new Date(project.lastSync).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <Dialog
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nuevo Proyecto"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Proyecto
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Mi Proyecto"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Describe tu proyecto..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patrón Arquitectónico
            </label>
            <select
              value={formData.pattern}
              onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="monolith">Monolito</option>
              <option value="microservices">Microservicios</option>
              <option value="serverless">Serverless</option>
              <option value="event-driven">Event-Driven</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Etiquetas (separadas por comas)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="react, typescript, api"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateProject}
              disabled={loadingIA}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingIA ? (
                <div className="flex items-center">
                  <AILoader size="sm" text="" />
                  <span className="ml-2">Creando...</span>
                </div>
              ) : (
                'Crear Proyecto'
              )}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Proyecto"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro de que quieres eliminar el proyecto "{selectedProject?.name}"? 
            Esta acción no se puede deshacer.
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteProject}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
} 