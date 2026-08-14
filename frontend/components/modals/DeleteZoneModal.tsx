"use client";

import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import styles from "./modals.module.css";
import btnStyles from "@/app/(console)/hosted-zones/hosted-zones.module.css";
import api from "@/lib/api";
import { HostedZone } from "@/types";
import { useToastStore } from "@/lib/toastStore";

interface DeleteZoneModalProps {
  zone: HostedZone;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteZoneModal({ zone, onClose, onSuccess }: DeleteZoneModalProps) {
  const [confirmName, setConfirmName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { addToast } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmName !== "delete") {
      return;
    }
    
    setIsLoading(true);
    setError("");

    try {
      await api.delete(`/hosted-zones/${zone.id}`);
      addToast("Hosted zone deleted", "success");
      onSuccess();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete hosted zone");
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modalCenter}>
        <div className={styles.header}>
          <h2 className={styles.title}>Delete hosted zone</h2>
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
              You are about to delete the hosted zone <strong>{zone.name}</strong> ({zone.id}). 
              All DNS records associated with this hosted zone will be permanently deleted.
            </p>
          </div>

          <form onSubmit={handleSubmit} id="delete-form">
            <div className={styles.formGroup}>
              <label className={styles.label}>
                To confirm deletion, type <em>delete</em> in the text input field.
              </label>
              <input 
                type="text" 
                className={styles.input} 
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
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
            form="delete-form"
            className={btnStyles.buttonPrimary}
            style={{ backgroundColor: 'var(--aws-error)', borderColor: 'var(--aws-error)', color: '#fff' }}
            disabled={isLoading || confirmName !== "delete"}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
