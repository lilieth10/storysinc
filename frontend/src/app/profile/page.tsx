"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/landing/Footer";
import { useAuth } from "@/store/auth";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";

export default function ProfilePage() {
  const {
    user,
    fetchProfile,
    updateProfile,
    loading,
    error,
    logout,
    initialized,
  } = useAuth();
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
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  if (!form) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="w-full flex items-center justify-between px-8 py-4 bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <Image
            src="/proogia.png"
            alt="Proogia Logo"
            width={110}
            height={36}
            priority
          />
        </div>
        <div className="flex items-center gap-6">
          <NotificationsDropdown />
          <Image
            src={form.avatar || "/avatar.png"}
            alt="Avatar"
            width={36}
            height={36}
            className="rounded-full border-2 border-green-500"
          />
        </div>
      </header>
      {/* Card de perfil */}
      <main className="flex-1 flex flex-col items-center justify-center pb-8 mt-16">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8 flex flex-col items-center">
          <Image
            src={form.avatar || "/avatar.png"}
            alt="Avatar"
            width={120}
            height={120}
            className="rounded-full border-4 border-green-500 mb-2"
          />
          {edit ? (
            <>
              <label className="text-xs text-green-600 font-semibold hover:underline mb-4 cursor-pointer">
                Cambiar foto de perfil
                <input type="file" accept="image/*" className="hidden" />
              </label>
              <form
                className="w-full flex flex-col gap-4"
                onSubmit={handleSubmit}
              >
                <input
                  name="username"
                  value={form.username}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
                <input
                  name="fullName"
                  value={form.fullName ?? ""}
                  onChange={handleChange}
                  placeholder="Nombre completo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  name="email"
                  value={form.email ?? ""}
                  onChange={handleChange}
                  placeholder="Correo electrónico"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  name="password"
                  type="password"
                  value={form.password ?? ""}
                  onChange={handleChange}
                  placeholder="Contraseña"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword ?? ""}
                  onChange={handleChange}
                  placeholder="Repetir contraseña"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  name="phone"
                  value={form.phone ?? ""}
                  onChange={handleChange}
                  placeholder="No. de teléfono"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  name="birthdate"
                  type="date"
                  value={form.birthdate ? form.birthdate.substring(0, 10) : ""}
                  onChange={handleChange}
                  placeholder="Fecha de nacimiento"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <textarea
                  name="address"
                  value={form.address ?? ""}
                  onChange={handleChange}
                  placeholder="Dirección"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                />
                <div className="flex gap-2 mt-2">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    Guardar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setEdit(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {form.fullName}
                </h2>
                <p className="text-gray-500 text-sm">@{form.username}</p>
              </div>
              <div className="w-full flex flex-col gap-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Correo:</span>
                  <span className="text-gray-600">{form.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Teléfono:</span>
                  <span className="text-gray-600">{form.phone || "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">
                    Nacimiento:
                  </span>
                  <span className="text-gray-600">
                    {form.birthdate ? form.birthdate.substring(0, 10) : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">
                    Dirección:
                  </span>
                  <span className="text-gray-600">{form.address || "-"}</span>
                </div>
              </div>
              <Button
                type="button"
                className="w-full mt-2"
                onClick={() => setEdit(true)}
              >
                Editar perfil
              </Button>
            </>
          )}
          {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={handleLogout}
          >
            Cerrar sesión
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
