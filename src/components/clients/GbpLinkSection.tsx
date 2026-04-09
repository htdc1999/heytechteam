"use client";

import { useState } from "react";
import { addGbpDocument, editGbpDocument, deleteGbpDocument } from "@/app/actions";
import { Plus, Edit, Trash2, X } from "lucide-react";
import styles from "./GbpLinkSection.module.css";
import Link from "next/link";

type GbpDocument = {
  id: string;
  type: string;
  title: string;
  link: string;
};

export default function GbpLinkSection({ clientId, type, initialDocs }: { clientId: string, type: "POSTS" | "OPTIMIZATIONS", initialDocs: GbpDocument[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [linkStr, setLinkStr] = useState("");
  const [titleStr, setTitleStr] = useState("");

  const [editingDoc, setEditingDoc] = useState<GbpDocument | null>(null);
  const [isPending, setIsPending] = useState(false);

  const displayTitle = type === "POSTS" ? "GBP Posts Tracking" : "GBP Optimizations Tracking";
  const noun = type === "POSTS" ? "Posts" : "Optimizations";

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      await addGbpDocument(clientId, { type, title: titleStr, link: linkStr });
    } catch (err) {
      console.warn(err);
    }
    window.location.reload();
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    setIsPending(true);
    try {
      await editGbpDocument(clientId, editingDoc.id, { 
        title: editingDoc.title, 
        link: editingDoc.link 
      });
    } catch (err) {
      console.warn(err);
    }
    window.location.reload();
  };

  const handleDelete = async (docId: string) => {
    if (confirm("Are you sure you want to completely remove this spreadsheet link?")) {
      setIsPending(true);
      try {
         await deleteGbpDocument(clientId, docId);
      } catch (err) {
         console.warn(err);
      }
      window.location.reload();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{displayTitle}</h2>
        <button onClick={() => setIsAdding(!isAdding)} className={`btn btn-primary ${styles.addBtn}`}>
           <Plus size={16} /> Add Link
        </button>
      </div>

      {isAdding && (
        <div className={styles.inlineFormBox}>
          <div className={styles.formHeader}>
            <h3>Adding a {noun} Spreadsheet</h3>
            <button onClick={() => setIsAdding(false)} className={styles.iconButton}><X size={18} /></button>
          </div>
          <form onSubmit={handleAddSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Spreadsheet Title/Name</label>
              <input type="text" value={titleStr} onChange={e => setTitleStr(e.target.value)} required placeholder="e.g. Q4 Campaigns Master Doc" />
            </div>
            <div className={styles.formGroup}>
              <label>Google Sheets Link</label>
              <input type="url" value={linkStr} onChange={e => setLinkStr(e.target.value)} required placeholder="https://docs.google.com/spreadsheets/..." />
            </div>
            <button type="submit" disabled={isPending} className="btn btn-success" style={{ alignSelf: "flex-start" }}>
              {isPending ? "Saving..." : "Save Link"}
            </button>
          </form>
        </div>
      )}

      {initialDocs.length === 0 ? (
        <div className={styles.empty}>No {noun} spreadsheets have been securely linked yet.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Document Title</th>
                <th>Spreadsheet Link</th>
                <th style={{ width: '80px' }}></th>
              </tr>
            </thead>
            <tbody>
              {initialDocs.map(doc => (
                <tr key={doc.id}>
                  <td className={styles.boldCell}>{doc.title}</td>
                  <td>
                    <Link href={doc.link} target="_blank" className={styles.externalLink}>Open Spreadsheet</Link>
                  </td>
                  <td className={styles.actions}>
                    <button onClick={() => setEditingDoc(doc)} className={styles.iconButton}><Edit size={16} /></button>
                    <button onClick={() => handleDelete(doc.id)} className={styles.iconButtonError}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Modal for Edit */}
      {editingDoc && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.formHeader}>
              <h3>Edit {noun} Link</h3>
              <button onClick={() => setEditingDoc(null)} className={styles.iconButton}><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className={styles.form}>
               <div className={styles.formGroup}>
                 <label>Spreadsheet Title/Name</label>
                 <input type="text" value={editingDoc.title} onChange={e => setEditingDoc({ ...editingDoc, title: e.target.value })} required />
               </div>
               <div className={styles.formGroup}>
                <label>Google Sheets Link</label>
                <input type="url" value={editingDoc.link} onChange={e => setEditingDoc({ ...editingDoc, link: e.target.value })} required />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" disabled={isPending} className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                <button type="button" onClick={() => setEditingDoc(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
