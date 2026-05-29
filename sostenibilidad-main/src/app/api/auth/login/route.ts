import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/db";
import { crearToken, crearCookie, verificarPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son obligatorios" },
        { status: 400 },
      );
    }

    const usuario = findUserByEmail(email);
    if (!usuario) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 },
      );
    }

    if (!verificarPassword(password, usuario.password)) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 },
      );
    }

    const token = await crearToken({
      userId: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
    });

    const response = NextResponse.json({
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
      },
      mensaje: "Inicio de sesión correcto",
    });

    response.cookies.set(crearCookie(token));
    return response;
  } catch (error) {
    console.error("[LOGIN]", error);
    return NextResponse.json(
      { error: "Error al iniciar sesión" },
      { status: 500 },
    );
  }
}
