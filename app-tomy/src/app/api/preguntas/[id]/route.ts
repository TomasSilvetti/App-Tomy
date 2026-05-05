import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { preguntaSchema } from "@/lib/validators";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pregunta = await prisma.question.findUnique({ where: { id } });
  if (!pregunta) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json(pregunta);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const parsed = preguntaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;
  try {
    const updated = await prisma.question.update({
      where: { id },
      data: {
        title: data.title,
        reminderEnabled: data.reminderEnabled,
        reminderStartAt: data.reminderEnabled && data.reminderStartAt ? new Date(data.reminderStartAt) : null,
        repeatEveryN: data.reminderEnabled ? data.repeatEveryN ?? null : null,
        repeatUnit: data.reminderEnabled ? data.repeatUnit ?? null : null,
        repeatCount: data.reminderEnabled ? data.repeatCount ?? null : null,
        lastNotifiedAt: data.reminderEnabled ? undefined : null,
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.question.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
}
