import os
import sys
import json
import time
from dotenv import load_dotenv

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))
from app import create_app
from app.models import db, Customer
from app.services.ai_service import AIService

load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

def populate_ai():
    app = create_app()
    with app.app_context():
        ai = AIService()
        all_customers = Customer.query.all()
        
        mocked_customers = []
        for c in all_customers:
            if c.ai_recommendation:
                try:
                    data = json.loads(c.ai_recommendation)
                    if data.get("message_copy") == "We have a special offer just for you today!":
                        mocked_customers.append(c)
                except:
                    pass
        
        print(f"Found {len(mocked_customers)} customers with mocked recommendations.")
        
        chunk_size = 15
        for i in range(0, len(mocked_customers), chunk_size):
            chunk = mocked_customers[i:i+chunk_size]
            data = []
            for c in chunk:
                data.append({
                    "id": c.id,
                    "first_name": c.first_name,
                    "last_name": c.last_name,
                    "total_spent": c.total_spent,
                    "order_count": c.order_count,
                    "churn_score": c.churn_score
                })
            
            chunk_num = i // chunk_size + 1
            while True:
                print(f"Processing chunk {chunk_num}...")
                insights = ai.generate_bulk_customer_insights(data)
                if insights:
                    insight_map = {item['id']: item for item in insights if 'id' in item}
                    for c in chunk:
                        if c.id in insight_map:
                            c.ai_recommendation = json.dumps(insight_map[c.id])
                    db.session.commit()
                    print(f"Successfully updated chunk {chunk_num}")
                    break
                else:
                    print(f"Got None for chunk {chunk_num}. Rate limit likely hit. Waiting 65 seconds before retry...")
                    time.sleep(65)

if __name__ == '__main__':
    populate_ai()
