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
    orderBy: { name: "asc" },
    include: {
      auditTasks: true
    }
  });

  const now = Date.now();
  const msPerDay = 1000 * 60 * 60 * 24;

  const gbpAlertsRaw: any[] = [];
  clients.forEach(c => {
    let sortValue = 0;
    let badgeText = "";
    
    if (!c.gbpPostsScheduledUntil) {
       const daysSinceOut = Math.floor((now - new Date(c.createdAt).getTime()) / msPerDay);
       sortValue = -daysSinceOut; // Sort natively at the top
       badgeText = `Unscheduled for ${daysSinceOut} days`;
    } else {
       const targetDate = new Date(c.gbpPostsScheduledUntil).getTime();
       const diff = targetDate - now;
       if (diff < 0) {
          const daysSinceOut = Math.floor(Math.abs(diff) / msPerDay);
          sortValue = -daysSinceOut;
          badgeText = `Unscheduled for ${daysSinceOut} days`;
       } else {
          const daysLeft = Math.ceil(diff / msPerDay);
          if (daysLeft < 14) {
             sortValue = daysLeft;
             badgeText = `${daysLeft} days remaining`;
          } else {
             return; // Skips injection because it's completely healthy
          }
       }
    }
    gbpAlertsRaw.push({ id: c.id, name: c.name, sortValue, badgeText });
  });
  // Sort primarily from Most Overdue (-100) -> Needs Attention (13)
  const clientsNeedingGbpPosts = gbpAlertsRaw.sort((a, b) => a.sortValue - b.sortValue);

  const auditAlertsRaw: any[] = [];
  clients.forEach(c => {
    let highestDate = 0;
    if (c.auditTasks && c.auditTasks.length > 0) {
       c.auditTasks.forEach(task => {
          if (task.lastWorkedOn) {
             const ts = new Date(task.lastWorkedOn).getTime();
             if (ts > highestDate) highestDate = ts;
          }
       });
    }
    
    let daysDiff = 0;
    if (highestDate === 0 || !c.auditTasks || c.auditTasks.length === 0) {
       daysDiff = Math.floor((now - new Date(c.createdAt).getTime()) / msPerDay);
       // We add an arbitrary 10,000 day anchor to ensure they aggressively climb to the top of the sorting UI!
       auditAlertsRaw.push({
          id: c.id,
          name: c.name,
          daysSinceCheck: daysDiff + 10000, 
          badgeText: `Unchecked since creation (${daysDiff} days)`
       });
    } else {
       daysDiff = Math.floor((now - highestDate) / msPerDay);
       if (daysDiff > 60) {
          auditAlertsRaw.push({
             id: c.id,
             name: c.name,
             daysSinceCheck: daysDiff,
             badgeText: `${daysDiff} days since last check`
          });
       }
    }
  });
  // Sort from Highest Neglect (800 days) completely cleanly down to Threshold (61 days)
  const clientsNeedingAuditAttention = auditAlertsRaw.sort((a, b) => b.daysSinceCheck - a.daysSinceCheck);

  // Fetch Global Datasets
  const globalNoteRecord = await prisma.globalNote.findUnique({ where: { id: "global" } });
  const globalTasks = await prisma.globalTask.findMany({ orderBy: { createdAt: "asc" } });
  const globalGbpDocs = await prisma.globalGbpDocument.findMany({ orderBy: { createdAt: "asc" } });
  const globalEmailDocs = await prisma.globalEmailTemplate.findMany({ orderBy: { createdAt: "asc" } });
  const globalAdsDocs = await prisma.globalGoogleAdsClient.findMany({ orderBy: { createdAt: "asc" } });

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
        initialGlobalEmailDocs={globalEmailDocs}
        initialGlobalAdsDocs={globalAdsDocs}
      />
    </div>
  );
}
