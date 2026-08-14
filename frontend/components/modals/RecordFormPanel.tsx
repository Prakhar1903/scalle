"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import styles from "./modals.module.css";
import btnStyles from "@/app/(console)/hosted-zones/hosted-zones.module.css";
import api from "@/lib/api";
import { DNSRecord, RecordType, RoutingPolicy } from "@/types";
import { useToastStore } from "@/lib/toastStore";

interface RecordFormPanelProps {
  zoneId: string;
  zoneName: string;
  existingRecord?: DNSRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

const RECORD_TYPES: RecordType[] = ["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"];
const ROUTING_POLICIES: RoutingPolicy[] = ["Simple", "Weighted", "Latency", "Failover", "Geolocation"];

export default function RecordFormPanel({ zoneId, zoneName, existingRecord, onClose, onSuccess }: RecordFormPanelProps) {
  const isEditing = !!existingRecord;
  
  // Strip zoneName from the end of the record name if it exists, to show the subdomain prefix
  const getInitialPrefix = () => {
    if (!existingRecord) return "";
    const name = existingRecord.name;
    if (name === zoneName) return "";
    if (name.endsWith(`.${zoneName}`)) {
      return name.substring(0, name.length - zoneName.length - 1);
    }
    return name;
  };

  const [prefix, setPrefix] = useState(getInitialPrefix());
  const [type, setType] = useState<RecordType>(existingRecord?.type || "A");
  const [ttl, setTtl] = useState<number>(existingRecord?.ttl ?? 300);
  const [routingPolicy, setRoutingPolicy] = useState<RoutingPolicy>(existingRecord?.routing_policy || "Simple");
  const [alias, setAlias] = useState<boolean>(existingRecord?.alias || false);
  
  // Value list
  const [records, setRecords] = useState<string[]>(existingRecord?.records || [""]);
  
  // Alias target
  const [aliasTarget, setAliasTarget] = useState({
    hosted_zone_id: existingRecord?.alias_target?.hosted_zone_id || "",
    dns_name: existingRecord?.alias_target?.dns_name || "",
    evaluate_health: existingRecord?.alias_target?.evaluate_health || false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { addToast } = useToastStore();

  const handleRecordChange = (index: number, value: string) => {
    const newRecords = [...records];
    newRecords[index] = value;
    setRecords(newRecords);
  };

  const addRecord = () => {
    setRecords([...records, ""]);
  };

  const removeRecord = (index: number) => {
    const newRecords = records.filter((_, i) => i !== index);
    if (newRecords.length === 0) newRecords.push("");
    setRecords(newRecords);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Construct full name
    const fullName = prefix ? `${prefix}.${zoneName}` : zoneName;

    // Filter out empty records if not alias
    const filteredRecords = alias ? [] : records.filter(r => r.trim() !== "");
    
    if (!alias && filteredRecords.length === 0) {
      setError("Please provide at least one value for the record.");
      setIsLoading(false);
      return;
    }

    const payload = {
      name: fullName,
      type,
      ttl: alias ? null : ttl,
      routing_policy: routingPolicy,
      alias,
      alias_target: alias ? aliasTarget : null,
      records: alias ? null : filteredRecords,
    };

    try {
      if (isEditing) {
        await api.put(`/hosted-zones/${zoneId}/records/${existingRecord.id}`, payload);
        addToast("Record updated successfully", "success");
      } else {
        await api.post(`/hosted-zones/${zoneId}/records`, payload);
        addToast("Record created successfully", "success");
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || `Failed to ${isEditing ? 'update' : 'create'} record`);
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.slideInPanel} style={{ width: '600px' }}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isEditing ? 'Edit record' : 'Create record'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className={styles.body}>
            {error && (
              <div style={{ color: 'var(--aws-error)', marginBottom: '16px' }}>{error}</div>
            )}

            {isEditing && (existingRecord.type === "SOA" || existingRecord.type === "NS") && existingRecord.name === zoneName && (
               <div className={styles.warningBox}>
                 <h4>Default Zone Record</h4>
                 <p style={{ fontSize: '13px', marginTop: '4px' }}>
                   You are editing a default {existingRecord.type} record for the zone. Extreme caution is advised.
                 </p>
               </div>
            )}
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Record name</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="subdomain"
                  disabled={isEditing} // Usually you don't edit name, just values
                  style={{ flex: 1 }}
                />
                <span style={{ color: 'var(--aws-text-secondary)', fontWeight: 600 }}>.{zoneName}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.label}>Record type</label>
                <select 
                  className={styles.select}
                  value={type}
                  onChange={(e) => setType(e.target.value as RecordType)}
                  disabled={isEditing} // Cannot edit type of existing record
                >
                  {RECORD_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup} style={{ width: '150px' }}>
                <label className={styles.label}>TTL (Seconds)</label>
                <input 
                  type="number" 
                  className={styles.input} 
                  value={ttl}
                  onChange={(e) => setTtl(Number(e.target.value))}
                  disabled={alias}
                  min="0"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Routing policy</label>
              <select 
                className={styles.select}
                value={routingPolicy}
                onChange={(e) => setRoutingPolicy(e.target.value as RoutingPolicy)}
              >
                {ROUTING_POLICIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  checked={alias}
                  onChange={(e) => setAlias(e.target.checked)}
                />
                <span style={{ fontWeight: 700, fontSize: '14px' }}>Alias</span>
              </label>
              <div className={styles.description} style={{ marginLeft: '24px' }}>
                Route traffic to an AWS resource.
              </div>
            </div>

            {!alias ? (
              <div className={styles.formGroup}>
                <label className={styles.label}>Value</label>
                <div className={styles.description}>Enter multiple values on separate lines, or click Add.</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {records.map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <textarea 
                        className={styles.textarea} 
                        value={r}
                        onChange={(e) => handleRecordChange(i, e.target.value)}
                        placeholder={`Value for ${type} record`}
                        style={{ minHeight: '40px' }}
                      />
                      <button 
                        type="button" 
                        onClick={() => removeRecord(i)}
                        style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: 'var(--aws-text-secondary)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button"
                    className={btnStyles.buttonSecondary}
                    style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={addRecord}
                  >
                    <Plus size={14} /> Add value
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '16px', backgroundColor: '#fafafa', border: '1px solid var(--aws-border)', borderRadius: '2px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Route traffic to</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    placeholder="DNS name (e.g., alb.us-east-1.elb.amazonaws.com)"
                    value={aliasTarget.dns_name}
                    onChange={(e) => setAliasTarget({...aliasTarget, dns_name: e.target.value})}
                    required={alias}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Hosted zone ID</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    placeholder="Z2FDTNDATAQYW2"
                    value={aliasTarget.hosted_zone_id}
                    onChange={(e) => setAliasTarget({...aliasTarget, hosted_zone_id: e.target.value})}
                    required={alias}
                  />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    checked={aliasTarget.evaluate_health}
                    onChange={(e) => setAliasTarget({...aliasTarget, evaluate_health: e.target.checked})}
                  />
                  <span style={{ fontSize: '14px' }}>Evaluate target health</span>
                </label>
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <button 
              type="button" 
              className={btnStyles.buttonSecondary} 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={btnStyles.buttonPrimary}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : isEditing ? "Save changes" : "Create records"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
