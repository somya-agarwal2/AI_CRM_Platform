import os
import sys
import json
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
        customers = Customer.query.all()
        print(f"Generating AI recommendations for {len(customers)} customers...")
        
        chunk_size = 30
        for i in range(0, len(customers), chunk_size):
            chunk = customers[i:i+chunk_size]
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
            
            print(f"Processing chunk {i//chunk_size + 1}...")
            try:
                insights = ai.generate_bulk_customer_insights(data)
                if insights:
                    insight_map = {item['id']: item for item in insights if 'id' in item}
                    for c in chunk:
                        if c.id in insight_map:
                            c.ai_recommendation = json.dumps(insight_map[c.id])
                    db.session.commit()
                    print(f"Successfully updated chunk {i//chunk_size + 1}")
                else:
                    print(f"Failed to get insights for chunk {i//chunk_size + 1}")
            except Exception as e:
                print(f"Error on chunk {i//chunk_size + 1}: {e}")

if __name__ == '__main__':
    populate_ai()
