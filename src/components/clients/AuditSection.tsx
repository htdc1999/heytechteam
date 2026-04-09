"use client";

import { useState, useEffect } from "react";
import { markAuditTaskWorkedOn, deleteAuditTask, seedAuditTasks } from "@/app/actions";
import { Trash2, CheckCircle } from "lucide-react";
import styles from "./AuditSection.module.css";

type AuditTask = {
  id: string;
  taskName: string;
  lastWorkedOn: string | Date | null;
};

export default function AuditSection({ clientId, initialTasks }: { clientId: string, initialTasks: AuditTask[] }) {
  const [isPending, setIsPending] = useState(false);
  const [hasSeeded, setHasSeeded] = useState(false);

  useEffect(() => {
    if (initialTasks.length === 0 && !hasSeeded) {
      setHasSeeded(true);
      seedAuditTasks(clientId).then(() => {
        window.location.reload();
      });
    }
  }, [clientId, initialTasks.length, hasSeeded]);

  const handleMarkWorkedOn = async (taskId: string) => {
    setIsPending(true);
    try {
      await markAuditTaskWorkedOn(clientId, taskId);
    } catch (e) {
      console.warn(e);
    }
    window.location.reload();
  };

  const handleDelete = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      setIsPending(true);
      try {
        await deleteAuditTask(clientId, taskId);
      } catch (e) {
        console.warn(e);
      }
      window.location.reload();
    }
  };

  const formatDaysText = (lastWorkedOn: string | Date | null) => {
    if (!lastWorkedOn) return "Never";
    
    const date = new Date(lastWorkedOn);
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysPassed = Math.floor((Date.now() - date.getTime()) / msPerDay);

    if (daysPassed === 0) {
      return "Checked Today";
    }
    if (daysPassed === 1) {
      return "1 Day since last checked on";
    }
    return `${daysPassed} Days since last checked on`;
  };

  const formatDateLabel = (lastWorkedOn: string | Date | null) => {
    if (!lastWorkedOn) return "Awaiting Audit";
    return new Date(lastWorkedOn).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (initialTasks.length === 0) {
    return <div className={styles.loading}>Generating Audit tracker template...</div>;
  }

  return (
    <div className={styles.container} style={{ opacity: isPending ? 0.5 : 1, pointerEvents: isPending ? 'none' : 'auto' }}>
      <div className={styles.header}>
        <h2>Audit Tool Tasks</h2>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Task Details</th>
              <th>Last Checked</th>
              <th style={{ width: '150px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialTasks.map(task => {
              const daysText = formatDaysText(task.lastWorkedOn);
              const isToday = daysText === "Checked Today";
              
              return (
                <tr key={task.id} className={isToday ? styles.completedRow : ''}>
                  <td className={styles.taskName}>{task.taskName}</td>
                  
                  <td>
                    <div className={styles.timeBlock}>
                      <span className={styles.dateLabel}>{formatDateLabel(task.lastWorkedOn)}</span>
                      <span className={`${styles.subText} ${isToday ? styles.successText : ''}`}>
                        {daysText}
                      </span>
                    </div>
                  </td>

                  <td>
                    <div className={styles.actionsBox}>
                      <button 
                        onClick={() => handleMarkWorkedOn(task.id)} 
                        className={`btn ${isToday ? 'btn-secondary' : 'btn-success'} ${styles.workActionBtn}`}
                      >
                        <CheckCircle size={14} style={{ marginRight: "6px" }} />
                        Worked On
                      </button>
                      <button onClick={() => handleDelete(task.id)} className={styles.iconButtonError}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
