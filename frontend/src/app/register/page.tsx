"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth, User } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const { register, loading, error } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<
    Omit<User, "id" | "createdAt" | "avatar"> & {
      password: string;
      confirmPassword: string;
      gender: string;
      identityNumber: string;
    }
  >({
    username: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    birthdate: "",
    address: "",
    gender: "",
    identityNumber: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que las contraseñas coincidan
    if (form.password !== form.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    // Validar que la contraseña tenga al menos 6 caracteres
    if (form.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    // Preparar datos para enviar al backend (excluir campos que no están en la BD)
    const { confirmPassword, gender, identityNumber, ...dataToSend } = form;
    
    const ok = await register(dataToSend);
    
    if (ok) {
      toast.success("¡Registro exitoso! Ahora puedes iniciar sesión.");
      router.push("/login");
    } else if (error) {
      toast.error(error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-8 flex flex-col items-center">
        <Image
          src="/proogia.png"
          alt="Proogia Logo"
          width={120}
          height={40}
          className="mb-6"
        />
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Crear cuenta</h1>
        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            name="username"
            placeholder="Nombre de usuario"
            value={form.username}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            name="fullName"
            placeholder="Nombre completo"
            value={form.fullName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            name="email"
            type="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <PasswordInput
            name="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            required
          />
          <PasswordInput
            name="confirmPassword"
            placeholder="Repetir contraseña"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
          <input
            name="identityNumber"
            placeholder="Número de identidad"
            value={form.identityNumber}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Seleccionar género</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="otro">Otro</option>
            <option value="prefiero-no-decir">Prefiero no decir</option>
          </select>
          <input
            name="phone"
            placeholder="No. de teléfono"
            value={form.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            name="birthdate"
            type="date"
            placeholder="Fecha de nacimiento"
            value={form.birthdate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <textarea
            name="address"
            placeholder="Dirección"
            value={form.address}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
          />
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            Registrarse
          </Button>
        </form>
        {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}
        <div className="mt-4 text-sm text-gray-600">
          ¿Ya tienes cuenta?{" "}
          <a
            href="/login"
            className="text-green-600 font-semibold hover:underline"
          >
            Inicia sesión
          </a>
        </div>
      </div>
    </div>
  );
}
