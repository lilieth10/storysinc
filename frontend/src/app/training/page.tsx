"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/landing/Footer";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import toast from "react-hot-toast";

interface TrainingResource {
  id: number;
  title: string;
  description: string;
  type: string;
  category: string;
  hasButton?: boolean;
  buttonText?: string;
  fileUrl?: string;
  videoUrl?: string;
  codeSnippet?: {
    language: string;
    code: string;
    lines: number[];
  };
  position?: "left" | "right" | "bottom";
  hasImage?: boolean;
  imageDescription?: string;
  userProgress?: {
    progress: number;
    timeSpent: number;
    completed: boolean;
    startedAt: string;
    completedAt?: string;
  } | null;
  duration?: number; // Added for new_code
}

interface TrainingData {
  resources: TrainingResource[];
  categories: string[];
}

export default function TrainingPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [trainingData, setTrainingData] = useState<TrainingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedResource, setSelectedResource] =
    useState<TrainingResource | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>("");

  useEffect(() => {
    loadTrainingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadTrainingData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/training", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // El backend devuelve un array directamente, no un objeto con resources
      const resources = response.data;
      
      // Obtener categorías únicas de los recursos reales
      const categories = [...new Set(resources.map((r: TrainingResource) => r.category))] as string[];

      setTrainingData({
        resources,
        categories,
      });
    } catch (error) {
      console.error("Error loading training data:", error);
      toast.error("Error al cargar los recursos de capacitación");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (selectedResource) {
      setSelectedResource(null);
    } else {
      router.push("/dashboard");
    }
  };

  const handleDownload = async (resource: TrainingResource) => {
    try {
      if (!resource.fileUrl) {
        toast.error("No hay archivo disponible para descargar");
        return;
      }

      // Simular descarga real
      const link = document.createElement("a");
      link.href = resource.fileUrl;
      link.download = `${resource.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Descargando ${resource.title}`);
    } catch {
      toast.error("Error al descargar el archivo");
    }
  };

  const handlePlayVideo = async (resource: TrainingResource) => {
    try {
      if (!resource.videoUrl) {
        toast.error("No hay video disponible");
        return;
      }

      // Convertir URL de YouTube a formato embed si es necesario
      let videoUrl = resource.videoUrl;
      if (videoUrl.includes('youtube.com/watch')) {
        const videoId = videoUrl.split('v=')[1]?.split('&')[0];
        if (videoId) {
          videoUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      } else if (videoUrl.includes('youtu.be/')) {
        const videoId = videoUrl.split('youtu.be/')[1];
        if (videoId) {
          videoUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      }

      // Reproducir video in-page
      setCurrentVideoUrl(videoUrl);
      setShowVideoModal(true);
      toast.success(`Reproduciendo video de ${resource.title}`);
    } catch {
      toast.error("Error al reproducir el video");
    }
  };

  const handleStartCourse = async (resource: TrainingResource) => {
    try {
      // Actualizar progreso al iniciar
      await api.post(
        `/training/${resource.id}/progress`,
        {
          progress: 0,
          timeSpent: 0,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Mostrar el contenido del curso directamente
      setSelectedResource(resource);
      toast.success(`Iniciando ${resource.title}`);
    } catch {
      toast.error("Error al iniciar el curso");
    }
  };

  const handleGenerateCertificate = async (resource: TrainingResource) => {
    try {
      const response = await api.get(`/training/${resource.id}/certificate`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Simular descarga del certificado
      const link = document.createElement("a");
      link.href = response.data.certificateUrl;
      link.download = `certificado-${resource.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Certificado generado y descargado");
    } catch {
      toast.error("Debes completar el curso para obtener el certificado");
    }
  };

  const handleSearch = (query: string) => {
    // Función de búsqueda sin notificaciones
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <DashboardHeader />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse">
                <div className="mb-8 h-16 bg-gray-200 rounded"></div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-32"></div>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  // Vista detallada de un recurso
  if (selectedResource) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <DashboardHeader />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto">
              {/* Breadcrumb */}
              <div className="mb-6">
                <button
                  onClick={handleGoBack}
                  className="text-black hover:text-gray-800 font-medium flex items-center gap-2"
                >
                  <span>←</span>
                  <span>Volver a Capacitaciones</span>
                </button>
              </div>

              {/* Contenido del curso */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h1 className="text-3xl font-bold text-black mb-6">
                  {selectedResource.title}
                </h1>

                <p className="text-black leading-relaxed mb-8">
                  {selectedResource.description}
                </p>

                {/* Información del curso */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {selectedResource.category}
                  </span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {selectedResource.type}
                  </span>
                  {selectedResource.duration && (
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                      {selectedResource.duration} min
                    </span>
                  )}
                </div>

                {/* Progreso del usuario */}
                {selectedResource.userProgress && (
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-black">
                        Progreso del curso
                      </span>
                      <span className="text-sm text-black">
                        {selectedResource.userProgress.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-600 h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${selectedResource.userProgress.progress}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Contenido del curso */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-black mb-4">
                    Contenido del curso
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-black leading-relaxed">
                      Este curso te enseñará los fundamentos de {selectedResource.title.toLowerCase()}. 
                      Incluye teoría, ejemplos prácticos y ejercicios para consolidar tu aprendizaje.
                    </p>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-wrap gap-4">
                  {selectedResource.fileUrl && (
                    <button
                      onClick={() => handleDownload(selectedResource)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
                    >
                      📥 Descargar PDF
                    </button>
                  )}

                  {selectedResource.videoUrl && (
                    <button
                      onClick={() => handlePlayVideo(selectedResource)}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
                    >
                      ▶️ Reproducir Video
                    </button>
                  )}

                  {selectedResource.userProgress?.completed && (
                    <button
                      onClick={() =>
                        handleGenerateCertificate(selectedResource)
                      }
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
                    >
                      🏆 Generar Certificado
                    </button>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <DashboardHeader />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-6">
              <button
                onClick={handleGoBack}
                className="text-black hover:text-gray-800 font-medium flex items-center gap-2"
              >
                <span>←</span>
                <span>Capacitación</span>
              </button>
            </div>

            {/* Título principal */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-black">CAPACITACIÓN</h1>
              <p className="text-black mt-2">
                Aprende las mejores prácticas de desarrollo con nuestros recursos especializados
              </p>
            </div>

            {/* Estadísticas del usuario */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-lg">📚</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-black">Cursos Iniciados</p>
                      <p className="text-xl font-semibold text-black">
                        {trainingData?.resources.filter(r => r.userProgress?.startedAt).length || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 text-lg">✅</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-black">Completados</p>
                      <p className="text-xl font-semibold text-black">
                        {trainingData?.resources.filter(r => r.userProgress?.completed).length || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <span className="text-yellow-600 text-lg">⏱️</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-black">Tiempo Total</p>
                      <p className="text-xl font-semibold text-black">
                        {trainingData?.resources.reduce((total, r) => total + (r.userProgress?.timeSpent || 0), 0) || 0} min
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 text-lg">🏆</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-black">Certificados</p>
                      <p className="text-xl font-semibold text-black">
                        {trainingData?.resources.filter(r => r.userProgress?.completed).length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Barra de búsqueda */}
            <div className="mb-8">
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder="Buscar recursos de capacitación..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-black placeholder-black"
                  onChange={(e) => handleSearch(e.target.value)}
                />
                <button className="absolute right-2 top-2 text-black">
                  🔍
                </button>
              </div>
            </div>

            {/* Filtros por categoría */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-black">Recursos de Capacitación</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedCategory === "all"
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-black hover:bg-gray-300"
                    }`}
                  >
                    Todos
                  </button>
                  {trainingData?.categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedCategory === category
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-black hover:bg-gray-300"
                      }`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Contenido de capacitación */}
            <div className="space-y-6">
              {trainingData?.resources
                .filter(
                  (resource) =>
                    selectedCategory === "all" ||
                    resource.category === selectedCategory,
                )
                .map((resource) => (
                  <div key={resource.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-black mb-2">
                          {resource.title}
                        </h3>
                        <p className="text-black leading-relaxed mb-4">
                          {resource.description}
                        </p>
                        
                        {/* Información del curso */}
                        <div className="flex items-center gap-4 text-sm text-black mb-4">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {resource.category}
                          </span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            {resource.type}
                          </span>
                          {resource.duration && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              {resource.duration} min
                            </span>
                          )}
                        </div>

                        {/* Progreso del usuario */}
                        {resource.userProgress && (
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-black">
                                Progreso
                              </span>
                              <span className="text-sm text-black">
                                {resource.userProgress.progress}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${resource.userProgress.progress}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleStartCourse(resource)}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
                      >
                        🎓 {resource.userProgress?.completed ? "Ver Curso" : "Iniciar Curso"}
                      </button>

                      {resource.fileUrl && (
                        <button
                          onClick={() => handleDownload(resource)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
                        >
                          📥 Descargar
                        </button>
                      )}

                      {resource.videoUrl && (
                        <button
                          onClick={() => handlePlayVideo(resource)}
                          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
                        >
                          ▶️ Reproducir Video
                        </button>
                      )}

                      {resource.userProgress?.completed && (
                        <button
                          onClick={() => handleGenerateCertificate(resource)}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
                        >
                          🏆 Generar Certificado
                        </button>
                      )}
                    </div>
                  </div>
                ))}

              {/* Mensaje si no hay recursos */}
              {trainingData?.resources.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📚</div>
                  <h3 className="text-xl font-semibold text-black mb-2">
                    No hay cursos disponibles
                  </h3>
                  <p className="text-black">
                    El administrador aún no ha subido ningún curso de capacitación.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Video */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-black">Reproduciendo Video</h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              {currentVideoUrl && (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={currentVideoUrl}
                    className="absolute top-0 left-0 w-full h-full rounded"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
