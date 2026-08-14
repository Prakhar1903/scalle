from .database import SessionLocal, engine, Base
from .models import User, HostedZone, DNSRecord, ZoneType, RecordType, RoutingPolicy
from .auth import get_password_hash
from .routers.auth import generate_account_id
from .routers.hosted_zones import generate_zone_id
import datetime

# Reset DB
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

print("Seeding database...")

# 1. Create a demo user
demo_email = "demo@example.com"
demo_password = "password123"

demo_user = User(
    email=demo_email,
    hashed_password=get_password_hash(demo_password),
    name="Demo User",
    account_id=generate_account_id()
)
db.add(demo_user)
db.commit()
db.refresh(demo_user)

print(f"Created user: {demo_email} (password: {demo_password})")

# 2. Create some hosted zones
zones_data = [
    {"name": "example.com.", "type": ZoneType.Public, "comment": "Main production zone"},
    {"name": "internal.local.", "type": ZoneType.Private, "comment": "Internal VPC routing"},
    {"name": "test-app.io.", "type": ZoneType.Public, "comment": "Staging environment"},
]

zones = []
for z in zones_data:
    zone = HostedZone(
        id=generate_zone_id(),
        user_id=demo_user.id,
        name=z["name"],
        type=z["type"],
        comment=z["comment"]
    )
    db.add(zone)
    zones.append(zone)
db.commit()

print(f"Created {len(zones)} hosted zones")

# 3. Create records for the first zone (example.com.)
zone_1 = zones[0]

# Automatically added by AWS
db.add(DNSRecord(
    hosted_zone_id=zone_1.id,
    name=zone_1.name,
    type=RecordType.NS,
    ttl=172800,
    records=["ns-111.awsdns-11.com.", "ns-222.awsdns-22.net.", "ns-333.awsdns-33.org.", "ns-444.awsdns-44.co.uk."]
))
db.add(DNSRecord(
    hosted_zone_id=zone_1.id,
    name=zone_1.name,
    type=RecordType.SOA,
    ttl=900,
    records=[f"ns-111.awsdns-11.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"]
))

# Some custom records
db.add(DNSRecord(
    hosted_zone_id=zone_1.id,
    name=f"api.{zone_1.name}",
    type=RecordType.A,
    ttl=300,
    records=["192.168.1.100", "192.168.1.101"]
))
db.add(DNSRecord(
    hosted_zone_id=zone_1.id,
    name=f"www.{zone_1.name}",
    type=RecordType.CNAME,
    ttl=3600,
    records=[f"web-elb.us-east-1.elb.amazonaws.com"]
))
db.add(DNSRecord(
    hosted_zone_id=zone_1.id,
    name=zone_1.name,
    type=RecordType.MX,
    ttl=3600,
    records=["10 inbound-smtp.us-east-1.amazonaws.com", "20 inbound-smtp2.us-east-1.amazonaws.com"]
))
db.add(DNSRecord(
    hosted_zone_id=zone_1.id,
    name=zone_1.name,
    type=RecordType.TXT,
    ttl=300,
    records=['"v=spf1 include:amazonses.com ~all"']
))

db.commit()

print(f"Seeded records for {zone_1.name}")
print("Done!")
db.close()
