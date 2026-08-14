"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Search, RefreshCw, ChevronRight } from "lucide-react";
import styles from "../hosted-zones.module.css";
import recordStyles from "./records.module.css";
import api from "@/lib/api";
import { HostedZone, DNSRecord, DNSRecordListResponse, RecordType } from "@/types";

import RecordFormPanel from "@/components/modals/RecordFormPanel";
import DeleteRecordModal from "@/components/modals/DeleteRecordModal";
import ImportBindModal from "@/components/modals/ImportBindModal";
import Pagination from "@/components/ui/Pagination";
import ExportDropdown from "@/components/ui/ExportDropdown";
import SelectionToolbar from "@/components/ui/SelectionToolbar";

const RECORD_TYPES: RecordType[] = ["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"];

export default function ZoneRecordsPage() {
  const params = useParams();
  const router = useRouter();
  const zoneId = params.id as string;

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [total, setTotal] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<RecordType | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(25);

  // Selected for checkboxes
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals state
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<DNSRecord | null>(null);
  const [recordsToDelete, setRecordsToDelete] = useState<DNSRecord[]>([]);

  const fetchZoneAndRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!zone) {
        const zoneRes = await api.get<HostedZone>(`/hosted-zones/${zoneId}`);
        setZone(zoneRes.data);
      }

      const params: any = { page, size, search };
      if (typeFilter !== "ALL") params.type = typeFilter;

      const recordsRes = await api.get<DNSRecordListResponse>(`/hosted-zones/${zoneId}/records`, { params });
      setRecords(recordsRes.data.items);
      setTotal(recordsRes.data.total);
      
      // Clear selection on fetch
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error("Failed to fetch zone or records", err);
      if (err.response?.status === 404) {
        router.push("/hosted-zones");
      }
    } finally {
      setIsLoading(false);
    }
  }, [zoneId, zone, page, size, search, typeFilter, router]);

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchZoneAndRecords();
  }, [fetchZoneAndRecords]);

  useEffect(() => {
    const handleNew = () => setShowCreate(true);
    const handleRefresh = () => fetchZoneAndRecords();
    const handleSearch = () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    };

    window.addEventListener("scalle:new", handleNew);
    window.addEventListener("scalle:refresh", handleRefresh);
    window.addEventListener("scalle:search", handleSearch);

    return () => {
      window.removeEventListener("scalle:new", handleNew);
      window.removeEventListener("scalle:refresh", handleRefresh);
      window.removeEventListener("scalle:search", handleSearch);
    };
  }, [fetchZoneAndRecords]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(records.map(r => r.id)));
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
      const selected = records.find(r => r.id === Array.from(selectedIds)[0]);
      if (selected) setRecordToEdit(selected);
    } else if (action === 'delete' && selectedIds.size > 0) {
      const selected = records.filter(r => selectedIds.has(r.id));
      setRecordsToDelete(selected);
    }
  };

  if (!zone) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <div>
      <div style={{ marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link href="/hosted-zones" style={{ color: 'var(--aws-text-secondary)' }}>Hosted zones</Link>
        <ChevronRight size={14} color="var(--aws-text-secondary)" />
        <span style={{ fontWeight: 700 }}>{zone.name}</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{zone.name}</h1>
      </div>

      <div className={recordStyles.zoneInfoCard}>
        <div className={recordStyles.zoneInfoGrid}>
          <div className={recordStyles.zoneInfoItem}>
            <span className={recordStyles.zoneInfoLabel}>Hosted zone name</span>
            <span className={recordStyles.zoneInfoValue} style={{ fontWeight: 700 }}>{zone.name}</span>
          </div>
          <div className={recordStyles.zoneInfoItem}>
            <span className={recordStyles.zoneInfoLabel}>Type</span>
            <span className={recordStyles.zoneInfoValue}>
              <span className={`${styles.badge} ${zone.type === 'Public' ? styles.badgePublic : styles.badgePrivate}`}>
                {zone.type}
              </span>
            </span>
          </div>
          <div className={recordStyles.zoneInfoItem}>
            <span className={recordStyles.zoneInfoLabel}>Hosted zone ID</span>
            <span className={recordStyles.zoneInfoValue}>{zone.id}</span>
          </div>
          <div className={recordStyles.zoneInfoItem}>
            <span className={recordStyles.zoneInfoLabel}>Created by</span>
            <span className={recordStyles.zoneInfoValue}>Route 53 Clone</span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Records ({total})</h2>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button 
              className={styles.buttonSecondary}
              onClick={() => handleActionClick('delete')}
              disabled={selectedIds.size === 0}
            >
              Delete record
            </button>
            <button 
              className={styles.buttonSecondary}
              onClick={() => handleActionClick('edit')}
              disabled={selectedIds.size !== 1}
            >
              Edit record
            </button>
            <button 
              className={styles.buttonSecondary}
              onClick={() => setShowImport(true)}
            >
              Import records
            </button>
            <button 
              className={styles.buttonPrimary}
              onClick={() => setShowCreate(true)}
            >
              Create record
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
              placeholder="Search by record name" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchZoneAndRecords()}
            />
          </div>
          
          <select 
            className={recordStyles.typeFilter}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
          >
            <option value="ALL">All Types</option>
            {RECORD_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <ExportDropdown 
            zoneId={zone.id} 
            zoneName={zone.name} 
            buttonClassName={styles.buttonSecondary}
            className={recordStyles.exportDropdown}
          />
          <button 
            className={styles.buttonSecondary} 
            style={{ padding: '6px' }}
            onClick={fetchZoneAndRecords}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div style={{ position: "relative" }}>
          <SelectionToolbar 
            selectedCount={selectedIds.size} 
            onClear={() => setSelectedIds(new Set())}
            onDelete={() => handleActionClick('delete')}
          />
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={records.length > 0 && selectedIds.size === records.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Record name</th>
                <th>Type</th>
                <th>Routing policy</th>
                <th>Differentiator</th>
                <th>Alias</th>
                <th>Value/Route traffic to</th>
                <th>TTL</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className={styles.emptyState}>Loading...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyState}>
                    No records found.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(record.id)}
                        onChange={() => handleSelect(record.id)}
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>{record.name}</td>
                    <td className={recordStyles.recordTypeBadge}>{record.type}</td>
                    <td>{record.routing_policy}</td>
                    <td>{record.weight ? `Weight: ${record.weight}` : '-'}</td>
                    <td>{record.alias ? 'Yes' : 'No'}</td>
                    <td>
                      <div className={recordStyles.valueList}>
                        {record.alias && record.alias_target ? (
                          <div className={recordStyles.valueItem}>{record.alias_target.dns_name}</div>
                        ) : record.records && record.records.length > 0 ? (
                          record.records.map((v, i) => (
                            <div key={i} className={recordStyles.valueItem}>{v}</div>
                          ))
                        ) : (
                          '-'
                        )}
                      </div>
                    </td>
                    <td>{record.ttl ?? '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
        <RecordFormPanel 
          zoneId={zone.id}
          zoneName={zone.name}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            fetchZoneAndRecords();
          }}
        />
      )}

      {showImport && (
        <ImportBindModal 
          zoneId={zone.id}
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            setShowImport(false);
            fetchZoneAndRecords();
          }}
        />
      )}

      {recordToEdit && (
        <RecordFormPanel 
          zoneId={zone.id}
          zoneName={zone.name}
          existingRecord={recordToEdit}
          onClose={() => setRecordToEdit(null)}
          onSuccess={() => {
            setRecordToEdit(null);
            fetchZoneAndRecords();
          }}
        />
      )}

      {recordsToDelete.length > 0 && (
        <DeleteRecordModal 
          zoneId={zone.id}
          records={recordsToDelete}
          onClose={() => setRecordsToDelete([])}
          onSuccess={() => {
            setRecordsToDelete([]);
            fetchZoneAndRecords();
          }}
        />
      )}
    </div>
  );
}
