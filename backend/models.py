import uuid
from datetime import datetime, timezone
import json
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
import enum
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class ZoneType(str, enum.Enum):
    Public = "Public"
    Private = "Private"

class RecordType(str, enum.Enum):
    A = "A"
    AAAA = "AAAA"
    CNAME = "CNAME"
    TXT = "TXT"
    MX = "MX"
    NS = "NS"
    PTR = "PTR"
    SRV = "SRV"
    CAA = "CAA"
    SOA = "SOA"

class RoutingPolicy(str, enum.Enum):
    Simple = "Simple"
    Weighted = "Weighted"
    Latency = "Latency"
    Failover = "Failover"
    Geolocation = "Geolocation"

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    account_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    zones = relationship("HostedZone", back_populates="user", cascade="all, delete-orphan")

class HostedZone(Base):
    __tablename__ = "hosted_zones"
    id = Column(String, primary_key=True) # e.g. Z1D633PJN98FT9
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False, index=True) # e.g. example.com.
    type = Column(Enum(ZoneType), default=ZoneType.Public, nullable=False)
    comment = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="zones")
    records = relationship("DNSRecord", back_populates="zone", cascade="all, delete-orphan")

class DNSRecord(Base):
    __tablename__ = "dns_records"
    id = Column(String, primary_key=True, default=generate_uuid)
    hosted_zone_id = Column(String, ForeignKey("hosted_zones.id"), nullable=False)
    name = Column(String, nullable=False, index=True)
    type = Column(Enum(RecordType), nullable=False)
    ttl = Column(Integer, nullable=True) # Nullable for aliases
    routing_policy = Column(Enum(RoutingPolicy), default=RoutingPolicy.Simple, nullable=False)
    alias = Column(Boolean, default=False, nullable=False)
    
    # Store JSON arrays/objects as text in SQLite
    _alias_target = Column("alias_target", Text, nullable=True)
    _records = Column("records", Text, nullable=True)
    
    weight = Column(Integer, nullable=True)
    set_identifier = Column(String, nullable=True)
    health_check_id = Column(String, nullable=True)
    comment = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    zone = relationship("HostedZone", back_populates="records")

    @property
    def alias_target(self):
        if self._alias_target:
            return json.loads(self._alias_target)
        return None

    @alias_target.setter
    def alias_target(self, value):
        self._alias_target = json.dumps(value) if value else None

    @property
    def records(self):
        if self._records:
            return json.loads(self._records)
        return []

    @records.setter
    def records(self, value):
        self._records = json.dumps(value) if value is not None else None
