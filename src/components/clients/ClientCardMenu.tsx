"use client";

import { useState, useRef, useEffect } from "react";
import { deleteClient } from "@/app/actions";
import { MoreVertical, Trash2 } from "lucide-react";
import styles from "./ClientCardMenu.module.css";

export default function ClientCardMenu({ id }: { id: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    setIsOpen(false);
    if (confirm("Are you sure you want to permanently delete this client and ALL of their attached data? This cannot be undone.")) {
      setIsPending(true);
      try {
        await deleteClient(id);
      } catch (err) {
        console.warn(err);
      }
      window.location.reload();
    }
  };

  return (
    <div className={styles.menuContainer} ref={menuRef} onClick={(e) => e.preventDefault()}>
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); }} 
        className={`${styles.menuTrigger} card-menu-trigger`}
        aria-label="Options"
      >
        <MoreVertical size={20} />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <button onClick={handleDelete} disabled={isPending} className={styles.deleteOption}>
            <Trash2 size={16} />
            {isPending ? "Deleting..." : "Delete Client"}
          </button>
        </div>
      )}
    </div>
  );
}
