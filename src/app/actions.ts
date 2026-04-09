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

export async function addMediaFile(clientId: string, data: { type: string, link: string, description: string }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const media = await prisma.mediaFile.create({
    data: {
      ...data,
      clientId,
    }
  });

  await prisma.changeLog.create({
    data: {
      action: "ADD",
      entity: "MEDIA_FILE",
      entityId: media.id,
      details: JSON.stringify({ name: `Added [${data.type}] - ${data.description}` }),
      userId: session.user.id,
    }
  });

  revalidatePath(`/clients/${clientId}/media`);
  revalidatePath("/history");
}

export async function editMediaFile(clientId: string, mediaId: string, data: { type: string, link: string, description: string }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.mediaFile.update({
    where: { id: mediaId },
    data,
  });

  await prisma.changeLog.create({
    data: {
      action: "UPDATE",
      entity: "MEDIA_FILE",
      entityId: mediaId,
      details: JSON.stringify({ name: `Edited [${data.type}] - ${data.description}` }),
      userId: session.user.id,
    }
  });

  revalidatePath(`/clients/${clientId}/media`);
  revalidatePath("/history");
}

export async function deleteMediaFile(clientId: string, mediaId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const media = await prisma.mediaFile.findUnique({ where: { id: mediaId } });
  if (!media) throw new Error("Media file not found");

  await prisma.mediaFile.delete({ where: { id: mediaId } });

  await prisma.changeLog.create({
    data: {
      action: "DELETE",
      entity: "MEDIA_FILE",
      entityId: mediaId,
      details: JSON.stringify({ name: `Deleted [${media.type}] - ${media.description}` }),
      userId: session.user.id,
    }
  });

  revalidatePath(`/clients/${clientId}/media`);
  revalidatePath("/history");
}

export async function seedDefaultTasks(clientId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const defaultTasks = [
    "Confirm GSC Access & Tracking Works",
    "Confirm Google Analytics Access & Tracking Works",
    "Confirm Sitemap has been submitted to GSC",
    "Confirm Website Access & Permission level",
    "Complete GBP Profile Optimizations",
    "Write GBP Profile Posts",
    "Add Client To BrightLocal",
    "Submit Brightlocal Citation Builder Campaign",
    "Begin Scheduling GBP Posts On Brightlocal",
    "Add Client To HeyTony Audit Tool"
  ];

  for (const taskName of defaultTasks) {
    await prisma.onboardingTask.create({
      data: { taskName, clientId }
    });
  }
}

export async function toggleOnboardingTask(clientId: string, taskId: string, isCompleted: boolean) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const task = await prisma.onboardingTask.update({
    where: { id: taskId },
    data: { isCompleted }
  });

  await prisma.changeLog.create({
    data: {
      action: "UPDATE",
      entity: "ONBOARDING_TASK",
      entityId: taskId,
      details: JSON.stringify({ name: `Marked "${task.taskName}" as ${isCompleted ? "Complete" : "Incomplete"}` }),
      userId: session.user.id,
    }
  });
}

export async function deleteOnboardingTask(clientId: string, taskId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const task = await prisma.onboardingTask.findUnique({ where: { id: taskId } });
  if (!task) return;

  await prisma.onboardingTask.delete({ where: { id: taskId } });

  await prisma.changeLog.create({
    data: {
      action: "DELETE",
      entity: "ONBOARDING_TASK",
      entityId: taskId,
      details: JSON.stringify({ name: `Deleted task: "${task.taskName}"` }),
      userId: session.user.id,
    }
  });
}

export async function deleteMultipleOnboardingTasks(clientId: string, taskNames: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const tasksToDelete = await prisma.onboardingTask.findMany({
    where: { 
      clientId,
      taskName: { in: taskNames }
    }
  });

  if (tasksToDelete.length === 0) return;

  await prisma.onboardingTask.deleteMany({
    where: {
      id: { in: tasksToDelete.map(t => t.id) }
    }
  });

  await prisma.changeLog.create({
    data: {
      action: "DELETE",
      entity: "ONBOARDING_TASK",
      entityId: clientId,
      details: JSON.stringify({ name: `Deleted ${tasksToDelete.length} GBP-related onboarding tasks` }),
      userId: session.user.id,
    }
  });
}

export async function seedAuditTasks(clientId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const defaultTasks = [
    "Fix Broken Links / 404 Errors",
    "Create Internal Links To Orphaned Pages",
    "Fix Pages With No H1 Tag",
    "Fix Pages With Multiple H1 Tags",
    "Write & Add Meta Descriptions To Pages That Don't Have them",
    "Fix Pages With Duplicate Meta Descriptions"
  ];

  for (const taskName of defaultTasks) {
    await prisma.auditTask.create({
      data: { taskName, clientId }
    });
  }
}

export async function markAuditTaskWorkedOn(clientId: string, taskId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const task = await prisma.auditTask.update({
    where: { id: taskId },
    data: { lastWorkedOn: new Date() }
  });

  await prisma.changeLog.create({
    data: {
      action: "UPDATE",
      entity: "AUDIT_TASK",
      entityId: taskId,
      details: JSON.stringify({ name: `Marked "${task.taskName}" as worked on` }),
      userId: session.user.id,
    }
  });
}

export async function deleteAuditTask(clientId: string, taskId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const task = await prisma.auditTask.findUnique({ where: { id: taskId } });
  if (!task) return;

  await prisma.auditTask.delete({ where: { id: taskId } });

  await prisma.changeLog.create({
    data: {
      action: "DELETE",
      entity: "AUDIT_TASK",
      entityId: taskId,
      details: JSON.stringify({ name: `Deleted audit task: "${task.taskName}"` }),
      userId: session.user.id,
    }
  });
}
