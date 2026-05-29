import { NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/db";
import { crearToken, crearCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, nombre, password } = await request.json();

    if (!email || !nombre || !password) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 },
      );
    }

    const existente = findUserByEmail(email);
    if (existente) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 409 },
      );
    }

    const usuario = createUser(email, nombre, password);
    const token = await crearToken({
      userId: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
    });

    const response = NextResponse.json(
      { usuario, mensaje: "Usuario creado correctamente" },
      { status: 201 },
    );

    response.cookies.set(crearCookie(token));
    return response;
  } catch (error) {
    console.error("[REGISTER]", error);
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 },
    );
  }
}
