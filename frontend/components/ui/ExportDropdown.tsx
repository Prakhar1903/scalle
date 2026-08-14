"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Download } from "lucide-react";
import styles from "./export.module.css";
import api from "@/lib/api";
import { useToastStore } from "@/lib/toastStore";

interface ExportDropdownProps {
  zoneId: string;
  zoneName: string;
  className?: string;
  buttonClassName?: string;
}

export default function ExportDropdown({ zoneId, zoneName, className = "", buttonClassName = "" }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToastStore();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = async (format: "json" | "bind") => {
    setIsOpen(false);
    try {
      const response = await api.get(`/hosted-zones/${zoneId}/records/export/${format}`, {
        responseType: "blob",
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${zoneName}${format === "json" ? "json" : "zone"}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      addToast(
        `Successfully exported records as ${format.toUpperCase()}.`,
        "success"
      );
    } catch (err) {
      console.error("Export failed", err);
      addToast(
        "An error occurred while exporting records.",
        "error"
      );
    }
  };

  return (
    <div className={`${styles.dropdownContainer} ${className}`} ref={containerRef}>
      <button 
        className={buttonClassName} 
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: "flex", alignItems: "center", gap: "4px" }}
      >
        <Download size={14} />
        Export
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          <button className={styles.dropdownItem} onClick={() => handleExport("json")}>
            Export as JSON
          </button>
          <button className={styles.dropdownItem} onClick={() => handleExport("bind")}>
            Export as BIND
          </button>
        </div>
      )}
    </div>
  );
}
