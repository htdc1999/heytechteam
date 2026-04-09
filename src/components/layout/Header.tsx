"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import styles from "./Header.module.css";

export default function Header() {
  const { data: session } = useSession();
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link href="/">HeyTechTeam</Link>
      </div>
      <nav className={styles.nav}>
        <Link href="/clients" className={styles.link}>Clients</Link>
        <Link href="/history" className={styles.link}>Change History</Link>
        <button onClick={toggleTheme} className={styles.iconBtn} aria-label="Toggle Dark Mode">
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        {session ? (
          <div className={styles.profileBox}>
            <span className={styles.email}>{session.user?.email}</span>
            <button onClick={() => signOut()} className={`${styles.authBtn} ${styles.logoutText}`}>Logout</button>
          </div>
        ) : (
          <button onClick={() => signIn("google")} className={styles.authBtn}>Login</button>
        )}
      </nav>
    </header>
  );
}
