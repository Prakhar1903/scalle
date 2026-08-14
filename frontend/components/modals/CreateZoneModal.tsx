"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import styles from "./modals.module.css";
import btnStyles from "@/app/(console)/hosted-zones/hosted-zones.module.css";
import api from "@/lib/api";
import { useToastStore } from "@/lib/toastStore";

interface CreateZoneModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateZoneModal({ onClose, onSuccess }: CreateZoneModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"Public" | "Private">("Public");
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { addToast } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await api.post("/hosted-zones", { name, type, comment });
      addToast("Hosted zone created successfully", "success");
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create hosted zone");
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.slideInPanel}>
        <div className={styles.header}>
          <h2 className={styles.title}>Create hosted zone</h2>
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
              <div className={styles.description}>Enter the name of the domain. For example, example.com.</div>
              <input 
                type="text" 
                className={styles.input} 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="example.com"
                required 
              />
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

            <div className={styles.formGroup}>
              <label className={styles.label}>Type</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="radio" 
                    name="zoneType" 
                    value="Public" 
                    checked={type === "Public"} 
                    onChange={() => setType("Public")} 
                  />
                  <div>
                    <strong>Public hosted zone</strong>
                    <div className={styles.description}>Routes traffic on the internet</div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="radio" 
                    name="zoneType" 
                    value="Private" 
                    checked={type === "Private"} 
                    onChange={() => setType("Private")} 
                  />
                  <div>
                    <strong>Private hosted zone</strong>
                    <div className={styles.description}>Routes traffic within an Amazon VPC</div>
                  </div>
                </label>
              </div>
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
              disabled={isLoading || !name}
            >
              {isLoading ? "Creating..." : "Create hosted zone"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
