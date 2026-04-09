"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function addClient(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  if (!name) throw new Error("Name is required");

  const client = await prisma.client.create({
    data: { name },
  });

  await prisma.changeLog.create({
    data: {
      action: "ADD",
      entity: "CLIENT",
      entityId: client.id,
      details: JSON.stringify({ name }),
      userId: session.user.id,
    },
  });

  revalidatePath("/clients");
  revalidatePath("/history");
}

export async function deleteClient(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) throw new Error("Client not found");

  await prisma.client.delete({ where: { id } });

  await prisma.changeLog.create({
    data: {
      action: "DELETE",
      entity: "CLIENT",
      entityId: id,
      details: JSON.stringify({ name: client.name }),
      userId: session.user.id,
    },
  });

  revalidatePath("/clients");
  revalidatePath("/history");
}
