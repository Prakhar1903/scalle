"use client";

import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import styles from "./modals.module.css";
import btnStyles from "@/app/(console)/hosted-zones/hosted-zones.module.css";
import api from "@/lib/api";
import { DNSRecord } from "@/types";
import { useToastStore } from "@/lib/toastStore";

interface DeleteRecordModalProps {
  zoneId: string;
  records: DNSRecord[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteRecordModal({ zoneId, records, onClose, onSuccess }: DeleteRecordModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { addToast } = useToastStore();

  const isBulk = records.length > 1;
  const isDefaultZoneRecord = records.some(r => r.type === "SOA" || r.type === "NS");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText !== "delete") {
      return;
    }
    
    setIsLoading(true);
    setError("");

    try {
      if (isBulk) {
        await api.post(`/hosted-zones/${zoneId}/records/bulk-delete`, {
          record_ids: records.map(r => r.id)
        });
        addToast(`${records.length} records deleted`, "success");
      } else {
        await api.delete(`/hosted-zones/${zoneId}/records/${records[0].id}`);
        addToast("Record deleted successfully", "success");
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || `Failed to delete record${isBulk ? 's' : ''}`);
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modalCenter}>
        <div className={styles.header}>
          <h2 className={styles.title}>Delete record{isBulk ? 's' : ''}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          {error && (
            <div style={{ color: 'var(--aws-error)', marginBottom: '16px' }}>{error}</div>
          )}
          
          <div className={styles.warningBox}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} />
              Warning
            </h4>
            <p style={{ marginTop: '8px', fontSize: '14px' }}>
              You are about to delete <strong>{records.length}</strong> record{isBulk ? 's' : ''}.
              This action cannot be undone and may disrupt traffic to your domain.
            </p>
            {isDefaultZoneRecord && (
              <p style={{ marginTop: '8px', fontSize: '14px', fontWeight: 700 }}>
                Note: Default SOA and NS records cannot be deleted. If you selected them, they will be skipped or the request will fail.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} id="delete-record-form">
            <div className={styles.formGroup}>
              <label className={styles.label}>
                To confirm deletion, type <em>delete</em> in the text input field.
              </label>
              <input 
                type="text" 
                className={styles.input} 
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="delete"
                required 
              />
            </div>
          </form>
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
            form="delete-record-form"
            className={btnStyles.buttonPrimary}
            style={{ backgroundColor: 'var(--aws-error)', borderColor: 'var(--aws-error)', color: '#fff' }}
            disabled={isLoading || confirmText !== "delete"}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
