"use client";

import React from "react";
import { Info } from "lucide-react";
import styles from "@/app/(console)/hosted-zones/hosted-zones.module.css";

interface ComingSoonProps {
  title: string;
}

export default function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{title}</h1>
        <div className={styles.pageDescription}>
          This feature is part of the AWS Route 53 suite but is currently under development in this clone.
        </div>
      </div>

      <div className={styles.card} style={{ padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <Info size={48} color="var(--aws-text-secondary)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Coming Soon</h2>
        <p style={{ color: 'var(--aws-text-secondary)', textAlign: 'center', maxWidth: '400px' }}>
          We are actively working on building the {title} feature to provide a complete Route 53 experience. Check back later!
        </p>
      </div>
    </div>
  );
}
