"use client";

import React, { useState } from "react";
import styles from "./modals.module.css";
import btnStyles from "@/app/(console)/hosted-zones/hosted-zones.module.css";
import api from "@/lib/api";
import { HostedZone } from "@/types";
import { useToastStore } from "@/lib/toastStore";
import { X, AlertTriangle } from "lucide-react";

interface BulkDeleteZoneModalProps {
  zones: HostedZone[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkDeleteZoneModal({ zones, onClose, onSuccess }: BulkDeleteZoneModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { addToast } = useToastStore();

  const isConfirmed = confirmText === "DELETE";

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setIsDeleting(true);

    let deleted = 0;
    let failed = 0;

    try {
      const promises = zones.map((z) => api.delete(`/hosted-zones/${z.id}`));
      const results = await Promise.allSettled(promises);

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          deleted++;
        } else {
          failed++;
        }
      });

      if (failed === 0) {
        addToast(
          `Successfully deleted ${deleted} hosted zone(s).`,
          "success"
        );
      } else {
        addToast(
          `Deleted ${deleted} zone(s), but ${failed} failed.`,
          "error"
        );
      }
      
      onSuccess();
    } catch (err) {
      console.error("Bulk delete failed", err);
      addToast(
        "An unexpected error occurred during deletion.",
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modalCenter}>
        <div className={styles.header}>
          <h2 className={styles.title}>Delete {zones.length} hosted zones?</h2>
          <button className={styles.closeButton} onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className={styles.body}>
          <div className={styles.warningBox} style={{ display: 'flex', gap: '12px', padding: '12px', marginBottom: '16px' }}>
            <AlertTriangle color="var(--aws-error)" size={24} style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '13px' }}>
              <strong>Warning:</strong> This will permanently delete the following zones and ALL their associated DNS records. This action cannot be undone.
            </div>
          </div>
          
          <ul style={{ paddingLeft: '24px', fontSize: '13px', marginBottom: '24px', maxHeight: '150px', overflowY: 'auto' }}>
            {zones.map(z => (
              <li key={z.id} style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: 700 }}>{z.name}</span> <span style={{ color: 'var(--aws-text-secondary)' }}>({z.record_count} records)</span>
              </li>
            ))}
          </ul>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>
              To confirm deletion, type <strong>DELETE</strong> in the field below.
            </label>
            <input 
              type="text" 
              className={styles.input} 
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
            />
          </div>
        </div>
        
        <div className={styles.footer}>
          <button className={btnStyles.buttonSecondary} onClick={onClose} disabled={isDeleting}>
            Cancel
          </button>
          <button 
            className={btnStyles.buttonPrimary} 
            style={{ backgroundColor: 'var(--aws-error)', borderColor: 'var(--aws-error)', color: '#fff' }}
            onClick={handleDelete} 
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete zones"}
          </button>
        </div>
      </div>
    </div>
  );
}
