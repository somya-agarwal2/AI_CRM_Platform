import os
import sys
from datetime import datetime, timedelta
import random

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models import db, User, Customer, Segment, Campaign, CampaignMessage, Journey, JourneyNode, AIOpportunity, DeliveryEvent, AnalyticsSnapshot

def seed_data():
    app = create_app()
    with app.app_context():
        print("Dropping all tables...")
        db.drop_all()
        print("Creating all tables...")
        db.create_all()

        print("Seeding Users...")
        admin = User(name='Admin User', email='admin@xeno.ai', password_hash='hashed', role='Admin')
        manager = User(name='Marketing Manager', email='manager@xeno.ai', password_hash='hashed', role='Marketing Manager')
        analyst = User(name='Data Analyst', email='analyst@xeno.ai', password_hash='hashed', role='Analyst')
        db.session.add_all([admin, manager, analyst])

        print("Seeding 500 Customers...")
        customers = []
        cities = ['New York', 'London', 'Mumbai', 'Sydney', 'Tokyo']
        for i in range(500):
            c = Customer(
                first_name=f'Cust{i}',
                last_name=f'LName{i}',
                email=f'cust{i}@example.com',
                phone=f'+1555000{i:03d}',
                city=random.choice(cities),
                total_spent=random.uniform(50.0, 5000.0),
                order_count=random.randint(1, 20),
                last_purchase_date=datetime.utcnow() - timedelta(days=random.randint(1, 100)),
                churn_score=random.uniform(0.0, 1.0)
            )
            customers.append(c)
        db.session.add_all(customers)
        db.session.commit()

        print("Seeding Segments...")
        segments = [Segment(name=f'Segment {i}', description=f'Auto generated segment {i}') for i in range(10)]
        db.session.add_all(segments)

        print("Seeding Campaigns and Messages...")
        campaigns = []
        statuses = ['Draft', 'Running', 'Paused', 'Completed']
        for i in range(20):
            camp = Campaign(
                name=f'Campaign {i}',
                goal=f'Goal {i}',
                offer=f'Offer {i}',
                channels='email,whatsapp',
                expected_revenue=random.uniform(1000.0, 50000.0),
                confidence_score=random.uniform(0.5, 0.99),
                status=random.choice(statuses)
            )
            campaigns.append(camp)
        db.session.add_all(campaigns)
        db.session.commit()

        print("Seeding 1000 Delivery Events...")
        for i in range(1000):
            ev = DeliveryEvent(
                campaign_id=random.choice(campaigns).id,
                customer_id=random.choice(customers).id,
                channel=random.choice(['email', 'whatsapp', 'sms']),
                status=random.choice(['DELIVERED', 'OPENED', 'CLICKED', 'FAILED'])
            )
            db.session.add(ev)
        
        print("Seeding Opportunities...")
        db.session.commit()

        print("Seeding Analytics...")
        for i in range(30):
            snap = AnalyticsSnapshot(
                date=datetime.utcnow() - timedelta(days=i),
                revenue=random.uniform(1000.0, 5000.0),
                conversions=random.randint(10, 100),
                audience_growth=random.randint(-5, 20)
            )
            db.session.add(snap)

        db.session.commit()
        print("Seed complete.")

if __name__ == '__main__':
    seed_data()
