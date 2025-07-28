'use client';

import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  TrashIcon,
  FolderIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';

interface SyncProject {
  id: number;
  name: string;
  type: 'bff' | 'sidecar';
  status: 'active' | 'inactive';
  lastSync: string;
}

interface CreateFormData {
  serviceName: string;
  description: string;
  pattern: string;
  tags: string;
  frontendAssociation: string;
  contact: string;
  functions: string[];
}

export default function SyncPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createType, setCreateType] = useState<'bff' | 'sidecar'>('bff');
  const [syncProjects, setSyncProjects] = useState<SyncProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<CreateFormData>({
    serviceName: '',
    description: '',
    pattern: '',
    tags: '',
    frontendAssociation: '',
    contact: '',
    functions: []
  });

  // Cargar proyectos de sincronización
  useEffect(() => {
    fetchSyncProjects();
  }, []);

  const fetchSyncProjects = async () => {
    try {
      const response = await fetch('/api/sync/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const projects = await response.json();
        setSyncProjects(projects);
      }
    } catch (error) {
      console.error('Error fetching sync projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = syncProjects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/sync/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          type: createType
        }),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setFormData({
          serviceName: '',
          description: '',
          pattern: '',
          tags: '',
          frontendAssociation: '',
          contact: '',
          functions: []
        });
        // Recargar proyectos
        fetchSyncProjects();
      }
    } catch (error) {
      console.error('Error creating sync project:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/sync/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchSyncProjects();
      }
    } catch (error) {
      console.error('Error deleting sync project:', error);
    }
  };

  const addFunction = (functionName: string) => {
    if (functionName && !formData.functions.includes(functionName)) {
      setFormData(prev => ({
        ...prev,
        functions: [...prev.functions, functionName]
      }));
    }
  };

  const removeFunction = (functionName: string) => {
    setFormData(prev => ({
      ...prev,
      functions: prev.functions.filter(f => f !== functionName)
    }));
  };

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex flex-col justify-center">
            <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm my-8 px-12 py-8" style={{maxWidth: '100%', minWidth: 0}}>
              <div className="mb-6 flex gap-2">
                <button 
                  onClick={() => setCreateType('bff')}
                  className={`px-4 py-2 rounded font-semibold border transition-colors duration-150 ${createType === 'bff' ? 'bg-green-100 text-black border-green-400' : 'bg-white text-black border-green-100 hover:bg-green-50'}`}
                >
                  {'< BFF'}
                </button>
                <button 
                  onClick={() => setCreateType('sidecar')}
                  className={`px-4 py-2 rounded font-semibold border transition-colors duration-150 ${createType === 'sidecar' ? 'bg-green-100 text-black border-green-400' : 'bg-white text-black border-green-100 hover:bg-green-50'}`}
                >
                  Sidecar
                </button>
              </div>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del servicio</label>
                  <input
                    type="text"
                    value={formData.serviceName}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Ingresa el nombre del servicio"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Describe el servicio"
                  />
                </div>
                {createType === 'bff' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Patrón</label>
                    <select
                      value={formData.pattern}
                      onChange={(e) => setFormData(prev => ({ ...prev, pattern: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Selecciona un patrón</option>
                      <option value="monolito">Monolito</option>
                      <option value="microservicio">Microservicio</option>
                      <option value="nube">Nube</option>
                      <option value="hibrido">Híbrido</option>
                      <option value="no-asignado">No asignado</option>
                    </select>
                  </div>
                )}
                {createType === 'sidecar' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Funciones</label>
                    <div className="flex gap-2 mb-1">
                      <input
                        type="text"
                        placeholder="Envío de Notificaciones"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addFunction(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Registro de Notificaciones"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addFunction(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.functions.map((func, idx) => (
                        <span key={idx} className="inline-flex items-center px-3 py-1 rounded bg-green-100 text-green-800 text-xs font-medium">
                          {func}
                          <button type="button" className="ml-2 text-red-500 hover:text-red-700" onClick={() => removeFunction(func)}>
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asociación de Frontends</label>
                  <input
                    type="text"
                    value={formData.frontendAssociation}
                    onChange={(e) => setFormData(prev => ({ ...prev, frontendAssociation: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Frontends asociados"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Información de contacto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción adicional</label>
                  <textarea
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Descripción adicional"
                  />
                </div>
                <div className="flex justify-end gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-2 rounded font-semibold border border-green-400 bg-green-100 text-black hover:bg-green-200 transition-colors duration-150"
                  >
                    Cancelar
                  </button>
                  <Button 
                    type="button"
                    onClick={handleCreate}
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded"
                  >
                    Guardar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <div className="flex">
        <Sidebar />
        
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-white p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar proyectos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 w-80"
                />
              </div>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Crear
              </Button>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Proyectos sincronizados</h2>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando proyectos...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProjects.map((project) => (
                    <div key={project.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <FolderIcon className="w-8 h-8 text-gray-400 mr-3" />
                          <div>
                            <h3 className="font-medium text-gray-900">{project.name}</h3>
                            <p className="text-sm text-gray-500 capitalize">{project.type}</p>
                            <p className="text-xs text-gray-400">Última sincronización: {new Date(project.lastSync).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDelete(project.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="mt-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          project.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-center items-center space-x-2">
              <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                Anterior
              </button>
              <button className="px-3 py-2 text-sm font-medium text-white bg-green-500 border border-green-500 rounded-md">
                1
              </button>
              <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                2
              </button>
              <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                3
              </button>
              <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                4
              </button>
              <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                5
              </button>
              <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
} 