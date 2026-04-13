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

export async function bulkAddClients(textLines: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const lines = textLines.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length === 0) throw new Error("No valid client names provided");

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

  for (const name of lines) {
    const client = await prisma.client.create({
      data: { name },
    });

    await prisma.changeLog.create({
      data: {
        action: "ADD",
        entity: "CLIENT",
        entityId: client.id,
        details: JSON.stringify({ name: `Bulk added client: ${name}` }),
        userId: session.user.id,
      },
    });

    // Seed defaults automatically on spawn per user request
    const taskPromises = defaultTasks.map(taskName => 
      prisma.onboardingTask.create({
        data: { taskName, clientId: client.id }
      })
    );
    await Promise.all(taskPromises);
  }

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

export async function completeAllOnboardingTasks(clientId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.onboardingTask.updateMany({
    where: { clientId, isCompleted: false },
    data: { isCompleted: true }
  });

  await prisma.changeLog.create({
    data: {
      action: "UPDATE",
      entity: "ONBOARDING_TASK",
      entityId: clientId,
      details: JSON.stringify({ name: `Marked all onboarding tasks as Complete` }),
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

export async function addGbpDocument(clientId: string, data: { type: string, title: string, link: string }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const doc = await prisma.gbpDocument.create({
    data: {
      ...data,
      clientId,
    }
  });

  await prisma.changeLog.create({
    data: {
      action: "ADD",
      entity: "GBP_DOCUMENT",
      entityId: doc.id,
      details: JSON.stringify({ name: `Attached [${data.type}] tracker - ${data.title}` }),
      userId: session.user.id,
    }
  });
}

export async function editGbpDocument(clientId: string, documentId: string, data: { title: string, link: string }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const doc = await prisma.gbpDocument.update({
    where: { id: documentId },
    data,
  });

  await prisma.changeLog.create({
    data: {
      action: "UPDATE",
      entity: "GBP_DOCUMENT",
      entityId: documentId,
      details: JSON.stringify({ name: `Edited [${doc.type}] tracker - ${data.title}` }),
      userId: session.user.id,
    }
  });
}

export async function deleteGbpDocument(clientId: string, documentId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const doc = await prisma.gbpDocument.findUnique({ where: { id: documentId } });
  if (!doc) return;

  await prisma.gbpDocument.delete({ where: { id: documentId } });

  await prisma.changeLog.create({
    data: {
      action: "DELETE",
      entity: "GBP_DOCUMENT",
      entityId: documentId,
      details: JSON.stringify({ name: `Removed [${doc.type}] tracker - ${doc.title}` }),
      userId: session.user.id,
    }
  });
}

export async function updateGbpFocusKeyword(clientId: string, keyword: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.client.update({
    where: { id: clientId },
    data: { gbpFocusKeyword: keyword }
  });

  await prisma.changeLog.create({
    data: {
      action: "UPDATE",
      entity: "CLIENT",
      entityId: clientId,
      details: JSON.stringify({ name: `Updated GBP Focus Keyword to: "${keyword}"` }),
      userId: session.user.id,
    }
  });
}

export async function updateClientNotes(clientId: string, notes: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.client.update({
    where: { id: clientId },
    data: { clientNotes: notes }
  });

  await prisma.changeLog.create({
    data: {
      action: "UPDATE",
      entity: "CLIENT",
      entityId: clientId,
      details: JSON.stringify({ name: "Updated Client Notes" }),
      userId: session.user.id,
    }
  });
}

export async function updateGbpPostsScheduledUntil(clientId: string, dateStr: string | null) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Since dateStr is YYYY-MM-DD from standard HTML input, we convert and append time offset manually to map cleanly. Or we just trust new Date.
  // We'll append T12:00:00Z to ensure timezone math doesn't push it back 1 day locally.
  const parsedDate = dateStr ? new Date(`${dateStr}T12:00:00Z`) : null;

  await prisma.client.update({
    where: { id: clientId },
    data: { gbpPostsScheduledUntil: parsedDate }
  });

  await prisma.changeLog.create({
    data: {
      action: "UPDATE",
      entity: "CLIENT",
      entityId: clientId,
      details: JSON.stringify({ name: `Scheduled GBP Posts until: ${dateStr ? dateStr : 'None'}` }),
      userId: session.user.id,
    }
  });
}

// --- Global Widget Actions ---

export async function saveUserLayout(layoutStr: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  await prisma.user.update({
    where: { id: session.user.id },
    data: { dashboardLayout: layoutStr }
  });
}

export async function updateGlobalNote(content: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  await prisma.globalNote.upsert({
    where: { id: "global" },
    update: { content },
    create: { id: "global", content }
  });
}

export async function addGlobalTask(taskName: string) {
  await prisma.globalTask.create({ data: { taskName } });
}

export async function toggleGlobalTask(taskId: string, isCompleted: boolean) {
  await prisma.globalTask.update({
    where: { id: taskId },
    data: { isCompleted }
  });
}

export async function deleteGlobalTask(taskId: string) {
  await prisma.globalTask.delete({ where: { id: taskId } });
}

export async function addGlobalGbpDocument(doc: { title: string, link: string }) {
  await prisma.globalGbpDocument.create({ data: doc });
}

export async function editGlobalGbpDocument(docId: string, doc: { title: string, link: string }) {
  await prisma.globalGbpDocument.update({
    where: { id: docId },
    data: doc
  });
}

export async function deleteGlobalGbpDocument(docId: string) {
  await prisma.globalGbpDocument.delete({ where: { id: docId } });
}

export async function addGlobalEmailTemplate(doc: { title: string, link: string }) {
  await prisma.globalEmailTemplate.create({ data: doc });
}
export async function deleteGlobalEmailTemplate(docId: string) {
  await prisma.globalEmailTemplate.delete({ where: { id: docId } });
}

export async function addGlobalGoogleAdsClient(doc: { title: string, link: string, clientNames?: string | null, clientEmails?: string | null, notes?: string | null }) {
  await prisma.globalGoogleAdsClient.create({ data: doc });
}
export async function deleteGlobalGoogleAdsClient(docId: string) {
  await prisma.globalGoogleAdsClient.delete({ where: { id: docId } });
}
