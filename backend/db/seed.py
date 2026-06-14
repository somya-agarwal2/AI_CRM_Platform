import os
import sys
from datetime import datetime, timedelta
import random

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models import db, User, Customer, Segment, Campaign, CampaignMessage, Journey, JourneyNode, AIOpportunity, AICampaignOpportunity, DeliveryEvent, AnalyticsSnapshot, Order, OrderItem, Template

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

        print("Seeding 150 Customers...")
        customers = []
        first_names = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen']
        last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin']
        cities = ['New York', 'London', 'Mumbai', 'Sydney', 'Tokyo']
        import json
        for i in range(150):
            churn = random.uniform(0.0, 1.0)
            
            ai_rec = {
                "churn_analysis": {"score": churn},
                "next_best_action": {
                    "action": "Send Special Offer" if churn < 0.4 else ("Cross-sell Accessories" if churn < 0.7 else "Send Winback Discount"),
                    "channel": random.choice(["Email", "WhatsApp", "SMS"])
                },
                "expected_business_impact": f"${random.randint(50, 500)}",
                "confidence_score": random.randint(60, 95),
                "campaign_recommendation": "VIP Offer" if churn < 0.4 else "Re-engagement",
                "message_copy": "We have a special offer just for you today!",
                "reasoning": "Based on purchase frequency and recent browsing history."
            }
            
            c = Customer(
                first_name=random.choice(first_names),
                last_name=random.choice(last_names),
                email=f'{random.choice(["user", "customer", "contact"])}{i}@example.com',
                phone=f'+1555000{i:03d}',
                city=random.choice(cities),
                total_spent=random.uniform(50.0, 5000.0),
                order_count=random.randint(1, 20),
                last_purchase_date=datetime.utcnow() - timedelta(days=random.randint(1, 100)),
                churn_score=churn,
                ai_recommendation=json.dumps(ai_rec)
            )
            customers.append(c)
        db.session.add_all(customers)
        db.session.commit()

        print("Seeding Orders...")
        orders = []
        order_items = []
        product_names = ['Running Shoes', 'Gaming Laptop', 'Wireless Earbuds', 'Smartwatch', 'Mechanical Keyboard', 'Leather Jacket', 'Smartphone', 'Denim Jeans']
        categories = ['Electronics', 'Apparel', 'Footwear', 'Accessories']
        
        for idx, c in enumerate(customers):
            num_orders = random.randint(1, 3)
            for j in range(num_orders):
                order_date = datetime.utcnow() - timedelta(days=random.randint(1, 100))
                amt = random.uniform(20.0, 500.0)
                o = Order(
                    customer_id=c.id,
                    order_number=f"ORD-{idx}-{j}-{random.randint(1000,9999)}",
                    amount=amt,
                    order_date=order_date
                )
                orders.append(o)
                
                for k in range(random.randint(1, 2)):
                    item = OrderItem(
                        order=o,
                        product_name=random.choice(product_names),
                        category=random.choice(categories),
                        price=amt / 2
                    )
                    order_items.append(item)
                    
        db.session.add_all(orders)
        db.session.add_all(order_items)
        db.session.commit()

        print("Seeding Segments...")
        seg_new = Segment(name='New Customers', description='Customers acquired in the last 30 days', is_ai=True)
        seg_vip = Segment(name='VIP Customers', description='Top spenders with high LTV', is_ai=True)
        seg_risk = Segment(name='High Risk Customers', description='High churn probability based on ML model', is_ai=True)
        seg_lapsed = Segment(name='Lapsed Customers', description='No purchases in 90 days', is_ai=False)
        seg_tech = Segment(name='Tech Enthusiasts', description='Frequently buys Electronics', is_ai=True)
        
        segments = [seg_new, seg_vip, seg_risk, seg_lapsed, seg_tech]
        
        for c in customers:
            if c.order_count <= 2:
                seg_new.customers.append(c)
            if c.total_spent > 2500:
                seg_vip.customers.append(c)
            if c.churn_score > 0.6:
                seg_risk.customers.append(c)
            if c.last_purchase_date < datetime.utcnow() - timedelta(days=90):
                seg_lapsed.customers.append(c)
            if random.random() > 0.7:
                seg_tech.customers.append(c)
                
        db.session.add_all(segments)
        db.session.commit()

        print("Seeding Campaigns and Messages...")
        campaigns = []
        messages = []
        campaigns_data = [
            {"name": "Welcome Discount for New Customers", "goal": "Drive first purchase", "offer": "20% Off First Order", "segment": seg_new, "status": "Running", "content": "Hi {{name}},\n\nWelcome to EngageX! Here is 20% off your first order to get started.\n\nUse code: WELCOME20"},
            {"name": "VIP Exclusive Pre-sale", "goal": "Reward loyalty", "offer": "Early Access + Free Shipping", "segment": seg_vip, "status": "Completed", "content": "Hi {{name}},\n\nBecause you are a VIP, we are giving you 24-hour early access to our new collection.\n\nEnjoy free shipping!"},
            {"name": "Win-back Offer for Lapsed Customers", "goal": "Re-engage inactive users", "offer": "We Miss You - 30% Off", "segment": seg_lapsed, "status": "Running", "content": "Hi {{name}},\n\nWe haven't seen you in a while! Here is a 30% off coupon just for you to come back.\n\nUse code: MISSYOU30"},
            {"name": "Tech Gadget Bundle Sale", "goal": "Cross-sell electronics", "offer": "Buy Laptop get Earbuds 50% Off", "segment": seg_tech, "status": "Draft", "content": "Hi {{name}},\n\nUpgrade your tech! Buy any laptop today and get our premium wireless earbuds at 50% off!"},
            {"name": "High Risk Retention Strategy", "goal": "Prevent churn", "offer": "$50 Store Credit", "segment": seg_risk, "status": "Paused", "content": "Hi {{name}},\n\nWe value your feedback. Complete a quick survey and receive $50 store credit on your account!"}
        ]
        
        for data in campaigns_data:
            camp = Campaign(
                name=data["name"],
                goal=data["goal"],
                offer=data["offer"],
                audience_id=data["segment"].id,
                channels='email,whatsapp',
                expected_revenue=random.uniform(5000.0, 50000.0),
                confidence_score=random.uniform(0.7, 0.99),
                status=data["status"]
            )
            campaigns.append(camp)
            msg = CampaignMessage(campaign=camp, channel='email', content=data["content"])
            messages.append(msg)

        db.session.add_all(campaigns)
        db.session.add_all(messages)
        db.session.commit()

        print("Seeding Journeys...")
        journeys = []
        journey_nodes = []
        import json
        for camp in campaigns:
            if camp.status == 'Draft': continue
            j = Journey(
                campaign_id=camp.id,
                name=f"{camp.name} Automated",
                type='active'
            )
            journeys.append(j)
            
            entered = random.randint(100, 500)
            cfg_trigger = {"event": "Segment Entry", "stats": {"entered": entered}}
            n0 = JourneyNode(journey=j, type='trigger', config=json.dumps(cfg_trigger))
            
            sent1 = int(entered * random.uniform(0.9, 1.0))
            cfg_email = {"channel": "Email", "subject": "Special Offer!", "stats": {"sent": sent1, "opn": random.randint(30, 60), "clk": random.randint(10, 25)}}
            n1 = JourneyNode(journey=j, type='action', config=json.dumps(cfg_email))
            
            proceeded = int(sent1 * random.uniform(0.8, 0.95))
            cfg_wait = {"days": 2, "stats": {"proceeded": proceeded}}
            n2 = JourneyNode(journey=j, type='wait', config=json.dumps(cfg_wait))
            
            sent2 = proceeded
            cfg_wa = {"channel": "WhatsApp", "template": "Follow up", "stats": {"sent": sent2, "opn": random.randint(70, 95), "clk": random.randint(20, 50)}}
            n3 = JourneyNode(journey=j, type='action', config=json.dumps(cfg_wa))
            
            journey_nodes.extend([n0, n1, n2, n3])
            
        db.session.add_all(journeys)
        db.session.add_all(journey_nodes)
        db.session.commit()

        print("Seeding Delivery Events...")
        for camp in campaigns:
            if camp.status in ['Draft', 'Paused']:
                continue
                
            # Get the customers in this campaign's segment
            camp_segment = next(s for s in segments if s.id == camp.audience_id)
            target_customers = camp_segment.customers
            
            for c in target_customers:
                # Everyone gets DELIVERED
                ev_del = DeliveryEvent(campaign_id=camp.id, customer_id=c.id, channel='email', status='DELIVERED')
                db.session.add(ev_del)
                
                # 45% OPENED
                if random.random() < 0.45:
                    ev_open = DeliveryEvent(campaign_id=camp.id, customer_id=c.id, channel='email', status='OPENED')
                    db.session.add(ev_open)
                    
                    # 15% CLICKED (of those who opened)
                    if random.random() < 0.33:
                        ev_click = DeliveryEvent(campaign_id=camp.id, customer_id=c.id, channel='email', status='CLICKED')
                        db.session.add(ev_click)
        
        print("Seeding Opportunities...")
        opp1 = AICampaignOpportunity(
            title="Win-back Dormant VIPs",
            target_segment_name="Lapsed High-Value Customers",
            target_segment_description="Customers who spent >$500 but haven't purchased in 90 days",
            customer_count=45,
            expected_revenue=12500.0,
            confidence_score=85,
            reasoning="These customers have a high historical lifetime value. A targeted win-back offer has a high probability of conversion based on past behavior."
        )
        opp2 = AICampaignOpportunity(
            title="Cross-sell Accessories to Tech Buyers",
            target_segment_name="Recent Laptop Purchasers",
            target_segment_description="Customers who bought a laptop in the last 30 days but no accessories",
            customer_count=120,
            expected_revenue=8400.0,
            confidence_score=72,
            reasoning="Accessory attach rates are typically highest within 30 days of a core device purchase."
        )
        opp3 = AICampaignOpportunity(
            title="Holiday Early Access for Frequent Shoppers",
            target_segment_name="Frequent Shoppers",
            target_segment_description="Customers with >5 orders in the past year",
            customer_count=85,
            expected_revenue=15000.0,
            confidence_score=92,
            reasoning="Rewarding loyal customers with early access significantly boosts retention and word-of-mouth referrals."
        )
        db.session.add_all([opp1, opp2, opp3])
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

        print("Seeding Templates...")
        templates = [
            Template(
                name="Welcome Series",
                category="Onboarding",
                thumbnail="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=400&q=80",
                html_content="<h1>Welcome to EngageX!</h1><p>We are glad to have you.</p>",
                usage_count=random.randint(100, 500),
                open_rate=random.uniform(40, 60),
                click_rate=random.uniform(10, 20),
                conversion_rate=random.uniform(2, 5),
            ),
            Template(
                name="Flash Sale Alert",
                category="Promotional",
                thumbnail="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=400&q=80",
                html_content="<h1>Flash Sale!</h1><p>Get 50% off everything today only!</p>",
                usage_count=random.randint(200, 1000),
                open_rate=random.uniform(20, 35),
                click_rate=random.uniform(5, 12),
                conversion_rate=random.uniform(1, 3),
            ),
            Template(
                name="Win-Back Campaign",
                category="Retention",
                thumbnail="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=400&q=80",
                html_content="<h1>We miss you!</h1><p>Here is a special discount to come back.</p>",
                usage_count=random.randint(50, 300),
                open_rate=random.uniform(30, 45),
                click_rate=random.uniform(8, 15),
                conversion_rate=random.uniform(3, 7),
            )
        ]
        db.session.add_all(templates)
        db.session.commit()

        print("Seed complete.")

if __name__ == '__main__':
    seed_data()
