import { prisma } from "@/lib/prisma";
import ClientOverviewDashboard from "@/components/clients/ClientOverviewDashboard";
import { redirect } from "next/navigation";

export default async function ClientOverviewPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      onboardingTasks: true,
      auditTasks: true,
    }
  });

  if (!client) {
    redirect("/clients");
  }

  return (
    <div>
      <ClientOverviewDashboard 
        client={client} 
        onboardingTasks={client.onboardingTasks} 
        auditTasks={client.auditTasks} 
      />
    </div>
  );
}
