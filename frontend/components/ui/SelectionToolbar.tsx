"use client";

import React from "react";
import styles from "./selection-toolbar.module.css";

interface SelectionToolbarProps {
  selectedCount: number;
  onClear: () => void;
  onDelete: () => void;
  itemType?: string;
}

export default function SelectionToolbar({ selectedCount, onClear, onDelete, itemType = "record(s)" }: SelectionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className={styles.toolbarContainer}>
      <div className={styles.toolbar}>
        <div className={styles.selectionText}>
          {selectedCount} {itemType} selected
        </div>
        <div className={styles.actions}>
          <button className={styles.btnSecondary} onClick={onClear}>
            Clear selection
          </button>
          <button className={styles.btnPrimary} onClick={onDelete}>
            Delete selected
          </button>
        </div>
      </div>
    </div>
  );
}
