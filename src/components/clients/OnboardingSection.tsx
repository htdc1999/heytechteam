"use client";

import { useState, useEffect } from "react";
import { toggleOnboardingTask, deleteOnboardingTask, seedDefaultTasks, deleteMultipleOnboardingTasks } from "@/app/actions";
import { Trash2 } from "lucide-react";
import styles from "./OnboardingSection.module.css";

type OnboardingTask = {
  id: string;
  taskName: string;
  isCompleted: boolean;
};

export default function OnboardingSection({ clientId, initialTasks }: { clientId: string, initialTasks: OnboardingTask[] }) {
  const [isPending, setIsPending] = useState(false);
  const [hasSeeded, setHasSeeded] = useState(false);

  useEffect(() => {
    if (initialTasks.length === 0 && !hasSeeded) {
      setHasSeeded(true);
      seedDefaultTasks(clientId).then(() => {
        window.location.reload();
      });
    }
  }, [clientId, initialTasks.length, hasSeeded]);

  const handleToggle = async (taskId: string, currentStatus: boolean) => {
    setIsPending(true);
    try {
      await toggleOnboardingTask(clientId, taskId, !currentStatus);
    } catch (e) {
      console.warn(e);
    }
    window.location.reload();
  };

  const handleDelete = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      setIsPending(true);
      try {
        await deleteOnboardingTask(clientId, taskId);
      } catch (e) {
        console.warn(e);
      }
      window.location.reload();
    }
  };

  const handleNoGBP = async () => {
    if (confirm("Are you sure you want to remove all GBP-related tasks? This action cannot be undone.")) {
      setIsPending(true);
      try {
        const gbpTasks = [
          "Complete GBP Profile Optimizations",
          "Write GBP Profile Posts",
          "Add Client To BrightLocal",
          "Submit Brightlocal Citation Builder Campaign",
          "Begin Scheduling GBP Posts On Brightlocal"
        ];
        await deleteMultipleOnboardingTasks(clientId, gbpTasks);
      } catch (e) {
        console.warn(e);
      }
      window.location.reload();
    }
  };

  if (initialTasks.length === 0) {
    return <div className={styles.loading}>Initializing your default checklist...</div>;
  }

  return (
    <div className={styles.container} style={{ opacity: isPending ? 0.5 : 1, pointerEvents: isPending ? 'none' : 'auto' }}>
      <div className={styles.header}>
        <h2>Onboarding Checklist</h2>
        <button onClick={handleNoGBP} className="btn btn-warning" style={{ fontSize: "0.800rem", padding: "0.4rem 0.8rem", fontWeight: 600 }}>
          No GBP
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Status</th>
              <th>Task Details</th>
              <th style={{ width: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            {initialTasks.map(task => (
              <tr key={task.id} className={task.isCompleted ? styles.completedRow : ''}>
                <td>
                  <label className={styles.toggleSwitch}>
                     <input 
                       type="checkbox" 
                       checked={task.isCompleted} 
                       onChange={() => handleToggle(task.id, task.isCompleted)} 
                     />
                     <span className={styles.slider}></span>
                  </label>
                </td>
                <td className={styles.taskName}>{task.taskName}</td>
                <td className={styles.actions}>
                  <button onClick={() => handleDelete(task.id)} className={styles.iconButtonError}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
