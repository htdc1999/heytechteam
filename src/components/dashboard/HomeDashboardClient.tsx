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
import { Edit2, Save, Trash2, Plus, GripVertical, AlertTriangle } from "lucide-react";
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
        const activeLayout = DEFAULT_LAYOUT.filter(x => parsedLayout.includes(x)).concat(DEFAULT_LAYOUT.filter(x => !parsedLayout.includes(x)));
        setOrder(activeLayout);
      } catch (e) {}
    }
    // Set mounted flag after initial setup
    setTimeout(() => { isMounted.current = true; }, 100);
  }, []);

  // Native React logic mapping cleanly: Save automatically any time the order changes after mount!
  useEffect(() => {
     if (isMounted.current) {
        localStorage.setItem("heyTechTeamLayout", JSON.stringify(order));
     }
  }, [order]);

  // Notes State
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesStr, setNotesStr] = useState(initialGlobalNote);

  // Link Docs States
  const [addingDocType, setAddingDocType] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [docLink, setDocLink] = useState("");

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
            <textarea 
              value={notesStr} 
              onChange={e => setNotesStr(e.target.value)} 
              className={styles.textArea}
              placeholder="Agency-wide internal notes..."
              autoFocus
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
          <p className={styles.textDisplay}>
            {notesStr ? notesStr : <span style={{ opacity: 0.5, fontStyle: 'italic' }}>No global notes stored...</span>}
          </p>
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
                   <strong>{c.name}</strong> <span>{warnText}</span>
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
    "google-ads": () => renderGenericDocsWidget("google-ads", "Google Ads Clients", initialGlobalAdsDocs, addGlobalGoogleAdsClient, deleteGlobalGoogleAdsClient),
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
