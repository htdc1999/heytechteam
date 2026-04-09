import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./clients.module.css";
import { addClient } from "../actions";
import ClientCardMenu from "@/components/clients/ClientCardMenu";

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/");
  }

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h1>My Clients</h1>
        <form action={addClient} className={styles.addForm}>
          <input type="text" name="name" placeholder="New Client Name" required className={styles.input} />
          <button type="submit" className="btn btn-success">+ Add</button>
        </form>
      </div>

      {clients.length === 0 ? (
        <p>No clients assigned to you yet.</p>
      ) : (
        <div className={styles.grid}>
          {clients.map(client => (
            <div key={client.id} className={`${styles.card} client-card-hover-group`}>
              <Link href={`/clients/${client.id}`} className={styles.cardLink}>
                <h2>{client.name}</h2>
              </Link>
              <ClientCardMenu id={client.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
