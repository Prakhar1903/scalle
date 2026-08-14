from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import datetime
from .models import ZoneType, RecordType, RoutingPolicy

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    account_id: str
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class HostedZoneBase(BaseModel):
    name: str
    type: ZoneType = ZoneType.Public
    comment: Optional[str] = None

class HostedZoneCreate(HostedZoneBase):
    pass

class HostedZoneUpdate(BaseModel):
    comment: Optional[str] = None

class HostedZoneResponse(HostedZoneBase):
    id: str
    record_count: int = 0
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class HostedZoneListResponse(BaseModel):
    items: List[HostedZoneResponse]
    total: int
    page: int
    size: int

class AliasTarget(BaseModel):
    hosted_zone_id: str
    dns_name: str
    evaluate_health: bool

class DNSRecordBase(BaseModel):
    name: str
    type: RecordType
    ttl: Optional[int] = None
    routing_policy: RoutingPolicy = RoutingPolicy.Simple
    alias: bool = False
    alias_target: Optional[AliasTarget] = None
    records: Optional[List[str]] = None
    weight: Optional[int] = None
    set_identifier: Optional[str] = None
    health_check_id: Optional[str] = None
    comment: Optional[str] = None

class DNSRecordCreate(DNSRecordBase):
    pass

class DNSRecordUpdate(BaseModel):
    ttl: Optional[int] = None
    routing_policy: Optional[RoutingPolicy] = None
    alias: Optional[bool] = None
    alias_target: Optional[AliasTarget] = None
    records: Optional[List[str]] = None
    weight: Optional[int] = None
    set_identifier: Optional[str] = None
    health_check_id: Optional[str] = None
    comment: Optional[str] = None

class DNSRecordResponse(DNSRecordBase):
    id: str
    hosted_zone_id: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class DNSRecordListResponse(BaseModel):
    items: List[DNSRecordResponse]
    total: int
    page: int
    size: int

class BulkDeleteRequest(BaseModel):
    record_ids: List[str]

class ImportResult(BaseModel):
    imported: int
    skipped: int
    errors: List[str]
