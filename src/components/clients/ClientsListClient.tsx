"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { addClient, bulkAddClients } from "@/app/actions";
import ClientCardMenu from "@/components/clients/ClientCardMenu";
import styles from "./ClientsListClient.module.css";
import { Search, Plus } from "lucide-react";

export default function ClientsListClient({ initialClients }: { initialClients: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMethod, setSortMethod] = useState("AZ"); // AZ, ZA, NEWEST, OLDEST, GBP
  
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleBulkSubmit = async () => {
    if(!bulkText.trim()) return;
    setIsPending(true);
    try {
      await bulkAddClients(bulkText);
      setIsBulkAdding(false);
      setBulkText("");
      window.location.reload();
    } catch(err) {
      console.warn(err);
      setIsPending(false);
      alert("Failed to bulk spawn clients");
    }
  };

  // Filter and Sort Logic
  const processedClients = useMemo(() => {
    let filtered = [...initialClients];
    
    // 1. Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(q));
    }

    // 2. GBP Clients Filter Segment
    if (sortMethod === "GBP") {
      filtered = filtered.filter(c => {
         return c.onboardingTasks?.some((t: any) => t.taskName === "Write GBP Profile Posts");
      });
    }

    // 3. Mathematical Dynamic Sorting
    filtered.sort((a, b) => {
      if (sortMethod === "AZ" || sortMethod === "GBP") {
        return a.name.localeCompare(b.name);
      }
      if (sortMethod === "ZA") {
        return b.name.localeCompare(a.name);
      }
      if (sortMethod === "NEWEST") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortMethod === "OLDEST") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return 0;
    });

    return filtered;
  }, [initialClients, searchQuery, sortMethod]);

  return (
    <div className={styles.container}>
      <div className={styles.toolbarRow}>
        <div className={styles.searchBlock}>
           <Search size={18} className={styles.searchIcon} />
           <input 
             type="text" 
             placeholder="Search clients..." 
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
             className={styles.searchInput}
           />
        </div>
        
        <div className={styles.controlsBlock}>
           <select 
             value={sortMethod} 
             onChange={e => setSortMethod(e.target.value)}
             className={styles.sortSelect}
           >
              <option value="AZ">Alphabetical (A-Z)</option>
              <option value="ZA">Reverse Alphabetical (Z-A)</option>
              <option value="NEWEST">Recently Added</option>
              <option value="OLDEST">Oldest First</option>
              <option value="GBP">GBP Clients Only</option>
           </select>

           <form action={addClient} className={styles.inlineForm}>
             <input type="text" name="name" placeholder="New Client Name" required className={styles.singleInput} />
             <button type="submit" className="btn btn-success" style={{ whiteSpace: 'nowrap' }}>+ Add</button>
           </form>
           
           <button 
             onClick={() => setIsBulkAdding(!isBulkAdding)} 
             className={`btn ${isBulkAdding ? 'btn-secondary' : 'btn-primary'}`}
             style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
           >
             <Plus size={16} /> Bulk Add
           </button>
        </div>
      </div>

      {isBulkAdding && (
        <div className={styles.bulkAddBox}>
           <h4>Bulk Add Clients</h4>
           <p>Enter client names, 1 per line. They will automatically be created and assigned the default Onboarding Checklists under the hood.</p>
           <textarea 
             className={styles.bulkTextarea}
             value={bulkText}
             onChange={e => setBulkText(e.target.value)}
             placeholder="Acme Corp&#10;Wayne Enterprises&#10;Stark Industries"
             rows={6}
           />
           <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={handleBulkSubmit} disabled={isPending} className="btn btn-success">
                 {isPending ? "Spawning Matrix..." : "Process Bulk Add"}
              </button>
              <button type="button" onClick={() => setIsBulkAdding(false)} disabled={isPending} className="btn btn-secondary">
                 Cancel
              </button>
           </div>
        </div>
      )}

      {processedClients.length === 0 ? (
        <p style={{ marginTop: '2rem', opacity: 0.6, fontStyle: 'italic' }}>No clients found mapping current sorting logic.</p>
      ) : (
        <div className={styles.grid}>
          {processedClients.map((client: any) => (
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
