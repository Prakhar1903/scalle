"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import styles from "./modals.module.css";
import btnStyles from "@/app/(console)/hosted-zones/hosted-zones.module.css";
import api from "@/lib/api";
import { HostedZone } from "@/types";
import { useToastStore } from "@/lib/toastStore";

interface EditZoneModalProps {
  zone: HostedZone;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditZoneModal({ zone, onClose, onSuccess }: EditZoneModalProps) {
  const [comment, setComment] = useState(zone.comment || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { addToast } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await api.put(`/hosted-zones/${zone.id}`, { comment });
      addToast("Hosted zone updated successfully", "success");
      onSuccess();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update hosted zone");
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.slideInPanel}>
        <div className={styles.header}>
          <h2 className={styles.title}>Edit hosted zone details</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className={styles.body}>
            {error && (
              <div style={{ color: 'var(--aws-error)', marginBottom: '16px' }}>{error}</div>
            )}
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Domain name</label>
              <input type="text" className={styles.input} value={zone.name} disabled />
              <div className={styles.description}>You cannot change the domain name of an existing hosted zone.</div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Type</label>
              <input type="text" className={styles.input} value={zone.type} disabled />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Description - optional</label>
              <textarea 
                className={styles.textarea}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Remarks about this hosted zone"
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button 
              type="button" 
              className={btnStyles.buttonSecondary} 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={btnStyles.buttonPrimary}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
