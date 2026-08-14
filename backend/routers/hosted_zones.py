import random
import string
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from .. import schemas, models, auth
from ..database import get_db

router = APIRouter(prefix="/hosted-zones", tags=["hosted-zones"])

def generate_zone_id():
    chars = string.ascii_uppercase + string.digits
    return "Z" + "".join(random.choices(chars, k=13))

@router.get("", response_model=schemas.HostedZoneListResponse)
def list_hosted_zones(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(
        models.HostedZone,
        func.count(models.DNSRecord.id).label("record_count")
    ).outerjoin(
        models.DNSRecord, models.HostedZone.id == models.DNSRecord.hosted_zone_id
    ).filter(
        models.HostedZone.user_id == current_user.id
    ).group_by(models.HostedZone.id)

    if search:
        query = query.filter(models.HostedZone.name.ilike(f"%{search}%"))
        
    total = query.count()
    
    offset = (page - 1) * size
    zones_with_count = query.order_by(models.HostedZone.name).offset(offset).limit(size).all()
    
    items = []
    for zone, count in zones_with_count:
        zone_dict = {
            "id": zone.id,
            "name": zone.name,
            "type": zone.type,
            "comment": zone.comment,
            "created_at": zone.created_at,
            "updated_at": zone.updated_at,
            "record_count": count
        }
        items.append(schemas.HostedZoneResponse(**zone_dict))

    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size
    }

@router.post("", response_model=schemas.HostedZoneResponse)
def create_hosted_zone(
    zone_in: schemas.HostedZoneCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Ensure name ends with a dot (AWS standard)
    name = zone_in.name if zone_in.name.endswith(".") else zone_in.name + "."
    
    new_zone = models.HostedZone(
        id=generate_zone_id(),
        user_id=current_user.id,
        name=name,
        type=zone_in.type,
        comment=zone_in.comment
    )
    db.add(new_zone)
    db.commit()
    db.refresh(new_zone)
    
    # Auto-create SOA and NS records (Mocked basic NS records for realism)
    ns_record = models.DNSRecord(
        hosted_zone_id=new_zone.id,
        name=name,
        type=models.RecordType.NS,
        ttl=172800,
        records=["ns-111.awsdns-11.com.", "ns-222.awsdns-22.net.", "ns-333.awsdns-33.org.", "ns-444.awsdns-44.co.uk."]
    )
    soa_record = models.DNSRecord(
        hosted_zone_id=new_zone.id,
        name=name,
        type=models.RecordType.SOA,
        ttl=900,
        records=[f"ns-111.awsdns-11.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"]
    )
    db.add(ns_record)
    db.add(soa_record)
    db.commit()
    
    return {**new_zone.__dict__, "record_count": 2}

@router.get("/{zone_id}", response_model=schemas.HostedZoneResponse)
def get_hosted_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    zone_with_count = db.query(
        models.HostedZone,
        func.count(models.DNSRecord.id).label("record_count")
    ).outerjoin(
        models.DNSRecord, models.HostedZone.id == models.DNSRecord.hosted_zone_id
    ).filter(
        models.HostedZone.id == zone_id,
        models.HostedZone.user_id == current_user.id
    ).group_by(models.HostedZone.id).first()

    if not zone_with_count:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
        
    zone, count = zone_with_count
    return {**zone.__dict__, "record_count": count}

@router.put("/{zone_id}", response_model=schemas.HostedZoneResponse)
def update_hosted_zone(
    zone_id: str,
    zone_in: schemas.HostedZoneUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    zone = db.query(models.HostedZone).filter(
        models.HostedZone.id == zone_id,
        models.HostedZone.user_id == current_user.id
    ).first()
    
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
        
    if zone_in.comment is not None:
        zone.comment = zone_in.comment
        
    db.commit()
    db.refresh(zone)
    
    record_count = db.query(models.DNSRecord).filter(models.DNSRecord.hosted_zone_id == zone.id).count()
    return {**zone.__dict__, "record_count": record_count}

@router.delete("/{zone_id}")
def delete_hosted_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    zone = db.query(models.HostedZone).filter(
        models.HostedZone.id == zone_id,
        models.HostedZone.user_id == current_user.id
    ).first()
    
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
        
    db.delete(zone)
    db.commit()
    return {"message": "Hosted zone deleted successfully"}
