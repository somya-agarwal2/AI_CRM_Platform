import os
import sys
import json
import random

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))
from app import create_app
from app.models import db, Customer, AIAudienceOpportunity

def fast_populate_segments():
    app = create_app()
    with app.app_context():
        # Clear existing pending to avoid duplicates
        AIAudienceOpportunity.query.filter_by(status='pending').delete()
        
        all_customers = Customer.query.all()
        if not all_customers:
            print("No customers found.")
            return
            
        # Segment 1: High LTV At-Risk
        high_ltv = sorted([c for c in all_customers if c.churn_score > 0.6], key=lambda x: x.total_spent, reverse=True)[:5]
        if high_ltv:
            opp1 = AIAudienceOpportunity(
                segment_name="VIPs at Churn Risk",
                reasoning="These high-value customers have a high churn risk score and haven't engaged recently. Immediate intervention can save significant revenue.",
                target_criteria="LTV > $2000 AND Churn Risk > 60%",
                customer_ids=json.dumps([c.id for c in high_ltv]),
                estimated_customers=len(high_ltv),
                estimated_revenue=sum([c.total_spent for c in high_ltv]) * 0.2, # 20% recovery
                confidence_score=92,
                status='pending'
            )
            db.session.add(opp1)
            
        # Segment 2: Recent High Spenders
        recent_high = sorted([c for c in all_customers if c.churn_score < 0.3], key=lambda x: x.total_spent, reverse=True)[5:12]
        if recent_high:
            opp2 = AIAudienceOpportunity(
                segment_name="Loyal Expansion Candidates",
                reasoning="These customers have low churn risk and high total spend, indicating strong brand loyalty. They are prime targets for cross-selling premium products.",
                target_criteria="LTV > $1000 AND Churn Risk < 30%",
                customer_ids=json.dumps([c.id for c in recent_high]),
                estimated_customers=len(recent_high),
                estimated_revenue=sum([c.total_spent for c in recent_high]) * 0.15,
                confidence_score=88,
                status='pending'
            )
            db.session.add(opp2)
            
        # Segment 3: Needs Nurturing
        needs_nurturing = [c for c in all_customers if 0.4 <= c.churn_score <= 0.6][:8]
        if needs_nurturing:
            opp3 = AIAudienceOpportunity(
                segment_name="Mid-Risk Nurture Audience",
                reasoning="These customers are showing initial signs of disengagement but haven't fully churned. A gentle re-engagement campaign can push them back to active status.",
                target_criteria="Churn Risk between 40% and 60%",
                customer_ids=json.dumps([c.id for c in needs_nurturing]),
                estimated_customers=len(needs_nurturing),
                estimated_revenue=sum([c.total_spent for c in needs_nurturing]) * 0.1,
                confidence_score=75,
                status='pending'
            )
            db.session.add(opp3)
            
        db.session.commit()
        print("Successfully populated 3 AI Audience Opportunities.")

if __name__ == '__main__':
    fast_populate_segments()
