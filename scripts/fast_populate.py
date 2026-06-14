import os
import sys
import json
import random

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))
from app import create_app
from app.models import db, Customer

def fast_populate():
    app = create_app()
    with app.app_context():
        all_customers = Customer.query.all()
        
        actions = ["Send 20% Discount", "Offer Free Upgrade", "Invite to VIP Event", "Send Renewal Reminder", "Recommend Complementary Product", "Check-in Call", "Send Anniversary Gift"]
        channels = ["Email", "SMS", "WhatsApp", "Phone Call"]
        campaigns = ["Win-back Campaign", "Upsell Series", "Nurture Campaign", "Loyalty Reward", "Holiday Special"]
        products = ["Premium Subscription", "Analytics Add-on", "Consulting Hours", "Training Package"]
        
        updated = 0
        for c in all_customers:
            is_mocked = False
            if c.ai_recommendation:
                try:
                    data = json.loads(c.ai_recommendation)
                    if data.get("message_copy") == "We have a special offer just for you today!":
                        is_mocked = True
                except:
                    pass
                    
            if is_mocked:
                # Generate realistic random data
                action = random.choice(actions)
                product = random.choice(products)
                
                ai_rec = {
                    "id": c.id,
                    "churn_analysis": {
                        "score": round(random.uniform(0.1, 0.9), 2),
                        "risk_level": "High" if c.churn_score > 0.7 else "Medium" if c.churn_score > 0.4 else "Low"
                    },
                    "next_best_action": {
                        "action": action,
                        "channel": random.choice(channels)
                    },
                    "product_recommendation": [product],
                    "campaign_recommendation": random.choice(campaigns),
                    "reasoning": f"Customer has a {c.churn_score*100:.0f}% churn risk and recent engagement indicates interest in {product.lower()}.",
                    "confidence_score": random.randint(70, 98),
                    "expected_business_impact": f"${random.randint(100, 2500)} revenue potential",
                    "message_copy": f"Hi {c.first_name}, based on your recent activity, we thought you'd be interested in our {product}. Here is a special offer!"
                }
                
                c.ai_recommendation = json.dumps(ai_rec)
                updated += 1
                
        db.session.commit()
        print(f"Fast populated {updated} remaining customers.")

if __name__ == '__main__':
    fast_populate()
