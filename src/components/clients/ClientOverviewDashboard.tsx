"use client";

import { useState } from "react";
import { updateClientNotes, updateGbpPostsScheduledUntil } from "@/app/actions";
import { Edit2, Save, Trash2, Calendar, AlertTriangle } from "lucide-react";
import styles from "./ClientOverviewDashboard.module.css";

export default function ClientOverviewDashboard({ 
  client, 
  onboardingTasks, 
  auditTasks 
}: { 
  client: any; 
  onboardingTasks: any[]; 
  auditTasks: any[]; 
}) {
  const [isPending, setIsPending] = useState(false);
  
  // Notes State
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesStr, setNotesStr] = useState(client.clientNotes || "");

  // Audit calculations
  let highestDate = 0;
  auditTasks.forEach(task => {
    if (task.lastWorkedOn) {
      const ts = new Date(task.lastWorkedOn).getTime();
      if (ts > highestDate) highestDate = ts;
    }
  });

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysSinceAudit = highestDate === 0 ? null : Math.floor((Date.now() - highestDate) / msPerDay);
  const isAuditWarning = daysSinceAudit === null || daysSinceAudit > 60;

  // Onboarding calculations
  const totalOnboarding = onboardingTasks.length;
  const completedOnboarding = onboardingTasks.filter(t => t.isCompleted).length;
  const onboardingProgress = totalOnboarding === 0 ? 0 : Math.round((completedOnboarding / totalOnboarding) * 100);

  // BrightLocal Integration
  const isBrightLocalDone = onboardingTasks.some(t => t.taskName === "Add Client To BrightLocal" && t.isCompleted);
  const scheduledDate = client.gbpPostsScheduledUntil ? new Date(client.gbpPostsScheduledUntil) : null;
  
  // Format for input field YYYY-MM-DD
  const [tempDateStr, setTempDateStr] = useState(
    scheduledDate ? scheduledDate.toISOString().split('T')[0] : ""
  );

  const handleSaveNotes = async () => {
    setIsPending(true);
    try {
      await updateClientNotes(client.id, notesStr);
    } catch (e) { console.warn(e); }
    window.location.reload();
  };

  const handleDateSave = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setIsPending(true);
    try {
      await updateGbpPostsScheduledUntil(client.id, newVal || null);
    } catch (err) { console.warn(err); }
    window.location.reload();
  };

  return (
    <div className={styles.dashboardContainer} style={{ opacity: isPending ? 0.5 : 1, pointerEvents: isPending ? 'none' : 'auto' }}>
      
      {/* Top Header Block */}
      <div className={styles.headerBlock}>
        <div className={styles.profileMeta}>
          <h1>{client.name}</h1>
          <p className={styles.joinedText}>Onboarded on {new Date(client.createdAt).toLocaleDateString()}</p>
        </div>
        
        {client.gbpFocusKeyword && (
           <div className={styles.focusPill}>
             <span>Focus Keyword</span>
             <strong>{client.gbpFocusKeyword}</strong>
           </div>
        )}
      </div>

      <div className={styles.grid}>

        {/* Notes Block */}
        <div className={`${styles.card} ${styles.notesCard}`}>
          <div className={styles.cardHeader}>
             <h3>Client Notes</h3>
             {!isEditingNotes ? (
               <button onClick={() => setIsEditingNotes(true)} className={styles.iconButton}><Edit2 size={16} /></button>
             ) : (
               <div style={{ display: 'flex', gap: '0.5rem' }}>
                 <button onClick={handleSaveNotes} className={styles.iconButtonSuccess}><Save size={16} /></button>
                 <button onClick={() => { setNotesStr(""); }} className={styles.iconButtonError} title="Clear Notes"><Trash2 size={16} /></button>
               </div>
             )}
          </div>
          
          <div className={styles.cardBody}>
            {isEditingNotes ? (
              <textarea 
                value={notesStr} 
                onChange={e => setNotesStr(e.target.value)} 
                className={styles.notesTextarea}
                placeholder="Enter important client notes, contact info, or budgets here..."
                autoFocus
              />
            ) : (
              <p className={styles.notesDisplay}>
                {client.clientNotes ? client.clientNotes : <span style={{ opacity: 0.5, fontStyle: 'italic' }}>No notes have been saved yet.</span>}
              </p>
            )}
          </div>
        </div>

        {/* Health Trackers */}
        <div className={styles.healthTrackers}>
          
          {/* Onboarding */}
          <div className={styles.subCard}>
             <h4>Onboarding Progress</h4>
             <div className={styles.progressHeader}>
               <span className={styles.progressRatio}>{completedOnboarding} / {totalOnboarding} Tasks Completed</span>
               <span className={styles.progressPercent}>{onboardingProgress}%</span>
             </div>
             <div className={styles.progressBarWrapper}>
               <div className={styles.progressBarFill} style={{ width: `${onboardingProgress}%` }}></div>
             </div>
          </div>

          {/* Audits */}
          <div className={`${styles.subCard} ${isAuditWarning ? styles.auditWarning : styles.auditHealthy}`}>
            <h4>Audit Recency Health</h4>
            <div className={styles.auditStatus}>
               {isAuditWarning && <AlertTriangle size={24} className={styles.warningIcon} />}
               <div className={styles.auditText}>
                 {daysSinceAudit === null ? (
                   <span className={styles.dangerText}><strong>WARNING:</strong> No Audit Tool tasks have ever been worked on!</span>
                 ) : isAuditWarning ? (
                   <span className={styles.dangerText}><strong>ACTION REQUIRED:</strong> It has been {daysSinceAudit} days since audit tool issues were last checked.</span>
                 ) : (
                   <span className={styles.healthyText}>{daysSinceAudit} days since audit tool issues were checked. (Healthy)</span>
                 )}
               </div>
            </div>
          </div>
        </div>

        {/* GBP Posts Calendar Link (Conditional) */}
        {isBrightLocalDone && (
          <div className={`${styles.card} ${styles.calendarCard}`}>
             <h3>GBP Posts Scheduled Upto:</h3>
             
             <div className={styles.calendarLayout}>
                {/* Custom CSS Graphic */}
                <div className={styles.calendarIconWrapper}>
                  <div className={styles.calendarGraphic}>
                    <div className={styles.calTopBar}>
                      <span className={styles.calMonth}>{scheduledDate ? scheduledDate.toLocaleString('default', { month: 'short' }).toUpperCase() : 'MM'}</span>
                    </div>
                    <div className={styles.calHoles}>
                       <div className={styles.hole}></div>
                       <div className={styles.hole}></div>
                       <div className={styles.hole}></div>
                    </div>
                    <div className={styles.calBody}>
                       <div className={styles.calFold}></div>
                       <span className={styles.calDay}>{scheduledDate ? scheduledDate.getDate() : '--'}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.calendarAction}>
                  <label className={styles.dateLabel} htmlFor="gbp-schedule-date">
                     <Calendar size={16} /> Select End Date
                  </label>
                  <input 
                    id="gbp-schedule-date"
                    type="date" 
                    value={tempDateStr} 
                    onChange={handleDateSave}
                    className={styles.dateInput}
                  />
                  {scheduledDate && (
                    <button 
                      onClick={() => handleDateSave({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>)}
                      className={styles.clearDateBtn}
                    >
                      Clear Date
                    </button>
                  )}
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
