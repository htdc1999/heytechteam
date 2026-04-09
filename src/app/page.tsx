import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";
import LoginButton from "@/components/auth/LoginButton";
import HomeDashboardClient from "@/components/dashboard/HomeDashboardClient";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1>Welcome to HeyTechTeam</h1>
          <p>Please sign in with your heytony.ca account to continue.</p>
          <LoginButton />
        </div>
      </div>
    );
  }

  // Extract name before @heytony.ca
  const emailNameMatch = session.user.email?.match(/^([^@]+)@heytony\.ca$/);
  let displayName = emailNameMatch ? emailNameMatch[1] : "User";
  // Capitalize first letter safely
  displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1).toLowerCase();

  // Fetch Core User Profile
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  const layoutPreference = dbUser?.dashboardLayout || null;

  // Fetch Clients and Pre-Compute Filters
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      auditTasks: true
    }
  });

  const now = Date.now();
  const msPerDay = 1000 * 60 * 60 * 24;

  const clientsNeedingGbpPosts = clients.filter(c => {
    if (!c.gbpPostsScheduledUntil) return true;
    const targetDate = new Date(c.gbpPostsScheduledUntil).getTime();
    return ((targetDate - now) / msPerDay) < 14;
  });

  const clientsNeedingAuditAttention = clients.filter(c => {
    if (!c.auditTasks || c.auditTasks.length === 0) return true;
    let highestDate = 0;
    c.auditTasks.forEach(task => {
      if (task.lastWorkedOn) {
        const ts = new Date(task.lastWorkedOn).getTime();
        if (ts > highestDate) highestDate = ts;
      }
    });
    if (highestDate === 0) return true;
    return ((now - highestDate) / msPerDay) > 60;
  });

  // Fetch Global Datasets
  const globalNoteRecord = await prisma.globalNote.findUnique({ where: { id: "global" } });
  const globalTasks = await prisma.globalTask.findMany({ orderBy: { createdAt: "asc" } });
  const globalGbpDocs = await prisma.globalGbpDocument.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <HomeDashboardClient 
        userName={displayName}
        clients={clients}
        clientsNeedingGbpPosts={clientsNeedingGbpPosts}
        clientsNeedingAuditAttention={clientsNeedingAuditAttention}
        initialGlobalNote={globalNoteRecord?.content || ""}
        initialGlobalTasks={globalTasks}
        initialGlobalGbpDocs={globalGbpDocs}
        savedLayout={layoutPreference}
      />
    </div>
  );
}
