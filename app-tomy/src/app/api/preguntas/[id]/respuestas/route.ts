import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { respuestaSchema } from "@/lib/validators";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pregunta = await prisma.question.findUnique({
    where: { id },
    include: { answers: { orderBy: { createdAt: "desc" } } },
  });
  if (!pregunta) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json(pregunta);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const parsed = respuestaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }
  const exists = await prisma.question.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Pregunta no encontrada" }, { status: 404 });

  const respuesta = await prisma.answer.create({
    data: { text: parsed.data.text, questionId: id },
  });
  return NextResponse.json(respuesta, { status: 201 });
}
