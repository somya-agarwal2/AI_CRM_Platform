import sys
import os
import json

# Add backend dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
import os
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from app import create_app
from app.models import db, Customer
from app.services.ai_service import ai_service, get_ai_provider
from datetime import datetime

# Force re-initialization of provider after dotenv loads
ai_service._provider = get_ai_provider()

app = create_app()

def run():
    with app.app_context():
        customers = Customer.query.all()
        print(f"Total customers: {len(customers)}")
        
        batch_size = 10
        for i in range(0, len(customers), batch_size):
            batch = customers[i:i+batch_size]
            print(f"Processing batch {i//batch_size + 1} of {len(customers)//batch_size + 1}", flush=True)
            
            c_data = []
            for c in batch:
                days_since = (datetime.utcnow() - c.last_purchase_date).days if c.last_purchase_date else 999
                c_data.append({
                    "id": c.id,
                    "first_name": c.first_name,
                    "last_name": c.last_name,
                    "total_spent": c.total_spent,
                    "order_count": c.order_count,
                    "days_since_last_purchase": days_since,
                    "city": c.city
                })
            
            # Call Gemini
            import time
            
            max_retries = 5
            res = None
            
            for attempt in range(max_retries):
                res = ai_service.generate_bulk_customer_insights(c_data)
                if res:
                    break
                print(f"API failed or rate limited. Retrying in 65 seconds... (Attempt {attempt + 1}/{max_retries})", flush=True)
                time.sleep(65)
            
            if res:
                for item in res:
                    c = Customer.query.get(item.get('id'))
                    if c:
                        churn_dict = item.get('churn_analysis', {})
                        score = churn_dict.get('score', c.churn_score)
                        
                        if isinstance(score, float) and score <= 1.0:
                            score = int(score * 100) # Convert 0.85 to 85
                            
                        c.churn_score = score
                        
                        # Remove ID from the item before saving as recommendation JSON
                        rec_data = {k: v for k, v in item.items() if k != 'id'}
                        c.ai_recommendation = json.dumps(rec_data)
                
                db.session.commit()
                print("Batch committed.")
            else:
                print("Failed to get response for batch after retries. Try running the script again later.")

if __name__ == '__main__':
    run()
