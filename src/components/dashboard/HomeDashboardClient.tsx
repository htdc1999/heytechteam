"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  updateGlobalNote, 
  addGlobalTask, 
  toggleGlobalTask, 
  deleteGlobalTask,
  addGlobalGbpDocument, deleteGlobalGbpDocument,
  addGlobalEmailTemplate, deleteGlobalEmailTemplate,
  addGlobalGoogleAdsClient, deleteGlobalGoogleAdsClient
} from "@/app/actions";
import { Edit2, Save, Trash2, Plus, GripVertical, AlertTriangle, Info, X } from "lucide-react";
import Editor from "@/components/layout/Editor";
import styles from "./HomeDashboardClient.module.css";

const DEFAULT_LAYOUT = ["notes", "gbp-sheets", "email-templates", "google-ads", "alerts", "one-off-tasks"];

export default function HomeDashboardClient({ 
  userName,
  clients,
  clientsNeedingGbpPosts,
  clientsNeedingAuditAttention,
  initialGlobalNote,
  initialGlobalTasks,
  initialGlobalGbpDocs,
  initialGlobalEmailDocs,
  initialGlobalAdsDocs
}: any) {
  
  // Drag and Drop Grid Layout State using LocalStorage for persistence
  const [order, setOrder] = useState<string[]>(DEFAULT_LAYOUT);
  const dragItemNode = useRef<any>(null);
  const dragItemIndex = useRef<number | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Tracks if the component has mounted to prevent wiping localstorage on load
  const isMounted = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem("heyTechTeamLayout");
    if (saved) {
      try {
        const parsedLayout = JSON.parse(saved);
        if (Array.isArray(parsedLayout)) {
           // We MUST iterate over the parsedLayout first to maintain the saved sequence order!
           const activeLayout = parsedLayout
             .filter(x => DEFAULT_LAYOUT.includes(x))
             .concat(DEFAULT_LAYOUT.filter(x => !parsedLayout.includes(x)));
           setOrder(activeLayout);
        }
      } catch (e) {}
    }
    setTimeout(() => { isMounted.current = true; }, 100);
  }, []);

  // Notes State
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesStr, setNotesStr] = useState(initialGlobalNote);

  // Link Docs States
  const [addingDocType, setAddingDocType] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [docLink, setDocLink] = useState("");

  // Google Ads Sub-States
  const [adsClientNames, setAdsClientNames] = useState("");
  const [adsClientEmails, setAdsClientEmails] = useState("");
  const [adsNotes, setAdsNotes] = useState("");
  const [activeInfoDocId, setActiveInfoDocId] = useState<string | null>(null);

  // Tasks State
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskName, setTaskName] = useState("");

  // --- DND HANDLERS ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItemNode.current = e.target;
    dragItemIndex.current = index;
    setTimeout(() => { if (dragItemNode.current) dragItemNode.current.style.opacity = "0.4"; }, 0);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (dragItemNode.current && dragItemNode.current !== e.target && dragItemIndex.current !== null) {
      const draggedItemIndex = dragItemIndex.current;
      setOrder(oldOrder => {
        const newOrder = [...oldOrder];
        const item = newOrder.splice(draggedItemIndex, 1)[0];
        newOrder.splice(index, 0, item);
        dragItemIndex.current = index;
        
        if (typeof window !== "undefined") {
           localStorage.setItem("heyTechTeamLayout", JSON.stringify(newOrder));
        }
        
        return newOrder;
      });
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    if (dragItemNode.current) {
      dragItemNode.current.style.opacity = "1";
    }
    dragItemNode.current = null;
    dragItemIndex.current = null;
  };

  // --- WIDGET RENDERERS ---
  const renderTechTeamNotes = () => (
    <div className={styles.widgetCard}>
      <div className={styles.widgetHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="handle">
           <GripVertical size={16} className={styles.dragIcon} />
           <h3>Tech Team Notes (Global)</h3>
        </div>
        {!isEditingNotes && (
          <button onClick={() => setIsEditingNotes(true)} className={styles.iconBtn}><Edit2 size={16}/></button>
        )}
      </div>
      <div className={styles.widgetBody}>
        {isEditingNotes ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
            <Editor 
              value={notesStr}
              onChange={setNotesStr}
              placeholder="Agency-wide internal notes..."
              minHeight="200px"
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={async () => {
                   setIsPending(true);
                   await updateGlobalNote(notesStr);
                   window.location.reload();
                }} 
                disabled={isPending} 
                className="btn btn-success"
              >
                {isPending ? "Saving..." : "Save Notes"}
              </button>
              <button onClick={() => { setIsEditingNotes(false); setNotesStr(initialGlobalNote); }} disabled={isPending} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.textDisplay}>
            {notesStr ? <div dangerouslySetInnerHTML={{ __html: notesStr }} /> : <span style={{ opacity: 0.5, fontStyle: 'italic' }}>No global notes stored...</span>}
          </div>
        )}
      </div>
    </div>
  );

  const renderGenericDocsWidget = (
    widgetId: string, 
    title: string, 
    list: any[], 
    addFn: any, 
    delFn: any
  ) => (
    <div className={styles.widgetCard}>
      <div className={styles.widgetHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="handle">
           <GripVertical size={16} className={styles.dragIcon} />
           <h3>{title}</h3>
        </div>
        <button onClick={() => setAddingDocType(addingDocType === widgetId ? null : widgetId)} className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}>
           <Plus size={14} style={{ marginRight: '4px' }}/> Add Item
        </button>
      </div>

      {addingDocType === widgetId && (
        <div className={styles.inlineForm}>
          <input type="text" placeholder="Title/Name" value={docTitle} onChange={e=>setDocTitle(e.target.value)} className={styles.inputField} />
          <input type="url" placeholder="https://docs.google.com/..." value={docLink} onChange={e=>setDocLink(e.target.value)} className={styles.inputField} />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={async () => {
               if(!docTitle || !docLink) return;
               setIsPending(true);
               await addFn({ title: docTitle, link: docLink });
               window.location.reload();
            }} disabled={isPending} className="btn btn-success">Save Link</button>
            <button onClick={() => setAddingDocType(null)} disabled={isPending} className="btn btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <tbody>
            {list.map((doc: any) => (
              <tr key={doc.id}>
                <td style={{ fontWeight: 600 }}>{doc.title}</td>
                <td><Link href={doc.link} target="_blank" className={styles.externalLink}>Open Link</Link></td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={async () => {
                    if(confirm("Remove this link?")) {
                      setIsPending(true);
                      await delFn(doc.id);
                      window.location.reload();
                    }
                  }} className={styles.iconBtnError}><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={3} style={{ fontStyle: 'italic', opacity: 0.5 }}>No links mapped yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderGoogleAdsWidget = () => (
    <div className={styles.widgetCard}>
      <div className={styles.widgetHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="handle">
           <GripVertical size={16} className={styles.dragIcon} />
           <h3>Google Ads Clients</h3>
        </div>
        <button onClick={() => setAddingDocType(addingDocType === "google-ads" ? null : "google-ads")} className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}>
           <Plus size={14} style={{ marginRight: '4px' }}/> Add Item
        </button>
      </div>

      {addingDocType === "google-ads" && (
        <div className={styles.inlineForm} style={{ flexDirection: 'column', gap: '0.8rem' }}>
          <input type="text" placeholder="Title/Name (Primary)" value={docTitle} onChange={e=>setDocTitle(e.target.value)} className={styles.inputField} />
          <input type="url" placeholder="https://docs.google.com/..." value={docLink} onChange={e=>setDocLink(e.target.value)} className={styles.inputField} />
          <textarea placeholder="Client Names (1 per line)" value={adsClientNames} onChange={e=>setAdsClientNames(e.target.value)} className={styles.textArea} rows={3} />
          <textarea placeholder="Client Emails (1 per line)" value={adsClientEmails} onChange={e=>setAdsClientEmails(e.target.value)} className={styles.textArea} rows={3} />
          <Editor 
            value={adsNotes}
            onChange={setAdsNotes}
            placeholder="Global tracking notes..."
            minHeight="120px"
          />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={async () => {
               if(!docTitle || !docLink) return;
               setIsPending(true);
               await addGlobalGoogleAdsClient({ 
                  title: docTitle, 
                  link: docLink,
                  clientNames: adsClientNames || null,
                  clientEmails: adsClientEmails || null,
                  notes: adsNotes || null
               });
               window.location.reload();
            }} disabled={isPending} className="btn btn-success">Save Global Ads Client</button>
            <button onClick={() => setAddingDocType(null)} disabled={isPending} className="btn btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <tbody>
            {initialGlobalAdsDocs.map((doc: any) => (
              <tr key={doc.id}>
                <td style={{ fontWeight: 600 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {doc.title}
                      <button onClick={() => setActiveInfoDocId(doc.id)} className={styles.iconBtn} title="View Details">
                         <Info size={16} />
                      </button>
                   </div>
                </td>
                <td><Link href={doc.link} target="_blank" className={styles.externalLink}>Open Link</Link></td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={async () => {
                    if(confirm("Remove this client from the matrix?")) {
                      setIsPending(true);
                      await deleteGlobalGoogleAdsClient(doc.id);
                      window.location.reload();
                    }
                  }} className={styles.iconBtnError}><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
            {initialGlobalAdsDocs.length === 0 && (
              <tr><td colSpan={3} style={{ fontStyle: 'italic', opacity: 0.5 }}>No clients mapped yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Dynamic Popover Overlay built cleanly */}
      {activeInfoDocId && (
         <div className={styles.modalOverlay} onClick={() => setActiveInfoDocId(null)}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
               <div className={styles.modalHeader}>
                  <h3>Tracking Details</h3>
                  <button onClick={() => setActiveInfoDocId(null)} className={styles.iconBtn}><X size={20}/></button>
               </div>
               
               {initialGlobalAdsDocs.find((x:any) => x.id === activeInfoDocId) && (() => {
                  const activeDoc = initialGlobalAdsDocs.find((x:any) => x.id === activeInfoDocId)!;
                  return (
                     <div className={styles.modalBody}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                           <div>
                              <h4 style={{ color: 'var(--primary)', margin: '0 0 0.5rem 0' }}>Client Names</h4>
                              <div className={styles.infoBox}>
                                 {activeDoc.clientNames ? activeDoc.clientNames.split('\n').map((n:string, i:number) => n.trim() && <div key={i}>{n}</div>) : <em style={{opacity:0.5}}>None tracked</em>}
                              </div>
                           </div>
                           <div>
                              <h4 style={{ color: 'var(--primary)', margin: '0 0 0.5rem 0' }}>Emails</h4>
                              <div className={styles.infoBox}>
                                 {activeDoc.clientEmails ? activeDoc.clientEmails.split('\n').map((e:string, i:number) => e.trim() && <div key={i}>{e}</div>) : <em style={{opacity:0.5}}>None tracked</em>}
                              </div>
                           </div>
                        </div>
                        <div>
                           <h4 style={{ color: 'var(--secondary)', margin: '0 0 0.5rem 0' }}>Internal Notes</h4>
                           <div className={styles.infoBox} style={{ whiteSpace: 'pre-wrap', minHeight: '80px' }}>
                              {activeDoc.notes ? <div dangerouslySetInnerHTML={{ __html: activeDoc.notes }} /> : <em style={{opacity:0.5}}>No notes attached.</em>}
                           </div>
                        </div>
                     </div>
                  );
               })()}
            </div>
         </div>
      )}
    </div>
  );

  const renderWarningSubList = (title: string, list: any[], warnText: string) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, color: 'var(--text-color)' }}>
         {list.length > 0 && <AlertTriangle size={18} color="var(--danger)" />}
         {title}
      </h4>
      <div className={styles.warningListWrapper} style={{ borderLeft: list.length > 0 ? '4px solid var(--danger)' : '4px solid var(--success)', paddingLeft: '1rem' }}>
        {list.length === 0 ? (
           <p style={{ color: 'var(--success)', fontWeight: 500, margin: 0 }}>All Healthy!</p>
        ) : (
           <div className={styles.warningList}>
             {list.map(c => (
                <Link key={c.id} href={`/clients/${c.id}`} className={styles.warningPill}>
                   <strong>{c.name}</strong> <span>{c.badgeText || warnText}</span>
                </Link>
             ))}
           </div>
        )}
      </div>
    </div>
  );

  const renderCombinedAlerts = () => (
    <div className={styles.widgetCard}>
      <div className={styles.widgetHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="handle">
           <GripVertical size={16} className={styles.dragIcon} />
           <h3>Client Action Alerts</h3>
        </div>
      </div>
      <div className={styles.widgetBody}>
         <div className={styles.combinedAlertGrid}>
            {renderWarningSubList("Clients Requiring GBP Posts", clientsNeedingGbpPosts, "< 2 Weeks Scheduled")}
            {renderWarningSubList("Clients Requiring Audit Attention", clientsNeedingAuditAttention, "> 60 Days Aging")}
         </div>
      </div>
    </div>
  );

  const renderOneOffTasks = () => (
    <div className={styles.widgetCard}>
      <div className={styles.widgetHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="handle">
           <GripVertical size={16} className={styles.dragIcon} />
           <h3>1 Off Tasks (Global)</h3>
        </div>
        <button onClick={() => setIsAddingTask(!isAddingTask)} className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}>
           <Plus size={14} style={{ marginRight: '4px' }}/> Add Task
        </button>
      </div>

      {isAddingTask && (
        <div className={styles.inlineTaskForm}>
          <input type="text" placeholder="Enter universal task name..." value={taskName} onChange={e=>setTaskName(e.target.value)} className={styles.inputField} />
          <button onClick={async () => {
             if(!taskName) return;
             setIsPending(true);
             await addGlobalTask(taskName);
             window.location.reload();
          }} disabled={isPending} className="btn btn-success">Save Task</button>
        </div>
      )}

      <div className={styles.taskContainer}>
         {initialGlobalTasks.length === 0 && <span style={{ opacity: 0.5, fontStyle: 'italic', display: 'block', padding: '1rem 0' }}>No tasks initialized.</span>}
         {initialGlobalTasks.map((t: any) => (
            <div key={t.id} className={styles.taskRow}>
               <label className={styles.taskLabel}>
                  <input 
                    type="checkbox" 
                    checked={t.isCompleted} 
                    onChange={async (e) => {
                      setIsPending(true);
                      await toggleGlobalTask(t.id, e.target.checked);
                      window.location.reload();
                    }} 
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ textDecoration: t.isCompleted ? 'line-through' : 'none', opacity: t.isCompleted ? 0.6 : 1 }}>
                     {t.taskName}
                  </span>
               </label>
               <button onClick={async () => {
                  if(confirm("Erase this universal task forever?")) {
                     setIsPending(true);
                     await deleteGlobalTask(t.id);
                     window.location.reload();
                  }
               }} className={styles.iconBtnError} title="Delete Task"><Trash2 size={16}/></button>
            </div>
         ))}
      </div>
    </div>
  );

  const blockMap: Record<string, () => React.ReactNode> = {
    "notes": renderTechTeamNotes,
    "gbp-sheets": () => renderGenericDocsWidget("gbp-sheets", "GBP Master Sheets", initialGlobalGbpDocs, addGlobalGbpDocument, deleteGlobalGbpDocument),
    "email-templates": () => renderGenericDocsWidget("email-templates", "Email Templates", initialGlobalEmailDocs, addGlobalEmailTemplate, deleteGlobalEmailTemplate),
    "google-ads": renderGoogleAdsWidget,
    "alerts": renderCombinedAlerts,
    "one-off-tasks": renderOneOffTasks
  };

  return (
    <div className={styles.dashboardWrapper} style={{ opacity: isPending ? 0.5 : 1, pointerEvents: isPending ? 'none' : 'auto' }}>
       
       {/* LEFT COLUMN */}
       <div className={styles.sidebarColumn}>
          <div className={styles.welcomeBox}>
             <h1>Welcome {userName}</h1>
             <p>Jump to a client dashboard:</p>
          </div>
          
          <div className={styles.clientListScroller}>
             {clients.map((c: any) => (
               <Link key={c.id} href={`/clients/${c.id}`} className={styles.clientListItem}>
                  {c.name}
               </Link>
             ))}
             {clients.length === 0 && <div style={{ padding: '1rem', opacity: 0.5 }}>No clients active globally.</div>}
          </div>
       </div>

       {/* RIGHT COLUMN (WIDGET BOARD) */}
       <div className={styles.widgetColumn}>
          {order.map((widgetId, index) => (
             <div 
               key={widgetId}
               draggable
               onDragStart={(e) => handleDragStart(e, index)}
               onDragEnter={(e) => handleDragEnter(e, index)}
               onDragEnd={handleDragEnd}
               onDragOver={(e) => e.preventDefault()}
               className={styles.draggableWrapper}
             >
                {blockMap[widgetId] ? blockMap[widgetId]() : null}
             </div>
          ))}
       </div>
    </div>
  );
}
