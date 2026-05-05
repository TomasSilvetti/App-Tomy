import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushSubscriptionSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = pushSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Suscripción inválida", issues: parsed.error.issues }, { status: 400 });
  }
  const { endpoint, keys } = parsed.data;
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { p256dh: keys.p256dh, auth: keys.auth },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => ({}));
  const endpoint: string | undefined = body?.endpoint;
  if (!endpoint) return NextResponse.json({ error: "endpoint requerido" }, { status: 400 });
  await prisma.pushSubscription.delete({ where: { endpoint } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
