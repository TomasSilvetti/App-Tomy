import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToAll } from "@/lib/push";
import { calcularFechasRecordatorio, type RepeatUnit } from "@/lib/reminders";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = new Date();
  const preguntas = await prisma.question.findMany({
    where: {
      reminderEnabled: true,
      reminderStartAt: { not: null },
      repeatEveryN: { not: null },
      repeatUnit: { not: null },
      repeatCount: { not: null },
    },
  });

  let enviadas = 0;

  for (const p of preguntas) {
    if (!p.reminderStartAt || !p.repeatEveryN || !p.repeatUnit || !p.repeatCount) continue;

    const fechas = calcularFechasRecordatorio(
      p.reminderStartAt,
      p.repeatEveryN,
      p.repeatUnit as RepeatUnit,
      p.repeatCount,
    );

    const desde = p.lastNotifiedAt ?? p.createdAt;
    const pendientes = fechas.filter((f) => f.getTime() > desde.getTime() && f.getTime() <= now.getTime());

    if (pendientes.length === 0) continue;

    await sendPushToAll({
      title: "Recordatorio",
      body: p.title,
      url: `/preguntas?responder=${p.id}`,
      tag: `pregunta-${p.id}`,
    });

    const ultima = pendientes[pendientes.length - 1];
    await prisma.question.update({
      where: { id: p.id },
      data: { lastNotifiedAt: ultima },
    });
    enviadas += pendientes.length;
  }

  return NextResponse.json({ ok: true, enviadas });
}
