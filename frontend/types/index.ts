export interface HostedZone {
  id: string;
  name: string;
  type: "Public" | "Private";
  comment?: string;
  record_count: number;
  created_at: string;
  updated_at: string;
}

export interface HostedZoneListResponse {
  items: HostedZone[];
  total: number;
  page: number;
  size: number;
}

export type RecordType = "A" | "AAAA" | "CNAME" | "TXT" | "MX" | "NS" | "PTR" | "SRV" | "CAA" | "SOA";
export type RoutingPolicy = "Simple" | "Weighted" | "Latency" | "Failover" | "Geolocation";

export interface AliasTarget {
  hosted_zone_id: string;
  dns_name: string;
  evaluate_health: boolean;
}

export interface DNSRecord {
  id: string;
  hosted_zone_id: string;
  name: string;
  type: RecordType;
  ttl?: number;
  routing_policy: RoutingPolicy;
  alias: boolean;
  alias_target?: AliasTarget;
  records?: string[];
  weight?: number;
  set_identifier?: string;
  health_check_id?: string;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface DNSRecordListResponse {
  items: DNSRecord[];
  total: number;
  page: number;
  size: number;
}
