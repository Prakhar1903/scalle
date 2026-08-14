import React from "react";
import ConsoleTopNav from "@/components/layout/ConsoleTopNav";
import ConsoleSidebar from "@/components/layout/ConsoleSidebar";
import ToastContainer from "@/components/ui/ToastContainer";
import KeyboardShortcutsProvider from "@/components/layout/KeyboardShortcutsProvider";
import styles from "@/components/layout/layout.module.css";

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.layoutContainer}>
      <ConsoleTopNav />
      <div className={styles.mainContent}>
        <ConsoleSidebar />
        <main className={styles.contentArea}>
          {children}
        </main>
      </div>
      <KeyboardShortcutsProvider />
      <ToastContainer />
    </div>
  );
}
