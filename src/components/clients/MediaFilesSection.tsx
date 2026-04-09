"use client";

import { useState, useTransition } from "react";
import { addMediaFile, deleteMediaFile, editMediaFile } from "@/app/actions";
import { Plus, Edit, Trash2, X } from "lucide-react";
import styles from "./MediaFilesSection.module.css";
import Link from "next/link";

type MediaFile = {
  id: string;
  type: string;
  link: string;
  description: string;
};

export default function MediaFilesSection({ clientId, initialFiles }: { clientId: string, initialFiles: MediaFile[] }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [addingType, setAddingType] = useState<string | null>(null);
  
  const [linkStr, setLinkStr] = useState("");
  const [descriptionStr, setDescriptionStr] = useState("");

  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);

  const [isPending, startTransition] = useTransition();

  const mediaTypes = ["Images", "Videos", "PDF", "Downloadable", "Other"];

  const handleSelectType = (type: string) => {
    setAddingType(type);
    setDropdownOpen(false);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingType) return;
    
    startTransition(async () => {
      await addMediaFile(clientId, { type: addingType, link: linkStr, description: descriptionStr });
      setAddingType(null);
      setLinkStr("");
      setDescriptionStr("");
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFile) return;

    startTransition(async () => {
      await editMediaFile(clientId, editingFile.id, { 
        type: editingFile.type, 
        link: editingFile.link, 
        description: editingFile.description 
      });
      setEditingFile(null);
    });
  };

  const handleDelete = (mediaId: string) => {
    if (confirm("Are you sure you want to delete this media file?")) {
      startTransition(async () => {
         await deleteMediaFile(clientId, mediaId);
      });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Client Media Files</h2>
        
        <div className={styles.dropdownContainer}>
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className={`btn btn-primary ${styles.addBtn}`}>
             <Plus size={16} /> Add Media
          </button>

          {dropdownOpen && (
            <div className={styles.dropdownMenu}>
              {mediaTypes.map(t => (
                <button key={t} onClick={() => handleSelectType(t)} className={styles.dropdownItem}>{t}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {addingType && (
        <div className={styles.inlineFormBox}>
          <div className={styles.formHeader}>
            <h3>Adding {addingType} File</h3>
            <button onClick={() => setAddingType(null)} className={styles.iconButton}><X size={18} /></button>
          </div>
          <form onSubmit={handleAddSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Link (Google Drive, Dropbox, etc.)</label>
              <input type="url" value={linkStr} onChange={e => setLinkStr(e.target.value)} required placeholder="https://..." />
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea value={descriptionStr} onChange={e => setDescriptionStr(e.target.value)} required placeholder="Briefly describe what's inside and where to use it..." rows={2} />
            </div>
            <button type="submit" disabled={isPending} className="btn btn-success" style={{ alignSelf: "flex-start" }}>
              {isPending ? "Saving..." : "Add to Client"}
            </button>
          </form>
        </div>
      )}

      {initialFiles.length === 0 ? (
        <div className={styles.empty}>No media files securely linked yet. Click Add Media to attach a folder.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>File Type</th>
                <th>Description</th>
                <th>File Link</th>
                <th style={{ width: '80px' }}></th>
              </tr>
            </thead>
            <tbody>
              {initialFiles.map(file => (
                <tr key={file.id}>
                  <td><span className={styles.badge}>{file.type}</span></td>
                  <td>{file.description}</td>
                  <td>
                    <Link href={file.link} target="_blank" className={styles.externalLink}>Open Link</Link>
                  </td>
                  <td className={styles.actions}>
                    <button onClick={() => setEditingFile(file)} className={styles.iconButton}><Edit size={16} /></button>
                    <button onClick={() => handleDelete(file.id)} className={styles.iconButtonError}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Modal for Edit */}
      {editingFile && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.formHeader}>
              <h3>Edit Media File</h3>
              <button onClick={() => setEditingFile(null)} className={styles.iconButton}><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className={styles.form}>
               <div className={styles.formGroup}>
                 <label>File Type</label>
                 <select value={editingFile.type} onChange={e => setEditingFile({ ...editingFile, type: e.target.value })}>
                   {mediaTypes.map(t => <option key={t} value={t}>{t}</option>)}
                 </select>
               </div>
               <div className={styles.formGroup}>
                <label>Link (Google Drive, Dropbox, etc.)</label>
                <input type="url" value={editingFile.link} onChange={e => setEditingFile({ ...editingFile, link: e.target.value })} required />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea value={editingFile.description} onChange={e => setEditingFile({ ...editingFile, description: e.target.value })} required rows={4} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" disabled={isPending} className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                <button type="button" onClick={() => setEditingFile(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
