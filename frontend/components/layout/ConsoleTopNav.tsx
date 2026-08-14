"use client";

import React, { useEffect, useState, useRef } from "react";
import styles from "./layout.module.css";
import { User as UserIcon, Bell, LayoutGrid, Search, LogOut, Sun, Moon } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";

export default function ConsoleTopNav() {
  const { user, checkAuth, logout } = useAuthStore();
  const { theme, toggleTheme, initTheme } = useThemeStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
    initTheme();
  }, [checkAuth, initTheme]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <header className={styles.topNav}>
      <div className={styles.logo}>
        <LayoutGrid size={18} />
        <span>AWS</span>
      </div>
      
      <div style={{ flex: 1, padding: "0 32px" }}>
        <div style={{
          backgroundColor: "rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          padding: "4px 8px",
          borderRadius: "2px",
          maxWidth: "400px",
          gap: "8px"
        }}>
          <Search size={14} color="#ccc" />
          <span style={{ color: "#ccc", fontSize: "13px" }}>Search...</span>
        </div>
      </div>

      <div className={styles.navRight}>
        <div className={styles.navItem} onClick={toggleTheme} title="Toggle Theme" style={{ cursor: "pointer" }}>
          {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
        </div>
        <div className={styles.navItem}>
          <Bell size={16} />
        </div>
        <div 
          className={`${styles.navItem} ${styles.userDropdownContainer}`} 
          ref={dropdownRef}
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <UserIcon size={16} />
          <span>{user?.email || "Loading..."}</span>

          {dropdownOpen && user && (
            <div className={styles.userDropdown} onClick={(e) => e.stopPropagation()}>
              <div className={styles.dropdownHeader}>
                <span className={styles.dropdownEmail}>{user.email}</span>
                <span className={styles.dropdownAccount}>Account ID: {user.account_id || "123456789012"}</span>
              </div>
              <div className={styles.dropdownDivider}></div>
              <button 
                className={`${styles.dropdownItem} ${styles.signOutBtn}`}
                onClick={logout}
              >
                <LogOut size={16} style={{ marginRight: '8px' }} />
                Sign Out
              </button>
            </div>
          )}
        </div>
        <div className={styles.navItem}>
          <span>Global</span>
        </div>
      </div>
    </header>
  );
}
