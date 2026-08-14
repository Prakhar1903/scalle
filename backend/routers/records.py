from fastapi import APIRouter, Depends, HTTPException, Query, Response, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
import json

from .. import schemas, models, auth
from ..database import get_db

router = APIRouter(prefix="/hosted-zones/{zone_id}/records", tags=["records"])

def get_zone_or_404(zone_id: str, current_user: models.User, db: Session):
    zone = db.query(models.HostedZone).filter(
        models.HostedZone.id == zone_id,
        models.HostedZone.user_id == current_user.id
    ).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return zone

@router.get("", response_model=schemas.DNSRecordListResponse)
def list_records(
    zone_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    type: Optional[models.RecordType] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    get_zone_or_404(zone_id, current_user, db)
    
    query = db.query(models.DNSRecord).filter(models.DNSRecord.hosted_zone_id == zone_id)
    
    if search:
        query = query.filter(models.DNSRecord.name.ilike(f"%{search}%"))
    if type:
        query = query.filter(models.DNSRecord.type == type)
        
    total = query.count()
    offset = (page - 1) * size
    
    # Sort by name, then type
    records = query.order_by(models.DNSRecord.name, models.DNSRecord.type).offset(offset).limit(size).all()
    
    return {
        "items": records,
        "total": total,
        "page": page,
        "size": size
    }

@router.post("", response_model=schemas.DNSRecordResponse)
def create_record(
    zone_id: str,
    record_in: schemas.DNSRecordCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    get_zone_or_404(zone_id, current_user, db)
    
    new_record = models.DNSRecord(
        hosted_zone_id=zone_id,
        **record_in.model_dump(exclude={"alias_target", "records"})
    )
    
    if record_in.alias_target:
        new_record.alias_target = record_in.alias_target.model_dump()
    if record_in.records:
        new_record.records = record_in.records
        
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record

@router.get("/{record_id}", response_model=schemas.DNSRecordResponse)
def get_record(
    zone_id: str,
    record_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    get_zone_or_404(zone_id, current_user, db)
    
    record = db.query(models.DNSRecord).filter(
        models.DNSRecord.id == record_id,
        models.DNSRecord.hosted_zone_id == zone_id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    return record

@router.put("/{record_id}", response_model=schemas.DNSRecordResponse)
def update_record(
    zone_id: str,
    record_id: str,
    record_in: schemas.DNSRecordUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    get_zone_or_404(zone_id, current_user, db)
    
    record = db.query(models.DNSRecord).filter(
        models.DNSRecord.id == record_id,
        models.DNSRecord.hosted_zone_id == zone_id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    update_data = record_in.model_dump(exclude_unset=True)
    
    if "alias_target" in update_data:
        val = update_data.pop("alias_target")
        record.alias_target = val
        
    if "records" in update_data:
        val = update_data.pop("records")
        record.records = val
        
    for key, value in update_data.items():
        setattr(record, key, value)
        
    db.commit()
    db.refresh(record)
    return record

@router.delete("/{record_id}")
def delete_record(
    zone_id: str,
    record_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    get_zone_or_404(zone_id, current_user, db)
    
    record = db.query(models.DNSRecord).filter(
        models.DNSRecord.id == record_id,
        models.DNSRecord.hosted_zone_id == zone_id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    # Prevent deleting SOA and NS records as they are default for a zone
    if record.type in [models.RecordType.SOA, models.RecordType.NS]:
        raise HTTPException(status_code=400, detail="Cannot delete default SOA or NS records")
        
    db.delete(record)
    db.commit()
    return {"message": "Record deleted successfully"}

@router.post("/bulk-delete")
def bulk_delete_records(
    zone_id: str,
    req: schemas.BulkDeleteRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    get_zone_or_404(zone_id, current_user, db)
    
    records = db.query(models.DNSRecord).filter(
        models.DNSRecord.id.in_(req.record_ids),
        models.DNSRecord.hosted_zone_id == zone_id
    ).all()
    
    deleted_count = 0
    for record in records:
        if record.type not in [models.RecordType.SOA, models.RecordType.NS]:
            db.delete(record)
            deleted_count += 1
            
    db.commit()
    return {"message": f"Successfully deleted {deleted_count} records", "deleted": deleted_count}

@router.get("/export/json")
def export_json(
    zone_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    zone = get_zone_or_404(zone_id, current_user, db)
    records = db.query(models.DNSRecord).filter(models.DNSRecord.hosted_zone_id == zone_id).all()
    
    data = {
        "zone": {
            "id": zone.id,
            "name": zone.name,
            "type": zone.type,
            "comment": zone.comment,
            "created_at": zone.created_at.isoformat(),
            "updated_at": zone.updated_at.isoformat() if zone.updated_at else None
        },
        "records": [
            {
                "name": r.name,
                "type": r.type,
                "ttl": r.ttl,
                "routing_policy": r.routing_policy,
                "alias": r.alias,
                "alias_target": r.alias_target,
                "records": r.records
            }
            for r in records
        ]
    }
    
    # We want it to be downloaded as a file
    headers = {
        "Content-Disposition": f"attachment; filename={zone.name}json"
    }
    return Response(content=json.dumps(data, indent=2), media_type="application/json", headers=headers)

@router.get("/export/bind")
def export_bind(
    zone_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    zone = get_zone_or_404(zone_id, current_user, db)
    records = db.query(models.DNSRecord).filter(models.DNSRecord.hosted_zone_id == zone_id).order_by(models.DNSRecord.name, models.DNSRecord.type).all()
    
    lines = []
    lines.append("; Exported from Route53 Clone")
    lines.append(f"$ORIGIN {zone.name}")
    lines.append("$TTL 3600")
    lines.append("")
    
    for r in records:
        # BIND doesn't natively support "alias", we'll just skip or serialize aliases as comments
        if r.alias:
            lines.append(f"; ALIAS {r.name} -> {r.alias_target}")
            continue
            
        ttl = r.ttl or 300
        rtype = r.type
        name = r.name
        if not r.records:
            continue
            
        for val in r.records:
            lines.append(f"{name:<25} {ttl:<5} IN  {rtype:<5} {val}")
            
    content = "\n".join(lines)
    
    headers = {
        "Content-Disposition": f"attachment; filename={zone.name}zone"
    }
    return Response(content=content, media_type="text/plain", headers=headers)

@router.post("/import-bind", response_model=schemas.ImportResult)
def import_bind(
    zone_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    zone = get_zone_or_404(zone_id, current_user, db)
    
    content = file.file.read().decode("utf-8")
    lines = content.splitlines()
    
    imported = 0
    skipped = 0
    errors = []
    
    current_origin = zone.name
    current_ttl = 300
    
    for i, line in enumerate(lines):
        # strip comments and whitespace
        line = line.split(";", 1)[0].strip()
        if not line:
            continue
            
        parts = line.split()
        if not parts:
            continue
            
        if parts[0].upper() == "$ORIGIN":
            if len(parts) > 1:
                current_origin = parts[1]
                if not current_origin.endswith("."):
                    current_origin += "."
            continue
            
        if parts[0].upper() == "$TTL":
            if len(parts) > 1:
                try:
                    current_ttl = int(parts[1])
                except ValueError:
                    errors.append(f"Line {i+1}: Invalid TTL value")
            continue
            
        # Parse record line
        # Format: name [ttl] [class] type data...
        # Class is usually IN, we can ignore it.
        try:
            name = parts[0]
            if name == "@":
                full_name = current_origin
            elif not name.endswith("."):
                full_name = f"{name}.{current_origin}"
            else:
                full_name = name
                
            idx = 1
            
            # check if next is TTL (integer)
            record_ttl = current_ttl
            if parts[idx].isdigit():
                record_ttl = int(parts[idx])
                idx += 1
                
            # check if next is CLASS (IN)
            if parts[idx].upper() == "IN":
                idx += 1
                
            record_type = parts[idx].upper()
            idx += 1
            
            record_data = " ".join(parts[idx:])
            
            # Validate record type
            try:
                rtype_enum = models.RecordType(record_type)
            except ValueError:
                skipped += 1
                errors.append(f"Line {i+1}: Unsupported record type {record_type}")
                continue
                
            # Create or update record
            # We'll just group by (name, type)
            existing = db.query(models.DNSRecord).filter(
                models.DNSRecord.hosted_zone_id == zone.id,
                models.DNSRecord.name == full_name,
                models.DNSRecord.type == rtype_enum
            ).first()
            
            if existing:
                if not existing.records:
                    existing.records = []
                if record_data not in existing.records:
                    # SQLAlchemy JSON mutation
                    new_records = list(existing.records)
                    new_records.append(record_data)
                    existing.records = new_records
                    existing.ttl = record_ttl
                    db.commit()
                    imported += 1
                else:
                    skipped += 1
            else:
                new_record = models.DNSRecord(
                    hosted_zone_id=zone.id,
                    name=full_name,
                    type=rtype_enum,
                    ttl=record_ttl,
                    routing_policy=models.RoutingPolicy.Simple,
                    alias=False,
                    records=[record_data]
                )
                db.add(new_record)
                db.commit()
                imported += 1
                
        except Exception as e:
            errors.append(f"Line {i+1}: Parse error ({str(e)})")
            
    return schemas.ImportResult(imported=imported, skipped=skipped, errors=errors)
