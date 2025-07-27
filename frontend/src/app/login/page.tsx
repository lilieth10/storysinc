"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(form);
    if (ok) {
      toast.success("¡Bienvenido!");
      router.push("/profile");
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Iniciar sesión
        </h1>
        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            name="email"
            placeholder="Email o nombre de usuario"
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
          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm text-gray-600">
              <input
                type="checkbox"
                name="rememberMe"
                checked={form.rememberMe}
                onChange={handleChange}
                className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              Recordarme
            </label>
          </div>
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            Iniciar sesión
          </Button>
        </form>
        {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}
        <div className="mt-4 text-sm text-gray-600">
          ¿No tienes cuenta?{" "}
          <a
            href="/register"
            className="text-green-600 font-semibold hover:underline"
          >
            Regístrate
          </a>
        </div>
      </div>
    </div>
  );
}
