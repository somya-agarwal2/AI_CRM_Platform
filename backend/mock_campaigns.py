from app import create_app
from app.models import db, Campaign, Journey
from datetime import datetime

app = create_app()

with app.app_context():
    print("Generating Mock Campaigns...")
    c1 = Campaign(
        name="Summer Sale",
        status="Running",
        channels="Email",
        audience_id=1,
        goal="Drive Summer sales",
        expected_revenue=5000,
        creation_source="AI Command Center"
    )
    c2 = Campaign(
        name="VIP Win-back",
        status="Completed",
        channels="Email, SMS",
        audience_id=2,
        goal="Win back dormant VIPs",
        expected_revenue=12000,
        creation_source="Manual"
    )
    c3 = Campaign(
        name="Welcome Series",
        status="Running",
        channels="Email",
        audience_id=3,
        goal="Onboard new users",
        expected_revenue=3000,
        creation_source="System"
    )
    db.session.add_all([c1, c2, c3])
    
    print("Generating Mock Journeys...")
    j1 = Journey(
        name="Abandoned Cart Recovery"
    )
    j2 = Journey(
        name="Post-Purchase Follow Up"
    )
    db.session.add_all([j1, j2])
    db.session.commit()
    print("Mock campaigns and journeys added!")
