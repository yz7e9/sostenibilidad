import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { findUserById } from "@/lib/db";

export async function GET() {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const usuario = findUserById(sesion.userId);
  if (!usuario) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ usuario });
}
