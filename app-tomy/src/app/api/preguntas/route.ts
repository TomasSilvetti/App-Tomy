import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { preguntaSchema } from "@/lib/validators";
import { calcularFechasRecordatorio, type RepeatUnit } from "@/lib/reminders";

export async function GET() {
  const preguntas = await prisma.question.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { answers: true } },
      answers: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
  });

  const now = new Date();
  const data = preguntas.map((p) => {
    let pendientes = 0;
    if (p.reminderEnabled && p.reminderStartAt && p.repeatEveryN && p.repeatUnit && p.repeatCount) {
      const fechas = calcularFechasRecordatorio(
        p.reminderStartAt,
        p.repeatEveryN,
        p.repeatUnit as RepeatUnit,
        p.repeatCount,
      );
      const pasadas = fechas.filter((f) => f.getTime() <= now.getTime()).length;
      pendientes = Math.max(0, pasadas - p._count.answers);
    }
    return {
      id: p.id,
      title: p.title,
      reminderEnabled: p.reminderEnabled,
      reminderStartAt: p.reminderStartAt,
      repeatEveryN: p.repeatEveryN,
      repeatUnit: p.repeatUnit,
      repeatCount: p.repeatCount,
      createdAt: p.createdAt,
      lastAnswerAt: p.answers[0]?.createdAt ?? null,
      answersCount: p._count.answers,
      pendingCount: pendientes,
    };
  });

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = preguntaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;
  const created = await prisma.question.create({
    data: {
      title: data.title,
      reminderEnabled: data.reminderEnabled,
      reminderStartAt: data.reminderEnabled && data.reminderStartAt ? new Date(data.reminderStartAt) : null,
      repeatEveryN: data.reminderEnabled ? data.repeatEveryN ?? null : null,
      repeatUnit: data.reminderEnabled ? data.repeatUnit ?? null : null,
      repeatCount: data.reminderEnabled ? data.repeatCount ?? null : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
