import { prisma } from "@/lib/prisma";
import AuditSection from "@/components/clients/AuditSection";

export default async function AuditTasksPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const tasks = await prisma.auditTask.findMany({
    where: { clientId: params.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <AuditSection clientId={params.id} initialTasks={tasks} />
    </div>
  );
}
