"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./layout.module.css";

const NAV_ITEMS = [
  {
    group: "Dashboard",
    links: [
      { name: "Dashboard", href: "/dashboard" },
    ]
  },
  {
    group: "Hosted zones",
    links: [
      { name: "Hosted zones", href: "/hosted-zones" },
    ]
  },
  {
    group: "Health checks",
    links: [
      { name: "Health checks", href: "/health-checks" },
    ]
  },
  {
    group: "Traffic management",
    links: [
      { name: "Traffic policies", href: "/traffic-policies" },
    ]
  },
  {
    group: "Resolver",
    links: [
      { name: "Resolver", href: "/resolver" },
    ]
  },
  {
    group: "Profiles",
    links: [
      { name: "Profiles", href: "/profiles" },
    ]
  },
];

export default function ConsoleSidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarTitle}>Route 53</div>
      
      {NAV_ITEMS.map((group) => (
        <div key={group.group} className={styles.sidebarGroup}>
          <div className={styles.sidebarGroupTitle}>{group.group}</div>
          {group.links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ""}`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
