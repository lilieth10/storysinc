"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/landing/Footer";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { useAuth } from "@/store/auth";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, fetchProfile, updateProfile, loading, error, initialized } =
    useAuth();
  const [form, setForm] = useState({
    username: user?.username || "",
    fullName: user?.fullName || "",
    email: user?.email || "",
    password: "",
    confirmPassword: "",
    phone: user?.phone || "",
    birthdate: user?.birthdate ? user.birthdate.substring(0, 10) : "",
    address: user?.address || "",
    avatar: user?.avatar || "",
  });
  const [edit, setEdit] = useState(false);
  const [stats, setStats] = useState({
    projects: 0,
    aiAnalysis: 0,
    memberSince: 2024,
  });
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Cargar estadísticas del usuario
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await fetch("http://localhost:3001/users/stats", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setStats(data);
          }
        }
      } catch (error) {
        console.error("Error cargando estadísticas:", error);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    setForm({
      username: user?.username || "",
      fullName: user?.fullName || "",
      email: user?.email || "",
      password: "",
      confirmPassword: "",
      phone: user?.phone || "",
      birthdate: user?.birthdate ? user.birthdate.substring(0, 10) : "",
      address: user?.address || "",
      avatar: user?.avatar || "",
    });
  }, [user]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // Redirigir a landing si no hay usuario autenticado
  useEffect(() => {
    if (initialized && user === null) {
      router.replace("/");
    }
  }, [user, initialized, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (!form) return;
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form) await updateProfile(form);
    setEdit(false);
    toast.success("Los datos fueron actualizados exitosamente");
  };

  if (!form)
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-black">Cargando perfil...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
      <DashboardHeader />

      <main className="pt-20 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header del perfil */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
            {/* Banner superior */}
            <div className="h-48 bg-gradient-to-r from-green-500 via-green-400 to-green-600 relative">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex items-end space-x-6">
                  {/* Avatar grande */}
                  <div className="relative">
                    <Image
                      src={form.avatar || "/avatar.png"}
                      alt="Avatar"
                      width={120}
                      height={120}
                      className="rounded-full border-4 border-white shadow-lg"
                    />
                    {edit && (
                      <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 cursor-pointer hover:bg-green-600 transition-colors">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Información del usuario */}
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2 text-black">
                      {form.fullName || "Usuario"}
                    </h1>
                    <p className="text-lg opacity-90 text-black">
                      @{form.username}
                    </p>
                    <p className="text-sm opacity-75 text-black">
                      {form.email}
                    </p>
                  </div>

                  {/* Botón de editar */}
                  {!edit && (
                    <button
                      onClick={() => setEdit(true)}
                      className="bg-white text-black hover:bg-gray-50 border-2 border-green-600 px-6 py-3 rounded-full font-semibold"
                    >
                      Editar Perfil
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Contenido del perfil */}
            <div className="p-8">
              {edit ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nombre de usuario
                      </label>
                      <input
                        name="username"
                        value={form.username}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nombre completo
                      </label>
                      <input
                        name="fullName"
                        value={form.fullName ?? ""}
                        onChange={handleChange}
                        placeholder="Tu nombre completo"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Correo electrónico
                      </label>
                      <input
                        name="email"
                        type="email"
                        value={form.email ?? ""}
                        onChange={handleChange}
                        placeholder="tu@email.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Teléfono
                      </label>
                      <input
                        name="phone"
                        value={form.phone ?? ""}
                        onChange={handleChange}
                        placeholder="+1 234 567 890"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Fecha de nacimiento
                      </label>
                      <input
                        name="birthdate"
                        type="date"
                        value={
                          form.birthdate ? form.birthdate.substring(0, 10) : ""
                        }
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nueva contraseña
                      </label>
                      <input
                        name="password"
                        type="password"
                        value={form.password ?? ""}
                        onChange={handleChange}
                        placeholder="Dejar vacío para no cambiar"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Dirección
                    </label>
                    <textarea
                      name="address"
                      value={form.address ?? ""}
                      onChange={handleChange}
                      placeholder="Tu dirección completa"
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      className="flex-1 bg-green-600 hover:bg-green-700 px-8 py-3 rounded-xl font-semibold"
                      disabled={loading}
                    >
                      {loading ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 px-8 py-3 rounded-xl font-semibold border-2 border-gray-300 hover:bg-gray-50"
                      onClick={() => setEdit(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Información personal */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      Información Personal
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-black font-semibold">
                            Nombre completo
                          </p>
                          <p className="font-semibold text-black">
                            {form.fullName || "No especificado"}
                          </p>
                          {!form.fullName && (
                            <p className="text-xs text-black mt-1">
                              Completa tu perfil para ver tu nombre aquí
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-black font-semibold">
                            Correo electrónico
                          </p>
                          <p className="font-semibold text-black">
                            {form.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-black font-semibold">
                            Teléfono
                          </p>
                          <p className="font-semibold text-black">
                            {form.phone || "No especificado"}
                          </p>
                          {!form.phone && (
                            <p className="text-xs text-black mt-1">
                              Agrega tu teléfono en editar perfil
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                          <svg
                            className="w-5 h-5 text-orange-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-black font-semibold">
                            Fecha de nacimiento
                          </p>
                          <p className="font-semibold text-black">
                            {form.birthdate
                              ? new Date(form.birthdate).toLocaleDateString(
                                  "es-ES",
                                )
                              : "No especificado"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      Información Adicional
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-start p-4 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-black font-semibold">
                            Dirección
                          </p>
                          <p className="font-semibold text-black">
                            {form.address || "No especificado"}
                          </p>
                          {!form.address && (
                            <p className="text-xs text-black mt-1">
                              Agrega tu dirección en editar perfil
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-black font-semibold">
                            Estado de la cuenta
                          </p>
                          <p className="font-semibold text-green-600">Activa</p>
                        </div>
                      </div>

                      <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-black font-semibold">
                            Miembro desde
                          </p>
                          <p className="font-semibold text-black">2024</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Estadísticas del usuario */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-black font-semibold">Proyectos</p>
                  <p className="text-2xl font-bold text-black">
                    {stats.projects}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-black font-semibold">
                    Análisis IA
                  </p>
                  <p className="text-2xl font-bold text-black">
                    {stats.aiAnalysis}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-black font-semibold">
                    Miembro desde
                  </p>
                  <p className="text-2xl font-bold text-black">
                    {stats.memberSince}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
