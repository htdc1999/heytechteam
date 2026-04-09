import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import styles from "./page.module.css";
import LoginButton from "@/components/auth/LoginButton";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/clients");
  }

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
