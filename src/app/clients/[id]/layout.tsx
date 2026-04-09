import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import styles from "./layout.module.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ClientLayout(props: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { children } = props;
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const client = await prisma.client.findUnique({
    where: { id: params.id },
  });

  if (!client) {
    notFound();
  }

  const links = [
    { href: `/clients/${client.id}`, label: "Overview" },
    { href: `/clients/${client.id}/gbp-opt`, label: "GBP Optimizations" },
    { href: `/clients/${client.id}/gbp-posts`, label: "GBP Posts" },
    { href: `/clients/${client.id}/onboarding`, label: "Onboarding Checklist" },
    { href: `/clients/${client.id}/audit`, label: "Audit Tool Tasks" },
    { href: `/clients/${client.id}/media`, label: "Client Media Files" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <h2 className={styles.clientName}>{client.name}</h2>
        <nav className={styles.nav}>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={styles.navLink}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
