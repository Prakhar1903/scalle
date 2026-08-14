"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useToastStore } from "@/lib/toastStore";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import styles from "./toast.module.css";

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className={styles.toastContainer}>
      {toasts.map((toast) => {
        let Icon = Info;
        let iconColor = "var(--aws-link)";
        
        if (toast.type === "success") {
          Icon = CheckCircle;
          iconColor = "#1d8102";
        } else if (toast.type === "error") {
          Icon = AlertCircle;
          iconColor = "var(--aws-error)";
        }

        return (
          <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
            <div className={styles.icon}>
              <Icon size={20} color={iconColor} />
            </div>
            <div className={styles.message}>{toast.message}</div>
            <button
              className={styles.closeButton}
              onClick={() => removeToast(toast.id)}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
