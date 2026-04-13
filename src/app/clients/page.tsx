import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ClientsListClient from "@/components/clients/ClientsListClient";
import styles from "./clients.module.css";

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/");
  }

  // Pre-fetch all clients implicitly pulling their checklist states to enable advanced mathematical SSR filtering
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      onboardingTasks: true
    }
  });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1 style={{ margin: 0 }}>My Clients</h1>
      <ClientsListClient initialClients={clients} />
    </div>
  );
}
