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
      const categories = [
        "react",
        "css",
        "testing",
        "javascript",
        "typescript",
      ];

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

  const handleVerMas = () => {
    toast.success("Accediendo a más recursos de capacitación");
  };

  const handleDocumentacion = () => {
    toast.success("Accediendo a documentación completa");
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

      // Abrir video en nueva ventana
      window.open(resource.videoUrl, "_blank");
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

                {/* Progreso del usuario */}
                {selectedResource.userProgress && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-black">
                        Progreso
                      </span>
                      <span className="text-sm text-black">
                        {selectedResource.userProgress.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${selectedResource.userProgress.progress}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

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
            </div>

            {/* Barra de búsqueda */}
            <div className="mb-8">
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder="Buscar recursos de capacitación..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-black placeholder-gray-500"
                  onChange={(e) => handleSearch(e.target.value)}
                />
                <button className="absolute right-2 top-2 text-gray-400">
                  🔍
                </button>
              </div>
            </div>

            {/* Filtros por categoría */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === "all"
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Contenido de capacitación */}
            <div className="space-y-12">
              {trainingData?.resources
                .filter(
                  (resource) =>
                    selectedCategory === "all" ||
                    resource.category === selectedCategory,
                )
                .map((resource) => (
                  <div key={resource.id} className="mb-12">
                    {/* Material de capacitación - Overview */}
                    {resource.type === "overview" && (
                      <div className="mb-8">
                        <h2 className="text-xl font-semibold text-black mb-4">
                          {resource.title}
                        </h2>
                        <p className="text-black mb-6 leading-relaxed max-w-4xl">
                          {resource.description}
                        </p>
                        {resource.hasButton && (
                          <button
                            onClick={handleVerMas}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
                          >
                            {resource.buttonText}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Módulos de capacitación */}
                    {resource.type === "module" && (
                      <div
                        className={`flex ${resource.position === "left" ? "flex-row-reverse" : "flex-row"} gap-8 items-start mb-8`}
                      >
                        <div className="flex-1 max-w-2xl">
                          <h2 className="text-xl font-semibold text-black mb-4">
                            {resource.title}
                          </h2>
                          <p className="text-gray-600 leading-relaxed mb-4">
                            {resource.description}
                          </p>

                          {/* Progreso del usuario */}
                          {resource.userProgress && (
                            <div className="mb-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                  Progreso
                                </span>
                                <span className="text-sm text-gray-500">
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

                          {/* Botones de acción */}
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleStartCourse(resource)}
                              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                            >
                              🎓{" "}
                              {resource.userProgress?.completed
                                ? "Ver Curso"
                                : "Iniciar Curso"}
                            </button>

                            {resource.fileUrl && (
                              <button
                                onClick={() => handleDownload(resource)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                              >
                                📥 Descargar
                              </button>
                            )}

                            {resource.videoUrl && (
                              <button
                                onClick={() => handlePlayVideo(resource)}
                                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                              >
                                ▶️ Reproducir
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Code Snippet */}
                        {resource.codeSnippet && (
                          <div className="flex-shrink-0 w-80">
                            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-400 text-xs">
                                  {resource.codeSnippet.language.toUpperCase()}
                                </span>
                                <span className="text-gray-500 text-xs">
                                  {resource.codeSnippet.lines[0]}-
                                  {resource.codeSnippet.lines[1]}
                                </span>
                              </div>
                              <pre className="text-xs leading-relaxed overflow-x-auto">
                                <code>{resource.codeSnippet.code}</code>
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Image */}
                        {resource.hasImage && (
                          <div className="flex-shrink-0 w-80">
                            <div className="bg-gray-200 rounded-lg p-4 h-48 flex items-center justify-center">
                              <div className="text-center text-gray-500">
                                <div className="text-4xl mb-2">👥</div>
                                <p className="text-sm text-center">
                                  {resource.imageDescription}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

              {/* Botón de Documentación */}
              <div className="mt-12">
                <button
                  onClick={handleDocumentacion}
                  className="w-full max-w-4xl bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Documentación
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
