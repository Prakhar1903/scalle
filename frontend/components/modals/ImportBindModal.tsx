"use client";

import React, { useState, useRef } from "react";
import styles from "./modals.module.css";
import api from "@/lib/api";
import { useToastStore } from "@/lib/toastStore";
import { Upload, X } from "lucide-react";

interface ImportBindModalProps {
  zoneId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportBindModal({ zoneId, onClose, onSuccess }: ImportBindModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToastStore();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await api.post(`/hosted-zones/${zoneId}/records/import-bind`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      const resData = response.data;
      setResult(resData);
      
      if (resData.imported > 0) {
        addToast(
          `Imported ${resData.imported} records successfully.`,
          "success"
        );
      }
    } catch (err: any) {
      console.error("Import failed", err);
      addToast(
        err.response?.data?.detail || "An error occurred during import.",
        "error"
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} style={{ maxWidth: '500px' }}>
        <div className={styles.header}>
          <h2 className={styles.title}>Import zone file</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className={styles.body}>
          {!result ? (
            <>
              <p style={{ fontSize: '13px', color: 'var(--aws-text-secondary)', marginBottom: '16px' }}>
                Upload a BIND zone file to import records. Supported formats: .txt, .zone.
              </p>
              
              <div 
                className={styles.fileDropZone}
                style={{ 
                  border: `2px dashed ${isDragging ? 'var(--aws-link)' : 'var(--aws-border)'}`,
                  padding: '32px',
                  textAlign: 'center',
                  borderRadius: '2px',
                  backgroundColor: isDragging ? 'var(--aws-hover-bg)' : 'transparent',
                  cursor: 'pointer'
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept=".txt,.zone" 
                  onChange={handleFileChange}
                />
                <Upload size={32} color="var(--aws-text-secondary)" style={{ margin: '0 auto 12px' }} />
                {file ? (
                  <div>
                    <div style={{ fontWeight: 700 }}>{file.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--aws-text-secondary)' }}>
                      {(file.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                ) : (
                  <div>
                    <span style={{ color: 'var(--aws-link)' }}>Choose a file</span> or drag it here
                  </div>
                )}
              </div>
            </>
          ) : (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Import Results:</strong>
              </div>
              <ul style={{ listStyleType: 'none', padding: 0, fontSize: '13px' }}>
                <li style={{ color: 'var(--aws-success)', marginBottom: '8px' }}>
                  ✓ {result.imported} records imported
                </li>
                {result.skipped > 0 && (
                  <li style={{ color: '#ec7211', marginBottom: '8px' }}>
                    ⚠️ {result.skipped} records skipped (unsupported type or already exist)
                  </li>
                )}
                {result.errors.length > 0 && (
                  <li style={{ color: 'var(--aws-error)' }}>
                    ❌ {result.errors.length} errors
                    <ul style={{ marginTop: '8px', paddingLeft: '16px' }}>
                      {result.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {result.errors.length > 5 && (
                        <li>...and {result.errors.length - 5} more</li>
                      )}
                    </ul>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
        
        <div className={styles.footer}>
          {!result ? (
            <>
              <button className={styles.btnSecondary} onClick={onClose} disabled={isUploading}>
                Cancel
              </button>
              <button 
                className={styles.btnPrimary} 
                onClick={handleImport} 
                disabled={!file || isUploading}
              >
                {isUploading ? "Importing..." : "Import records"}
              </button>
            </>
          ) : (
            <button className={styles.btnPrimary} onClick={() => {
              if (result.imported > 0) onSuccess();
              else onClose();
            }}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
