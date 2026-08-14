"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, RefreshCw } from "lucide-react";
import styles from "./hosted-zones.module.css";
import api from "@/lib/api";
import { HostedZone, HostedZoneListResponse } from "@/types";

import CreateZoneModal from "@/components/modals/CreateZoneModal";
import EditZoneModal from "@/components/modals/EditZoneModal";
import DeleteZoneModal from "@/components/modals/DeleteZoneModal";
import BulkDeleteZoneModal from "@/components/modals/BulkDeleteZoneModal";
import Pagination from "@/components/ui/Pagination";

export default function HostedZonesPage() {
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(25);

  // Selected for checkboxes
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals state
  const [showCreate, setShowCreate] = useState(false);
  const [zoneToEdit, setZoneToEdit] = useState<HostedZone | null>(null);
  const [zoneToDelete, setZoneToDelete] = useState<HostedZone | null>(null);
  const [zonesToDelete, setZonesToDelete] = useState<HostedZone[]>([]);

  const fetchZones = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<HostedZoneListResponse>("/hosted-zones", {
        params: { page, size, search }
      });
      setZones(res.data.items);
      setTotal(res.data.total);
      
      // Clear selection on fetch
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Failed to fetch zones", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, size, search]);

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  useEffect(() => {
    const handleRefresh = () => fetchZones();
    const handleSearch = () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    };

    window.addEventListener("scalle:refresh", handleRefresh);
    window.addEventListener("scalle:search", handleSearch);

    return () => {
      window.removeEventListener("scalle:refresh", handleRefresh);
      window.removeEventListener("scalle:search", handleSearch);
    };
  }, [fetchZones]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(zones.map(z => z.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleActionClick = (action: 'edit' | 'delete') => {
    if (action === 'edit' && selectedIds.size === 1) {
      const selectedZone = zones.find(z => z.id === Array.from(selectedIds)[0]);
      if (selectedZone) setZoneToEdit(selectedZone);
    } else if (action === 'delete' && selectedIds.size > 0) {
      const selected = zones.filter(z => selectedIds.has(z.id));
      if (selected.length === 1) {
        setZoneToDelete(selected[0]);
      } else {
        setZonesToDelete(selected);
      }
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Hosted zones</h1>
        <div className={styles.pageDescription}>
          A hosted zone is a container for records, and records contain information about how you want to route traffic for a specific domain.
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Hosted zones ({total})</h2>
          <div style={{ display: "flex", gap: "12px" }}>
            <button 
              className={styles.buttonSecondary}
              onClick={() => handleActionClick('delete')}
              disabled={selectedIds.size === 0}
            >
              Delete
            </button>
            <button 
              className={styles.buttonSecondary}
              onClick={() => handleActionClick('edit')}
              disabled={selectedIds.size !== 1}
            >
              Edit
            </button>
            <button 
              className={styles.buttonPrimary}
              onClick={() => setShowCreate(true)}
            >
              Create hosted zone
            </button>
          </div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={16} color="var(--aws-text-secondary)" />
            <input 
              ref={searchInputRef}
              type="text" 
              className={styles.searchInput}
              placeholder="Search hosted zones by name" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchZones()}
            />
          </div>
          <button 
            className={styles.buttonSecondary} 
            style={{ padding: '6px' }}
            onClick={fetchZones}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={zones.length > 0 && selectedIds.size === zones.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Domain name</th>
                <th>Type</th>
                <th>Record count</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>Loading...</td>
                </tr>
              ) : zones.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>
                    No hosted zones found. Create one to get started.
                  </td>
                </tr>
              ) : (
                zones.map((zone) => (
                  <tr key={zone.id}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(zone.id)}
                        onChange={() => handleSelect(zone.id)}
                      />
                    </td>
                    <td>
                      <Link href={`/hosted-zones/${zone.id}`} style={{ fontWeight: 600 }}>
                        {zone.name}
                      </Link>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${zone.type === 'Public' ? styles.badgePublic : styles.badgePrivate}`}>
                        {zone.type}
                      </span>
                    </td>
                    <td>{zone.record_count}</td>
                    <td style={{ color: "var(--aws-text-secondary)" }}>{zone.comment || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          page={page} 
          size={size} 
          total={total} 
          onPageChange={setPage} 
          onSizeChange={setSize} 
        />
      </div>

      {showCreate && (
        <CreateZoneModal 
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            fetchZones();
          }}
        />
      )}

      {zoneToEdit && (
        <EditZoneModal 
          zone={zoneToEdit}
          onClose={() => setZoneToEdit(null)}
          onSuccess={() => {
            setZoneToEdit(null);
            fetchZones();
          }}
        />
      )}

      {zoneToDelete && (
        <DeleteZoneModal 
          zone={zoneToDelete}
          onClose={() => setZoneToDelete(null)}
          onSuccess={() => {
            setZoneToDelete(null);
            fetchZones();
          }}
        />
      )}

      {zonesToDelete.length > 0 && (
        <BulkDeleteZoneModal 
          zones={zonesToDelete}
          onClose={() => setZonesToDelete([])}
          onSuccess={() => {
            setZonesToDelete([]);
            fetchZones();
          }}
        />
      )}
    </div>
  );
}
