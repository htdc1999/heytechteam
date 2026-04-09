import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import styles from "./history.module.css";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/");
  }

  const logs = await prisma.changeLog.findMany({
    orderBy: { timestamp: "desc" },
    include: { user: true, client: true }
  });

  return (
    <div className={styles.container}>
      <h1>Change History</h1>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Date</th>
            <th>User</th>
            <th>Action</th>
            <th>Client Name</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const details = log.details ? JSON.parse(log.details) : {};
            return (
              <tr key={log.id}>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.user?.email || "Unknown"}</td>
                <td>
                  <span className={`${styles.action} ${styles[log.action.toLowerCase()]}`}>
                    {log.action}
                  </span>
                </td>
                <td>{log.client?.name || details.name || "Unknown"}</td>
              </tr>
            );
          })}
          {logs.length === 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: "center" }}>No logs found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
