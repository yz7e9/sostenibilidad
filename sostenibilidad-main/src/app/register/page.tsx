"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Recycle } from "lucide-react";

export default function RegisterPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sostenibilidad-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="bg-sostenibilidad-100 p-3 rounded-2xl inline-flex mb-3">
            <Recycle className="w-8 h-8 text-sostenibilidad-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Crear cuenta</h1>
          <p className="text-sm text-gray-500 mt-1">
            Regístrate para acceder al cuadro de mandos
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sostenibilidad-500 focus:ring-1 focus:ring-sostenibilidad-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sostenibilidad-500 focus:ring-1 focus:ring-sostenibilidad-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sostenibilidad-500 focus:ring-1 focus:ring-sostenibilidad-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-2.5 rounded-lg bg-sostenibilidad-600 text-white text-sm font-medium hover:bg-sostenibilidad-700 disabled:opacity-50 transition-colors"
          >
            {cargando ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          <p className="text-xs text-gray-400 text-center">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="text-sostenibilidad-600 hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
