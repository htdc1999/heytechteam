"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { Moon, Sun, Search } from "lucide-react";
import { getClientSearchList } from "@/app/actions";
import styles from "./Header.module.css";

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const [theme, setTheme] = useState("light");

  // Omni-search Hooks
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  // Fetch client index mapped purely if session connects
  useEffect(() => {
    if (session?.user?.id) {
       getClientSearchList().then(res => setClients(res));
    }
  }, [session]);

  // Click-away interaction listener for the OmniSearch Modal
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
         setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link href="/">HeyTechTeam</Link>
      </div>

      {session && (
        <div className={styles.searchContainer} ref={searchContainerRef}>
           <Search size={16} className={styles.searchIcon} />
           <input 
             type="text" 
             placeholder="Jump to a client..."
             value={searchQuery}
             onChange={e => { setSearchQuery(e.target.value); setIsFocused(true); }}
             onFocus={() => setIsFocused(true)}
             className={styles.searchInput}
           />
           {isFocused && searchQuery.length > 0 && (
             <div className={styles.searchResults}>
                {filteredClients.length === 0 ? (
                   <div style={{ padding: '0.75rem 1rem', opacity: 0.5, fontSize: '0.9rem' }}>No clients mapped...</div>
                ) : (
                   filteredClients.map(c => (
                     <button 
                       key={c.id} 
                       className={styles.searchItem}
                       onClick={() => {
                          setSearchQuery("");
                          setIsFocused(false);
                          router.push(`/clients/${c.id}`);
                       }}
                       style={{ 
                         textAlign: 'left', 
                         width: '100%', 
                         background: 'none', 
                         border: 'none', 
                         borderBottom: '1px solid var(--border-color)', 
                         cursor: 'pointer', 
                         fontFamily: 'inherit', 
                         fontSize: '0.95rem' 
                       }}
                     >
                        {c.name}
                     </button>
                   ))
                )}
             </div>
           )}
        </div>
      )}

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
