import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const clients = await prisma.client.findMany({ include: { onboardingTasks: true } });
  let added = 0;
  for (const c of clients) {
    const has = c.onboardingTasks.some((t: any) => t.taskName === "Checked / Added llms.txt file");
    if (!has) {
      await prisma.onboardingTask.create({ data: { taskName: "Checked / Added llms.txt file", clientId: c.id } });
      added++;
    }
  }
  return NextResponse.json({ success: true, added });
}
