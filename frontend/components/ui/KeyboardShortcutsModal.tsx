"use client";

import React from "react";
import { X } from "lucide-react";
import styles from "../modals/modals.module.css";

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
  const shortcuts = [
    { key: "N", desc: "Create New Record (zone detail page)" },
    { key: "R", desc: "Refresh table" },
    { key: "Esc", desc: "Close any open modal or panel" },
    { key: "?", desc: "Open this keyboard shortcuts help modal" },
    { key: "/", desc: "Focus the search input" },
    { key: "D", desc: "Toggle dark mode" },
  ];

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} style={{ maxWidth: '400px' }}>
        <div className={styles.header}>
          <h2 className={styles.title}>Keyboard shortcuts</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className={styles.body}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <tbody>
              {shortcuts.map((s, i) => (
                <tr key={i} style={{ borderBottom: i < shortcuts.length - 1 ? '1px solid var(--aws-border)' : 'none' }}>
                  <td style={{ padding: '8px 0', width: '60px' }}>
                    <kbd style={{ 
                      backgroundColor: 'var(--aws-hover-bg)', 
                      border: '1px solid var(--aws-border-dark)', 
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontFamily: 'monospace',
                      fontWeight: 700
                    }}>
                      {s.key}
                    </kbd>
                  </td>
                  <td style={{ padding: '8px 0' }}>{s.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className={styles.footer}>
          <button className={styles.btnPrimary} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
