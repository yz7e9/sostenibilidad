import { NextResponse } from "next/server";
import { eliminarCookie } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ mensaje: "Sesión cerrada" });
  response.cookies.set(eliminarCookie());
  return response;
}
