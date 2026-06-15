import os
from flask import Blueprint, jsonify, request
from app.models import db, Customer, Campaign, Segment, Order, Journey, JourneyNode, DeliveryEvent, CampaignAiInsight, CampaignMessage
from google import genai
import json
import requests
from datetime import datetime
from sqlalchemy import text

bp = Blueprint('api', __name__)
bp.strict_slashes = False

@bp.route('/auth/login', methods=['POST'])
def login():
    return jsonify({"access_token": "mock-jwt-token", "role": "Admin"})

@bp.route('/channel/send', methods=['POST'])
def channel_send():
    data = request.json
    return jsonify({"status": "DELIVERED", "event_id": "mock-event"})

from app.models import db, Customer, Campaign, Segment, Order, OrderItem, Journey, JourneyNode, DeliveryEvent, CustomerAction

@bp.route('/customers/<id>/action', methods=['POST'])
def execute_personal_action(id):
    data = request.json
    customer = Customer.query.get_or_404(id)
    
    expected_rev_raw = str(data.get('expected_recovery', '0'))
    import re
    numeric_str = re.sub(r'[^\d.]', '', expected_rev_raw)
    try:
        parsed_revenue = float(numeric_str) if numeric_str else 0.0
    except ValueError:
        parsed_revenue = 0.0

    # Create personal campaign
    camp = Campaign(
        name=f"1-to-1: {data.get('action_type', 'Action')} for {customer.first_name}",
        customer_id=id,
        type='personal',
        channels=data.get('channel', 'Email'),
        expected_revenue=parsed_revenue,
        status='Running'
    )
    db.session.add(camp)
    db.session.flush() # Get camp.id
    
    # Create delivery event
    event = DeliveryEvent(
        campaign_id=camp.id,
        customer_id=id,
        channel=data.get('channel', 'Email'),
        status='Pending'
    )
    db.session.add(event)
    
    # Create granular customer actions for timeline
    a1 = CustomerAction(customer_id=id, campaign_id=camp.id, action_type="AI recommended Recovery Campaign", status="Logged", channel=data.get('channel', 'Email'))
    a2 = CustomerAction(customer_id=id, campaign_id=camp.id, action_type="Campaign created", status="Logged", channel=data.get('channel', 'Email'))
    a3 = CustomerAction(customer_id=id, campaign_id=camp.id, action_type="Message queued", status="Logged", channel=data.get('channel', 'Email'))
    db.session.add_all([a1, a2, a3])
    db.session.commit()
    
    # Fire off to Channel Simulator (same loop as bulk campaigns)
    import threading
    def send_to_sim():
        payload = {
            "message_id": event.id,
            "customer_id": str(id),
            "campaign_id": str(camp.id),
            "recipient": customer.email,
            "channel": data.get('channel', 'Email').lower(),
            "content": data.get('message', 'Special offer just for you!')
        }
        try:
            requests.post(os.environ.get('CHANNEL_SERVICE_URL', 'http://localhost:5001') + '/send', json=payload, timeout=2)
        except Exception as e:
            print(f"Simulator call failed: {e}")
    threading.Thread(target=send_to_sim).start()
    
    return jsonify({"status": "success", "campaign_id": camp.id, "event_id": event.id}), 201

@bp.route('/customers/<id>/delivery-status', methods=['GET'])
def get_customer_delivery_status(id):
    """Returns the latest delivery event status for a customer's personal action."""
    # Get latest personal campaign event for this customer
    event = (
        db.session.query(DeliveryEvent)
        .join(Campaign, Campaign.id == DeliveryEvent.campaign_id)
        .filter(Campaign.customer_id == str(id), Campaign.type == 'personal')
        .order_by(DeliveryEvent.created_at.desc() if hasattr(DeliveryEvent, 'created_at') else DeliveryEvent.id.desc())
        .first()
    )
    if not event:
        return jsonify({"status": None}), 200
    
    status = event.status  # e.g. 'Pending', 'Delivered', 'Opened', 'Clicked', 'Purchased'
    return jsonify({
        "event_id": event.id,
        "campaign_id": event.campaign_id,
        "channel": event.channel,
        "status": status,
        "sent": status is not None,
        "delivered": status in ['Delivered', 'Opened', 'Clicked', 'Purchased'],
        "opened": status in ['Opened', 'Clicked', 'Purchased'],
        "clicked": status in ['Clicked', 'Purchased'],
        "purchased": status == 'Purchased',
        "redeemed": False,  # Reserved for future
    }), 200
@bp.route('/analytics', methods=['GET'])
def get_analytics():
    from sqlalchemy import func
    
    # === Delivery & Engagement ===
    total_events = DeliveryEvent.query.count()
    delivered = DeliveryEvent.query.filter(DeliveryEvent.status.in_(['Delivered', 'Opened', 'Clicked', 'Converted', 'Sent'])).count()
    opened = DeliveryEvent.query.filter(DeliveryEvent.status.in_(['Opened', 'Clicked', 'Converted'])).count()
    clicked = DeliveryEvent.query.filter(DeliveryEvent.status.in_(['Clicked', 'Converted'])).count()
    converted = DeliveryEvent.query.filter_by(status='Converted').count()
    failed = DeliveryEvent.query.filter_by(status='Failed').count()

    open_rate = round((opened / delivered * 100), 1) if delivered > 0 else 0
    ctr = round((clicked / opened * 100), 1) if opened > 0 else 0
    conversion_rate = round((converted / clicked * 100), 1) if clicked > 0 else 0

    # === Revenue ===
    total_revenue_row = db.session.execute(text("SELECT SUM(amount) FROM orders")).fetchone()
    total_revenue = float(total_revenue_row[0] or 0)

    # === Monthly Revenue (last 6 months) ===
    monthly_rows = db.session.execute(text("""
        SELECT TO_CHAR(order_date, 'Mon') as month, SUM(amount) as revenue, COUNT(*) as orders
        FROM orders
        WHERE order_date >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR(order_date, 'YYYY-MM'), TO_CHAR(order_date, 'Mon')
        ORDER BY TO_CHAR(order_date, 'YYYY-MM')
    """)).fetchall()
    monthly_revenue = [{"month": r[0], "revenue": round(float(r[1] or 0)), "orders": r[2]} for r in monthly_rows]

    # === Campaign Stats ===
    total_campaigns = Campaign.query.count()
    running_campaigns = Campaign.query.filter_by(status='Running').count()
    completed_campaigns = Campaign.query.filter_by(status='Completed').count()
    draft_campaigns = Campaign.query.filter_by(status='Draft').count()

    # === Top Campaigns ===
    top_campaigns_raw = db.session.execute(text("""
        SELECT c.name, c.channels, c.status, c.open_count, c.click_count, c.expected_revenue
        FROM campaigns c
        ORDER BY c.open_count DESC
        LIMIT 5
    """)).fetchall()
    top_campaigns = [{"name": r[0], "channel": r[1] or "Email", "status": r[2], "opens": r[3] or 0, "clicks": r[4] or 0, "revenue": float(r[5] or 0)} for r in top_campaigns_raw]

    # === Channel Performance ===
    channel_rows = db.session.execute(text("""
        SELECT channel, COUNT(*) as total,
               SUM(CASE WHEN status IN ('Opened','Clicked','Converted') THEN 1 ELSE 0 END) as opened,
               SUM(CASE WHEN status IN ('Clicked','Converted') THEN 1 ELSE 0 END) as clicked
        FROM delivery_events
        WHERE channel IS NOT NULL
        GROUP BY channel
    """)).fetchall()
    channel_performance = [{"channel": r[0], "sent": r[1], "opened": r[2], "clicked": r[3],
                             "open_rate": round(r[2]/r[1]*100, 1) if r[1] > 0 else 0,
                             "ctr": round(r[3]/r[1]*100, 1) if r[1] > 0 else 0} for r in channel_rows]

    # === Customer Metrics ===
    total_customers = Customer.query.count()
    high_churn_count = Customer.query.filter(Customer.churn_score > 0.7).count()
    new_customers_row = db.session.execute(text("SELECT COUNT(*) FROM customers WHERE created_at >= NOW() - INTERVAL '30 days'")).fetchone()
    new_customers = int(new_customers_row[0] or 0)

    # === Top Cities ===
    city_rows = db.session.execute(text("SELECT city, COUNT(*) as cnt FROM customers WHERE city IS NOT NULL GROUP BY city ORDER BY cnt DESC LIMIT 5")).fetchall()
    top_cities = [{"city": r[0], "count": r[1]} for r in city_rows]

    # === Audience Segments ===
    segment_count = Segment.query.count()

    return jsonify({
        "engagement": {
            "total_sent": total_events,
            "delivered": delivered,
            "opened": opened,
            "clicked": clicked,
            "converted": converted,
            "failed": failed,
            "open_rate": open_rate,
            "ctr": ctr,
            "conversion_rate": conversion_rate
        },
        "revenue": {
            "total": total_revenue,
            "monthly": monthly_revenue
        },
        "campaigns": {
            "total": total_campaigns,
            "running": running_campaigns,
            "completed": completed_campaigns,
            "draft": draft_campaigns,
            "top": top_campaigns
        },
        "channels": channel_performance,
        "customers": {
            "total": total_customers,
            "new_this_month": new_customers,
            "high_churn_risk": high_churn_count,
            "top_cities": top_cities
        },
        "segments": segment_count
    })

@bp.route('/ai/dashboard-insights', methods=['GET'])
def ai_dashboard_insights():
    from app.services.ai_service import ai_service
    try:
        return jsonify(ai_service.generate_dashboard_insights())
    except Exception as e:
        print(f"dashboard-insights error: {e}")
        return jsonify({"risk": {"count": 0, "revenue": 0}, "confidence": 0, "opportunities": []})


@bp.route('/ai/workspace-insights', methods=['GET'])
def ai_workspace_insights():
    from app.services.ai_service import ai_service
    try:
        return jsonify(ai_service.generate_workspace_insights())
    except Exception as e:
        print(f"workspace-insights error: {e}")
        return jsonify([])


@bp.route('/ai/audience-opportunities', methods=['GET'])
def ai_audience_opportunities():
    from app.models import AIAudienceOpportunity
    from app.services.ai_service import ai_service
    import threading
    
    opps = AIAudienceOpportunity.query.filter_by(status='pending').all()
    if not opps:
        try:
            ai_service.generate_audience_opportunities(limit=3)
            opps = AIAudienceOpportunity.query.filter_by(status='pending').all()
        except Exception as e:
            print(f"Error generating audience opportunities: {e}")
            pass


    from app.models import Customer
    result = []
    for o in opps:
        c_ids = json.loads(o.customer_ids) if o.customer_ids else []
        customers = Customer.query.filter(Customer.id.in_(c_ids)).all() if c_ids else []
        customer_data = [{"id": c.id, "name": f"{c.first_name} {c.last_name}", "total_spent": c.total_spent, "last_purchase_date": c.last_purchase_date, "churn_score": c.churn_score} for c in customers]
        result.append({
            "id": o.id,
            "segment_name": o.segment_name,
            "reasoning": o.reasoning,
            "target_criteria": o.target_criteria,
            "estimated_customers": o.estimated_customers,
            "estimated_revenue": o.estimated_revenue,
            "confidence_score": o.confidence_score,
            "customers": customer_data
        })
        
    return jsonify(result)

@bp.route('/ai/audience-opportunities/<id>/convert', methods=['POST'])
def convert_audience_opportunity(id):
    from app.models import AIAudienceOpportunity, Segment, db
    from app.services.ai_service import ai_service
    import threading
    
    opp = AIAudienceOpportunity.query.get_or_404(id)
    if opp.status == 'converted':
        return jsonify({"error": "Already converted"}), 400
        
    opp.status = 'converted'
    
    # We no longer ask AI to generate filters, we just use the customer_ids!
    customer_ids = json.loads(opp.customer_ids) if opp.customer_ids else []

    # Find or Create segment
    # Check if a segment with this exact name already exists (or same IDs)
    existing_segment = Segment.query.filter_by(name=opp.segment_name).first()

    if existing_segment:
        new_segment = existing_segment
    else:
        new_segment = Segment(
            name=opp.segment_name,
            description=opp.reasoning,
            is_ai=True,
            filters="[]" # Static segment, no dynamic filters
        )
        db.session.add(new_segment)
        # Add customers directly
        from app.models import Customer
        if customer_ids:
            customers = Customer.query.filter(Customer.id.in_(customer_ids)).all()
            new_segment.customers.extend(customers)
            
    db.session.commit()
            

    
    # Regenerate opportunities in background to maintain exactly 3
    remaining = AIAudienceOpportunity.query.filter_by(status='pending').count()
    if remaining < 3:
        def bg_regen(limit):
            from app import create_app
            app = create_app()
            with app.app_context():
                from app.services.ai_service import ai_service
                try:
                    ai_service.generate_audience_opportunities(limit=limit)
                except:
                    pass
                
        threading.Thread(target=bg_regen, args=(3 - remaining,)).start()
    
    return jsonify({"success": True, "segment_id": new_segment.id})
@bp.route('/ai/audience-opportunities/<id>/automate', methods=['POST'])
def automate_audience_opportunity(id):
    from app.models import AIAudienceOpportunity, Segment, Campaign, db
    from app.services.ai_service import ai_service
    import threading
    
    opp = AIAudienceOpportunity.query.get_or_404(id)
    if opp.status == 'converted':
        return jsonify({"error": "Already converted"}), 400
        
    opp.status = 'converted'
    
    # Use pre-generated customer_ids
    customer_ids = json.loads(opp.customer_ids) if opp.customer_ids else []
    
    # 1. Create or Find Segment
    existing_segment = Segment.query.filter_by(name=opp.segment_name).first()
    
    if existing_segment:
        new_segment = existing_segment
    else:
        new_segment = Segment(
            name=opp.segment_name,
            description=opp.reasoning,
            is_ai=True,
            filters="[]"
        )
        db.session.add(new_segment)
        
        # Add exact customers chosen by AI
        if customer_ids:
            from app.models import Customer
            customers = Customer.query.filter(Customer.id.in_(customer_ids)).all()
            new_segment.customers.extend(customers)
    
    # 2. Draft Campaign Template using AI
    try:
        content = ai_service.generate_campaign_content(opp.segment_name + " Campaign", opp.segment_name, opp.reasoning)
    except Exception:
        content = {
            "subject": f"Special Offer for {opp.segment_name}",
            "body": f"Hi {{first_name}},\n\nWe have a special offer tailored for you. Enjoy a discount on your next purchase!\n\nShop now.",
            "channels": ["Email"]
        }
        
    # 3. Create Campaign
    db.session.flush() # ensure new_segment has an id
    camp = Campaign(
        name=opp.segment_name + " Campaign",
        goal="Conversion",
        audience_id=new_segment.id,
        channels=", ".join(content.get("channels", ["Email"])),
        status="Draft",
        expected_revenue=opp.estimated_revenue
    )
    db.session.add(camp)
    db.session.commit()
    
    # Trigger Replenishment
    remaining = AIAudienceOpportunity.query.filter_by(status='pending').count()
    if remaining < 3:
        def bg_regen(limit):
            from app import create_app
            app = create_app()
            with app.app_context():
                from app.services.ai_service import ai_service
                try: ai_service.generate_audience_opportunities(limit=limit)
                except: pass
        threading.Thread(target=bg_regen, args=(3 - remaining,)).start()

    return jsonify({
        "success": True, 
        "campaign_id": camp.id, 
        "segment_id": new_segment.id
    })
@bp.route('/ai/segment/generate', methods=['POST'])
def ai_segment_generate():
    from app.services.ai_service import ai_service
    prompt = request.json.get('prompt', '')
    return jsonify(ai_service.generate_segment_from_prompt(prompt))

@bp.route('/ai/campaign/generate', methods=['POST'])
def ai_campaign_generate():
    from app.services.ai_service import ai_service
    prompt = request.json.get('prompt', '')
    try:
        res = ai_service.generate_campaign_from_prompt(prompt)
        return jsonify(res)
    except Exception as e:
        if '429' in str(e) or 'quota' in str(e).lower() or 'RESOURCE_EXHAUSTED' in str(e):
            return jsonify({"error": "AI Rate Limit Reached. Please wait a minute and try again."}), 429
        return jsonify({"error": str(e)}), 500

@bp.route('/ai/journey/generate', methods=['POST'])
def ai_journey_generate():
    from app.services.ai_service import ai_service
    prompt = request.json.get('prompt', '')
    res = ai_service.generate_journey_with_grok(prompt)
    if not res:
        return jsonify({"error": "AI Journey Generation Unavailable"}), 503
    return jsonify(res)

@bp.route('/campaigns/<id>/insights', methods=['GET'])
def get_campaign_insights(id):
    import os
    c = Campaign.query.get(id)
    if not c:
        return jsonify({
            'insights': ["This is a projected opportunity.", "Launch this campaign to start gathering real data.", "Expected performance is high based on similar past campaigns."],
            'next_best_action': "Launch Campaign",
            'expected_recovery': "TBD",
            'recommendations': {
                'campaign': "Review the generated content and launch.",
                'channel': "Use the suggested channels.",
                'audience': "Targets high-intent users."
            }
        })
    
    risk_breakdown = {"High Risk": 0, "Medium Risk": 0, "Low Risk": 0}
    top_cities = {}
    if c.audience:
        for cust in c.audience.customers:
            if cust.churn_score > 0.7:
                risk_breakdown["High Risk"] += 1
            elif cust.churn_score > 0.4:
                risk_breakdown["Medium Risk"] += 1
            else:
                risk_breakdown["Low Risk"] += 1
                
            city = cust.city or "Unknown"
            top_cities[city] = top_cities.get(city, 0) + 1
            
    sorted_cities = sorted([{"name": k, "count": v} for k, v in top_cities.items() if k != "Unknown"], key=lambda x: x["count"], reverse=True)[:3]
    
    # Check cache first
    cached_insight = CampaignAiInsight.query.filter_by(campaign_id=id).first()
    if cached_insight:
        try:
            recs = json.loads(cached_insight.recommendations_json) if cached_insight.recommendations_json else {}
            return jsonify({
                'insights': json.loads(cached_insight.insights_json) if cached_insight.insights_json else [],
                'next_best_action': cached_insight.next_best_action,
                'expected_recovery': cached_insight.expected_recovery,
                'recommendations': recs,
                'risk_breakdown': risk_breakdown,
                'top_cities': sorted_cities
            })
        except Exception as e:
            print("Error parsing cached insights:", e)
            pass # Fallthrough to regenerate if parsing fails
            
    # If no cache, generate new insights
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        print("Error: GEMINI_API_KEY is not set.")
        return jsonify({'error': 'AI insights unavailable'}), 200
        
    messages = DeliveryEvent.query.filter_by(campaign_id=id).all()
    sent = sum(1 for m in messages if m.status in ['Sent', 'Delivered', 'Opened', 'Clicked', 'Converted'])
    delivered = sum(1 for m in messages if m.status in ['Delivered', 'Opened', 'Clicked', 'Converted'])
    opened = sum(1 for m in messages if m.status in ['Opened', 'Clicked', 'Converted'])
    clicked = sum(1 for m in messages if m.status in ['Clicked', 'Converted'])
    converted = sum(1 for m in messages if m.status == 'Converted')
    revenue = c.expected_revenue or 0
    
    prompt = f"""
    Analyze the following marketing campaign and provide strategic insights and recommendations in JSON format.
    
    Campaign Name: {c.name}
    Goal: {c.goal}
    
    Metrics:
    - Sent: {sent}
    - Delivered: {delivered}
    - Opened: {opened}
    - Clicked: {clicked}
    - Converted (Purchased): {converted}
    - Revenue: {revenue}
    
    Return EXACTLY a JSON object with this structure (no markdown, just raw JSON). 
    CRITICAL: Keep all recommendations extremely concise, strictly 1-2 short sentences maximum. DO NOT write long paragraphs.
    {{
        "insights": ["insight 1", "insight 2", "insight 3", "insight 4"],
        "reasoning": "brief explanation",
        "confidence": 0.9,
        "next_best_action": "description of the next step",
        "expected_recovery": "₹...",
        "campaign_recommendations": "1-2 short sentences...",
        "channel_recommendations": "1-2 short sentences...",
        "audience_recommendations": "1-2 short sentences...",
        "follow_up_recommendation": {{
             "suggested_action": "e.g. Send Reminder Campaign",
             "expected_recovery": "₹21,000",
             "reasoning": "{opened - converted} customers opened but didn't purchase."
        }}
    }}
    """
    
    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={'system_instruction': "You are an expert marketing AI. Return only raw JSON without markdown formatting blocks.", 'temperature': 0.7}
        )
        
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        data = json.loads(response_text)
        
        # Save to database
        if cached_insight:
            db.session.delete(cached_insight)
            db.session.commit()
            
        new_insight = CampaignAiInsight(
            campaign_id=id,
            insights_json=json.dumps(data.get('insights', [])),
            next_best_action=data.get('next_best_action', ''),
            expected_recovery=str(data.get('expected_recovery', '')),
            recommendations_json=json.dumps({
                'campaign': data.get('campaign_recommendations', ''),
                'channel': data.get('channel_recommendations', ''),
                'audience': data.get('audience_recommendations', ''),
                'follow_up': data.get('follow_up_recommendation', {})
            })
        )
        db.session.add(new_insight)
        db.session.commit()
        
        return jsonify({
            'insights': data.get('insights', []),
            'next_best_action': data.get('next_best_action', ''),
            'expected_recovery': str(data.get('expected_recovery', '')),
            'recommendations': {
                'campaign': data.get('campaign_recommendations', ''),
                'channel': data.get('channel_recommendations', ''),
                'audience': data.get('audience_recommendations', ''),
                'follow_up': data.get('follow_up_recommendation', {})
            },
            'risk_breakdown': risk_breakdown,
            'top_cities': sorted_cities
        })
        
    except Exception as e:
        print("Error generating AI insights:", e)
        return jsonify({'error': 'AI insights unavailable'}), 200


@bp.route('/campaigns', methods=['GET'])
def list_campaigns():
    camp_type = request.args.get('type', 'bulk')
    campaigns = Campaign.query.filter_by(type=camp_type).order_by(Campaign.created_at.desc()).all()
    res = []
    for c in campaigns:
        # compute actual counts from delivery_events
        base_events = DeliveryEvent.query.filter_by(campaign_id=c.id)
        sent = base_events.count()
        delivered = base_events.filter(DeliveryEvent.status.in_(['Delivered', 'Opened', 'Clicked', 'Purchased'])).count()
        opened = base_events.filter(DeliveryEvent.status.in_(['Opened', 'Clicked', 'Purchased'])).count()
        clicked = base_events.filter(DeliveryEvent.status.in_(['Clicked', 'Purchased'])).count()
        purchased = base_events.filter(DeliveryEvent.status == 'Purchased').count()
        
        msg = CampaignMessage.query.filter_by(campaign_id=c.id).first()
        res.append({
            "id": c.id,
            "name": c.name,
            "audience": c.audience.name if c.audience else "No Audience",
            "audience_id": c.audience_id,
            "customer_id": c.customer_id,
            "type": c.type,
            "channels": c.channels,
            "status": c.status,
            "expected_revenue": c.expected_revenue,
            "reach": sent,
            "delivered": delivered,
            "opened": opened,
            "click_count": clicked,
            "purchased": purchased,
            "subject": "We Miss You ❤️",
            "message": msg.content if msg else None,
            "created_at": c.created_at.isoformat() if c.created_at else None
        })
    return jsonify(res)

@bp.route('/campaign-analytics', methods=['GET'])
def campaign_analytics():
    total_campaigns = Campaign.query.count()
    running_campaigns = Campaign.query.filter_by(status='Running').count()
    
    # In a real app we'd aggregate DeliveryEvents or Orders linked to campaigns
    # We will use mock aggregations for KPIs to simulate the Command Center
    
    from app.services.ai_service import ai_service
    ai_hero = ai_service.generate_campaign_studio_alert()
    
    return jsonify({
        "kpis": {
            "total_campaigns": total_campaigns,
            "running_campaigns": running_campaigns,
            "revenue_generated": 1245000,
            "avg_conversion_rate": 18.4,
            "roi": 4.8
        },
        "hero_alert": ai_hero,
        "channel_performance": [
            {"channel": "Email", "revenue": 420000, "ctr": 12.4},
            {"channel": "WhatsApp", "revenue": 610000, "ctr": 22.8},
            {"channel": "SMS", "revenue": 140000, "ctr": 8.2},
            {"channel": "Push", "revenue": 75000, "ctr": 5.1}
        ],
        "recommended_campaigns": [
            { "title": 'VIP Win-back Campaign', "aud": 'VIP Churn Risk', "opp": '24300' },
            { "title": 'Cross-Sell Jackets', "aud": 'Shoe Buyers', "opp": '18500' },
            { "title": 'Repurchase Reminder', "aud": 'Due For Repurchase', "opp": '12400' }
        ]
    })

@bp.route('/campaigns/<id>', methods=['GET'])
def get_campaign(id):
    c = Campaign.query.get_or_404(id)
    audience_members = []
    if c.audience:
        from datetime import datetime
        customers = c.audience.customers[:10]
        for cust in customers:
            risk = "High" if cust.churn_score > 0.7 else "Medium" if cust.churn_score > 0.4 else "Low"
            days_ago = (datetime.utcnow() - cust.last_purchase_date).days if cust.last_purchase_date else 0
            # Deterministic rule-based explanation to avoid LLM rate limits per row
            reason = f"✓ Total Spent: ${cust.total_spent or 0:.0f}\n✓ Last Active: {days_ago} days ago\n✓ Churn Risk: {risk}"
            audience_members.append({
                "id": cust.id,
                "name": f"{cust.first_name} {cust.last_name}",
                "ltv": float(cust.total_spent or 0),
                "last_order": f"{days_ago} days ago",
                "risk": risk,
                "reason": reason
            })
            
    base_events = DeliveryEvent.query.filter_by(campaign_id=c.id)
    sent = base_events.count()
    delivered = base_events.filter(DeliveryEvent.status.in_(['Delivered', 'Opened', 'Clicked', 'Purchased'])).count()
    opened = base_events.filter(DeliveryEvent.status.in_(['Opened', 'Clicked', 'Purchased'])).count()
    clicked = base_events.filter(DeliveryEvent.status.in_(['Clicked', 'Purchased'])).count()
    purchased = base_events.filter(DeliveryEvent.status == 'Purchased').count()
    
    msg = CampaignMessage.query.filter_by(campaign_id=c.id).first()
    
    return jsonify({
        "id": c.id,
        "name": c.name,
        "audience": c.audience.name if c.audience else "No Audience",
        "expected_revenue": c.expected_revenue,
        "status": c.status,
        "reach": sent,
        "delivered": delivered,
        "opened": opened,
        "clicked": clicked,
        "purchased": purchased,
        "subject": "We Miss You ❤️",
        "message": msg.content if msg else None,
        "audience_members": audience_members
    })

import random
from sqlalchemy import func

@bp.route('/campaigns', methods=['POST'])
def create_campaign():
    data = request.json
    camp = Campaign(
        name=data.get('name', 'Untitled Campaign'),
        audience_id=data.get('audience_id'),
        customer_id=data.get('customer_id'),
        type=data.get('type', 'bulk'),
        goal=data.get('goal'),
        channels=data.get('channels', 'Email'),
        expected_revenue=data.get('expected_revenue', 0.0),
        status=data.get('status', 'Draft')
    )
    db.session.add(camp)
    db.session.commit()
    
    if data.get('subject') or data.get('message'):
        msg = CampaignMessage(
            campaign_id=camp.id,
            channel=data.get('channels', 'Email'),
            content=data.get('message')
        )
        db.session.add(msg)
        db.session.commit()
        
    return jsonify({"id": camp.id, "status": "created"}), 201

@bp.route('/campaigns/<id>', methods=['PUT'])
def update_campaign(id):
    campaign = Campaign.query.get_or_404(id)
    data = request.json
    if 'status' in data:
        campaign.status = data['status']
    db.session.commit()
    return jsonify({"status": "updated"})

@bp.route('/campaigns/<id>', methods=['DELETE'])
def delete_campaign(id):
    campaign = Campaign.query.get_or_404(id)
    db.session.delete(campaign)
    db.session.commit()
    return jsonify({"status": "deleted"})

@bp.route('/campaigns/<id>/launch', methods=['POST'])
def launch_campaign(id):
    campaign = Campaign.query.get_or_404(id)
    if not campaign.audience_id:
        return jsonify({"error": "Campaign has no audience"}), 400
        
    segment = Segment.query.get(campaign.audience_id)
    if not segment:
        return jsonify({"error": "Audience not found"}), 404
        
    filters = json.loads(segment.filters) if segment.filters else []
    query_str, params = _build_segment_query(filters)
    
    result = db.session.execute(text(query_str), params).fetchall()
    customer_ids = [row.id for row in result]
    customers = Customer.query.filter(Customer.id.in_(customer_ids)).all() if customer_ids else []
    
    events = []
    for customer in customers:
        event = DeliveryEvent(
            campaign_id=campaign.id,
            customer_id=customer.id,
            channel=campaign.channels or 'Email',
            status='Pending'
        )
        events.append(event)
        
    db.session.add_all(events)
    campaign.status = 'Running'
    db.session.commit()
    
    events_data = [{"id": e.id, "email": c.email, "phone": c.phone, "customer_id": c.id, "campaign_id": campaign.id} for e, c in zip(events, customers)]
    def send_to_sim(events_list, channel, goal):
        for data in events_list:
            payload = {
                "message_id": data['id'],
                "customer_id": data['customer_id'],
                "campaign_id": data['campaign_id'],
                "recipient": data['phone'] if channel.lower() in ['whatsapp', 'sms'] else data['email'],
                "channel": channel.lower(),
                "content": goal or "Hello"
            }
            try:
                requests.post(os.environ.get('CHANNEL_SERVICE_URL', 'http://localhost:5001') + '/send', json=payload, timeout=2)
            except:
                pass

    import threading
    t = threading.Thread(target=send_to_sim, args=(events_data, campaign.channels or 'Email', campaign.goal))
    t.start()
    
    return jsonify({"status": "Launched", "events_generated": len(events)}), 200

@bp.route('/crm/webhook/event', methods=['POST'])
def crm_webhook_event():
    data = request.json
    message_id = data.get('message_id')
    event_status = data.get('event')
    if not message_id or not event_status:
        return jsonify({"error": "Missing payload"}), 400
        
    event = DeliveryEvent.query.get(message_id)
    if event:
        event.status = event_status
        
        # Log granular timeline event
        action_text = f"Message {event_status.lower()}"
        if event_status == 'Opened':
            action_text = "Customer opened message"
            if event.campaign: event.campaign.open_count = (event.campaign.open_count or 0) + 1
        elif event_status == 'Clicked':
            action_text = "Customer clicked offer"
            if event.campaign: event.campaign.click_count = (event.campaign.click_count or 0) + 1
        elif event_status == 'Purchased':
            action_text = "Customer purchased"
            if event.campaign: event.campaign.status = 'Completed'
            
        action = CustomerAction(customer_id=event.customer_id, campaign_id=event.campaign_id, action_type=action_text, status="Logged", channel=event.channel)
        db.session.add(action)
        db.session.commit()
    return jsonify({"status": "received"}), 200

@bp.route('/journeys', methods=['POST'])
def create_journey():
    data = request.json
    journey = Journey(
        name=data.get('name', 'Untitled Journey'),
        campaign_id=data.get('campaign_id'),
        customer_id=data.get('customer_id'),
        type=data.get('type', 'dynamic')
    )
    db.session.add(journey)
    db.session.commit()
    
    nodes = data.get('nodes', [])
    for n in nodes:
        node = JourneyNode(
            journey_id=journey.id, 
            type=n.get('type'), 
            config=json.dumps(n) # Store the entire JNode object
        )
        db.session.add(node)
    db.session.commit()
    
    return jsonify({"id": journey.id, "status": "draft"}), 201

@bp.route('/journeys', methods=['GET'])
def list_journeys():
    journeys = Journey.query.all()
    # To determine if active, we just return all for now. Frontend will filter or we assume all returned are the ones saved. 
    # Let's add a pseudo-status by checking if nodes have stats.
    res = []
    for j in journeys:
        nodes = [{"id": n.id, "type": n.type, "config": json.loads(n.config) if n.config else {}} for n in j.nodes]
        is_active = j.type == 'active' or any('stats' in n.get('config', {}) for n in nodes)
        # only return active journeys for the active tab (or frontend can use them)
        if is_active:
            res.append({
                "id": j.id,
                "name": j.name,
                "campaign_id": j.campaign_id,
                "status": "active",
                "nodes": nodes,
                "created_at": getattr(j, 'created_at', datetime.utcnow()).isoformat()
            })
    # Sort descending by id or created_at
    res.reverse()
    return jsonify(res), 200

@bp.route('/journeys/<id>/activate', methods=['POST'])
def activate_journey(id):
    from app.models import Campaign, Customer, DeliveryEvent
    import threading
    import requests
    
    journey = Journey.query.get_or_404(id)
    journey.type = 'active'
    db.session.commit()
            
    # Trigger simulation for top 50 customers to avoid overloading
    customers = Customer.query.limit(50).all()
    events = []
    for c in customers:
        event = DeliveryEvent(
            campaign_id=None,
            customer_id=c.id,
            channel='Email',
            status='Pending'
        )
        events.append(event)
    db.session.add_all(events)
    db.session.commit()
    
    events_data = [{"id": e.id, "email": c.email, "phone": c.phone, "customer_id": c.id, "campaign_id": None} for e, c in zip(events, customers)]
    
    def send_to_sim(events_list):
        for data in events_list:
            payload = {
                "message_id": data['id'],
                "customer_id": data['customer_id'],
                "campaign_id": data['campaign_id'],
                "recipient": data['email'],
                "channel": 'email',
                "content": "Journey Message"
            }
            try:
                requests.post(os.environ.get('CHANNEL_SERVICE_URL', 'http://localhost:5001') + '/send', json=payload, timeout=2)
            except:
                pass

    t = threading.Thread(target=send_to_sim, args=(events_data,))
    t.start()
    for node in journey.nodes:
        config_data = json.loads(node.config) if node.config else {}
        if 'stats' not in config_data:
            config_data['stats'] = {'sent': len(events), 'delivered': 0, 'opened': 0, 'clicked': 0}
            node.config = json.dumps(config_data)
    db.session.commit()
    
    return jsonify({"id": journey.id, "status": "active", "message": "Journey activated and simulation started."}), 200

@bp.route('/journeys/<id>', methods=['GET'])
def get_journey(id):
    journey = Journey.query.get_or_404(id)
    return jsonify({
        "id": journey.id,
        "name": journey.name,
        "campaign_id": journey.campaign_id,
        "nodes": [{"id": n.id, "type": n.type, "config": json.loads(n.config) if n.config else {}} for n in journey.nodes]
    })

@bp.route('/journeys/<id>/analytics', methods=['GET'])
def journey_analytics(id):
    from app.services.ai_service import ai_service
    from app.models import Campaign, DeliveryEvent, CustomerAction
    
    journey = Journey.query.get_or_404(id)
    if not journey.campaign_id:
        return jsonify({
            "metrics": { "revenue": 0, "recovered": 0, "conversion_rate": 0, "roi": 0 },
            "funnel": { "entered": 0, "sent": 0, "opened": 0, "clicked": 0, "purchased": 0 },
            "channel_performance": [],
            "cohorts": [],
            "step_performance": [],
            "ai_insights": {
                "summary": "This journey is not active yet.",
                "recommendations": ["Launch this journey to gather analytics data."]
            }
        })
        
    campaign = Campaign.query.get(journey.campaign_id)
    events = DeliveryEvent.query.filter_by(campaign_id=campaign.id).all() if campaign else []
    
    sent_count = len(events)
    opened_count = len([e for e in events if e.status in ['OPENED', 'CLICKED', 'CONVERTED']])
    clicked_count = len([e for e in events if e.status in ['CLICKED', 'CONVERTED']])
    purchased_count = len([e for e in events if e.status == 'PURCHASED'])
    
    # Simulation fallback if no real purchases
    if purchased_count == 0 and clicked_count > 0:
        purchased_count = int(clicked_count * 0.3)
        
    entered_count = sent_count + int(sent_count * 0.1) # Simulate some undelivered/suppressed
    if entered_count == 0:
        entered_count = 1247 # Mock base for unlaunched simulation demo
        sent_count = 1198
        opened_count = 867
        clicked_count = 534
        purchased_count = 823

    revenue = purchased_count * 125.50
    conversion_rate = (purchased_count / entered_count * 100) if entered_count > 0 else 0
    roi = round(revenue / (sent_count * 0.05 + 1), 1) if sent_count > 0 else 0
    
    stats = {
        "entered": entered_count,
        "sent": sent_count,
        "opened": opened_count,
        "clicked": clicked_count,
        "purchased": purchased_count,
        "revenue": revenue
    }
    
    ai_data = ai_service.generate_journey_analytics(journey.name, stats)
    
    return jsonify({
        "metrics": {
            "revenue": revenue,
            "recovered": purchased_count,
            "conversion_rate": round(conversion_rate, 1),
            "roi": roi
        },
        "funnel": stats,
        "channel_performance": [
            {"channel": "WhatsApp", "open_rate": "78%", "click_rate": "41%", "revenue": revenue * 0.7},
            {"channel": "Email", "open_rate": "46%", "click_rate": "19%", "revenue": revenue * 0.3}
        ],
        "cohorts": [
            {"name": "VIP Customers", "conversion": "74%"},
            {"name": "Recent Buyers", "conversion": "69%"},
            {"name": "High LTV Customers", "conversion": "63%"}
        ],
        "step_performance": [
            {"step": "Entry Trigger", "reached": entered_count, "success": "100%"},
            {"step": "AI Message", "reached": sent_count, "success": f"{round(sent_count/entered_count*100)}%" if entered_count else "0%"},
            {"step": "Wait 2 Days", "reached": opened_count, "success": f"{round(opened_count/sent_count*100)}%" if sent_count else "0%"},
            {"step": "Follow Up", "reached": clicked_count, "success": f"{round(clicked_count/opened_count*100)}%" if opened_count else "0%"},
            {"step": "Purchase", "reached": purchased_count, "success": f"{round(purchased_count/clicked_count*100)}%" if clicked_count else "0%"}
        ],
        "ai_insights": ai_data
    })

@bp.route('/journeys/<id>', methods=['DELETE'])
def delete_journey(id):
    journey = Journey.query.get_or_404(id)
    JourneyNode.query.filter_by(journey_id=journey.id).delete()
    db.session.delete(journey)
    db.session.commit()
    return jsonify({"message": "Journey deleted successfully"}), 200

@bp.route('/customers', methods=['GET'])
def list_customers():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 500, type=int)
    filter_type = request.args.get('filter', '')
    
    query = Customer.query

    # Apply Quick Filters
    if filter_type == 'high_risk':
        query = query.filter(Customer.churn_score > 0.7)
    elif filter_type == 'vip':
        query = query.filter(Customer.order_count > 5) # simple VIP definition
    elif filter_type == 'inactive':
        query = query.filter(Customer.last_purchase_date < text("NOW() - INTERVAL '60 days'"))
    elif filter_type == 'high_ltv':
        query = query.filter(Customer.total_spent > 1000)
    elif filter_type == 'recent':
        query = query.filter(Customer.last_purchase_date > text("NOW() - INTERVAL '30 days'"))

    # Calculate KPIs (simplified for performance, normally cached or aggregated)
    total_customers = Customer.query.count()
    high_risk_count = Customer.query.filter(Customer.churn_score > 0.7).count()
    
    avg_ltv_row = db.session.query(db.func.avg(Customer.total_spent)).scalar()
    avg_ltv = float(avg_ltv_row) if avg_ltv_row else 0.0

    rev_at_risk_row = db.session.query(db.func.sum(Customer.total_spent)).filter(Customer.churn_score > 0.7).scalar()
    rev_at_risk = float(rev_at_risk_row) if rev_at_risk_row else 0.0

    kpis = {
        "total_customers": total_customers,
        "high_risk": high_risk_count,
        "avg_ltv": avg_ltv,
        "revenue_at_risk": rev_at_risk
    }
    
    pagination = query.order_by(Customer.created_at.desc()).paginate(page=page, per_page=limit, error_out=False)
    
    customers_payload = []
    for c in pagination.items:
        last_action = CustomerAction.query.filter_by(customer_id=c.id).order_by(CustomerAction.created_at.desc()).first()
        status = 'Needs Action'
        action_date = None
        if last_action:
            status = f"{last_action.action_type} Sent" if last_action.action_type else 'Campaign Running'
            action_date = last_action.created_at.isoformat() if last_action.created_at else None
            
        customers_payload.append({
            "id": c.id,
            "first_name": c.first_name,
            "last_name": c.last_name,
            "email": c.email,
            "phone": c.phone,
            "city": c.city,
            "total_spent": c.total_spent,
            "order_count": c.order_count,
            "last_purchase_date": c.last_purchase_date.isoformat() if c.last_purchase_date else None,
            "churn_score": c.churn_score,
            "ai_recommendation": json.loads(c.ai_recommendation) if c.ai_recommendation else None,
            "current_status": status,
            "last_action_date": action_date
        })
    return jsonify({
        "kpis": kpis,
        "customers": customers_payload,
        "total": pagination.total,
        "pages": pagination.pages
    })

@bp.route('/customers/<id>/actions', methods=['GET'])
def get_customer_actions(id):
    actions = CustomerAction.query.filter_by(customer_id=id).order_by(CustomerAction.created_at.desc()).all()
    campaigns = Campaign.query.filter_by(customer_id=id).order_by(Campaign.created_at.desc()).all()
    events = DeliveryEvent.query.filter_by(customer_id=id).order_by(DeliveryEvent.created_at.desc()).all()
    journeys = Journey.query.filter_by(customer_id=id).order_by(Journey.created_at.desc()).all()
    
    last_action = actions[0].action_type if actions else None
    
    status = "Needs Action"
    if journeys:
        status = "Journey Active"
    elif last_action:
        status = f"{last_action} Sent"
    elif campaigns:
        status = "Campaign Running"
        
    return jsonify({
        "active_campaigns": [{"id": c.id, "name": c.name, "status": c.status} for c in campaigns],
        "journeys": [{"id": j.id, "name": j.name} for j in journeys],
        "delivery_events": [{"id": e.id, "channel": e.channel, "status": e.status, "date": e.created_at.isoformat() if e.created_at else None} for e in events],
        "last_action": last_action,
        "current_status": status
    })

@bp.route('/customers/<id>', methods=['GET'])
def get_customer(id):
    c = Customer.query.get_or_404(id)
    orders = Order.query.filter_by(customer_id=id).order_by(Order.order_date.desc()).limit(10).all()
    
    # Calculate derived health & segment metrics
    churn_prob = c.churn_score or 0.0
    health_score = int(100 - (churn_prob * 100))
    # Bump health score slightly if they have high LTV
    if c.total_spent and c.total_spent > 2000:
        health_score = min(100, health_score + 10)
        
    status = "Healthy" if health_score >= 70 else "At Risk" if health_score >= 40 else "High Risk"
    
    actions = CustomerAction.query.filter_by(customer_id=id).order_by(CustomerAction.created_at.desc()).limit(30).all()
    
    timeline_raw = []
    for o in orders:
        timeline_raw.append({
            "date": o.order_date.isoformat() if o.order_date else None,
            "raw_date": o.order_date,
            "action": f"Placed order {o.order_number} for ${o.amount}",
            "type": "purchase"
        })
    for a in actions:
        timeline_raw.append({
            "date": a.created_at.isoformat() if a.created_at else None,
            "raw_date": a.created_at,
            "action": a.action_type,
            "type": "engagement"
        })
    
    timeline_raw.sort(key=lambda x: x['raw_date'].timestamp() if x['raw_date'] else 0, reverse=True)
    timeline = [{"date": x['date'], "action": x['action'], "type": x['type']} for x in timeline_raw]
    
    campaign_engagement = []
    campaign_map = {}
    events = DeliveryEvent.query.filter_by(customer_id=id).all()
    for e in events:
        if e.campaign_id not in campaign_map:
            campaign_map[e.campaign_id] = {
                "campaign": e.campaign.name if e.campaign else "Unknown",
                "sent": False,
                "opened": False,
                "clicked": False,
                "converted": False,
                "revenue": 0
            }
        c_map = campaign_map[e.campaign_id]
        st = e.status.upper() if e.status else ""
        if st in ['PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'CONVERTED', 'PURCHASED']:
            c_map['sent'] = True
        if st in ['DELIVERED', 'OPENED', 'CLICKED', 'CONVERTED', 'PURCHASED']:
            c_map['delivered'] = True
        if st in ['OPENED', 'CLICKED', 'CONVERTED', 'PURCHASED']:
            c_map['opened'] = True
        if st in ['CLICKED', 'CONVERTED', 'PURCHASED']:
            c_map['clicked'] = True
        if st in ['CONVERTED', 'PURCHASED']:
            c_map['converted'] = True
            c_map['revenue'] += 50
            
    campaign_engagement = list(campaign_map.values())
    
    recent_orders = []
    for o in orders:
        recent_orders.append({
            "id": o.id,
            "order_number": o.order_number,
            "amount": o.amount,
            "order_date": o.order_date.isoformat() if o.order_date else None,
            "status": o.status,
            "products": ", ".join([item.product_name for item in o.items]) if o.items else "Unknown",
            "category": o.items[0].category if o.items and o.items[0].category else "General"
        })

    
    if c.order_count > 5 and c.total_spent and c.total_spent > 1500:
        customer_type = "VIP Repeat Buyer"
        segment = "High LTV Customers"
    elif c.order_count > 1:
        customer_type = "Repeat Buyer"
        segment = "Active Customers"
    else:
        customer_type = "One-Time Buyer"
        segment = "Needs Nurturing"
        
    # Dynamic AI Insight based on churn risk
    if churn_prob > 0.7:
        ai_insight = {
            "title": "High probability of churn detected",
            "action": "Generate Win-back Offer",
            "desc": "This customer hasn't purchased recently. Send a 20% discount to win them back.",
            "expected_revenue": 150,
            "confidence": "88%"
        }
    elif churn_prob > 0.4:
        ai_insight = {
            "title": "Purchase frequency dropping",
            "action": "Recommend Cross-sell Offer",
            "desc": "Based on past purchases, they are likely to buy accessories. Send a personalized recommendation.",
            "expected_revenue": 80,
            "confidence": "75%"
        }
    else:
        ai_insight = {
            "title": "Customer is highly engaged",
            "action": "Launch VIP Early Access Campaign",
            "desc": "Reward loyalty with early access to the upcoming collection. High likelihood to convert.",
            "expected_revenue": 320,
            "confidence": "91%"
        }

    return jsonify({
        "customer": {
            "id": c.id,
            "first_name": c.first_name,
            "last_name": c.last_name,
            "email": c.email,
            "phone": c.phone,
            "city": c.city,
            "total_spent": c.total_spent,
            "order_count": c.order_count,
            "last_purchase_date": c.last_purchase_date.isoformat() if c.last_purchase_date else None,
            "churn_score": churn_prob,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            
            # New 360 data
            "health_score": health_score,
            "status": status,
            "customer_type": customer_type,
            "segment": segment,
            "purchase_preferences": [
                {"category": "Fashion", "percentage": 60},
                {"category": "Shoes", "percentage": 25},
                {"category": "Accessories", "percentage": 15}
            ],
            "engagement_metrics": {
                "emails_sent": len([e for e in events if e.channel and e.channel.lower() == 'email']),
                "open_rate": "58%",
                "click_rate": "14%",
                "whatsapp_opens": len([e for e in events if e.channel and e.channel.lower() == 'whatsapp' and e.status in ['Opened', 'Clicked']]),
                "revenue_generated": customer_type
            },
            "timeline": timeline,
            "campaign_engagement": campaign_engagement,
            "ai_insight": ai_insight
        },
        "recent_orders": recent_orders
    })

@bp.route('/orders', methods=['GET'])
def list_orders():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 50, type=int)
    
    query = Order.query.join(Customer).order_by(Order.order_date.desc())
    
    # Simple filters
    customer_name = request.args.get('customer')
    if customer_name:
        query = query.filter(Customer.first_name.ilike(f"%{customer_name}%") | Customer.last_name.ilike(f"%{customer_name}%"))
        
    min_value = request.args.get('min_value', type=float)
    if min_value is not None:
        query = query.filter(Order.amount >= min_value)
        
    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    
    # Calculate KPIs
    total_orders = Order.query.count()
    revenue_row = db.session.query(db.func.sum(Order.amount)).scalar()
    revenue_generated = float(revenue_row) if revenue_row else 0.0
    
    avg_order_value = revenue_generated / total_orders if total_orders > 0 else 0.0
    
    # Repeat purchase rate mock calculation (e.g. customers with >1 order / total customers)
    total_customers = Customer.query.count()
    repeat_customers = Customer.query.filter(Customer.order_count > 1).count()
    repeat_purchase_rate = (repeat_customers / total_customers * 100) if total_customers > 0 else 0.0

    kpis = {
        "total_orders": total_orders,
        "revenue_generated": revenue_generated,
        "average_order_value": avg_order_value,
        "repeat_purchase_rate": repeat_purchase_rate
    }
    
    # Real Insights & Trends
    most_purchased_row = db.session.query(OrderItem.product_name, db.func.sum(OrderItem.quantity)).group_by(OrderItem.product_name).order_by(db.func.sum(OrderItem.quantity).desc()).first()
    most_purchased_product = most_purchased_row[0] if most_purchased_row else "N/A"

    highest_repeat_row = db.session.query(OrderItem.category, db.func.sum(OrderItem.quantity)).join(Order).join(Customer).filter(Customer.order_count > 1).group_by(OrderItem.category).order_by(db.func.sum(OrderItem.quantity).desc()).first()
    highest_repeat_category = highest_repeat_row[0] if highest_repeat_row else "N/A"
    
    due_for_repurchase = Customer.query.filter(Customer.last_purchase_date < text("NOW() - INTERVAL '60 days'"), Customer.order_count > 0).count()
    
    insights = {
        "cross_sell": "Customers who purchased Shoes have a 42% chance of purchasing Jackets.",
        "recent_buyers": Customer.query.filter(Customer.last_purchase_date > text("NOW() - INTERVAL '30 days'")).count(),
        "one_time_buyers": Customer.query.filter(Customer.order_count == 1).count(),
        "potential_recovery_revenue": due_for_repurchase * avg_order_value,
        "most_purchased_product": most_purchased_product,
        "highest_repeat_category": highest_repeat_category,
        "avg_gap_days": 28, # Default heuristic
        "due_for_repurchase": due_for_repurchase
    }
    
    return jsonify({
        "kpis": kpis,
        "insights": insights,
        "orders": [{
            "id": o.id,
            "order_number": o.order_number,
            "customer_name": f"{o.customer.first_name} {o.customer.last_name}",
            "amount": o.amount,
            "order_date": o.order_date.isoformat() if o.order_date else None,
            "status": o.status,
            "items": [item.product_name for item in o.items]
        } for o in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages
    })

@bp.route('/purchase-insights', methods=['GET'])
def get_purchase_insights():
    # Top Products
    top_products_rows = db.session.query(OrderItem.product_name, db.func.sum(OrderItem.quantity), db.func.sum(OrderItem.price * OrderItem.quantity)).group_by(OrderItem.product_name).order_by(db.func.sum(OrderItem.quantity).desc()).limit(5).all()
    top_products = [{"name": row[0], "orders": row[1] or 0, "revenue": row[2] or 0.0} for row in top_products_rows]

    # Top Categories
    top_categories_rows = db.session.query(OrderItem.category, db.func.sum(OrderItem.price * OrderItem.quantity)).group_by(OrderItem.category).order_by(db.func.sum(OrderItem.price * OrderItem.quantity).desc()).limit(5).all()
    total_revenue_row = db.session.query(db.func.sum(Order.amount)).scalar()
    total_revenue = float(total_revenue_row) if total_revenue_row else 1.0
    top_categories = [{"name": row[0], "revenue": row[1] or 0.0, "share": ((row[1] or 0) / total_revenue) * 100} for row in top_categories_rows]

    # Revenue Trends (Group by Month)
    trend_rows = db.session.query(
        db.func.to_char(Order.order_date, 'YYYY-MM').label('month'),
        db.func.sum(Order.amount).label('revenue')
    ).group_by('month').order_by('month').limit(12).all()
    
    revenue_trends = [{"month": row[0], "revenue": row[1] or 0.0} for row in trend_rows]

    # Customer Buying Behavior
    total_customers = Customer.query.count()
    one_time_buyers = Customer.query.filter(Customer.order_count == 1).count()
    repeat_buyers = Customer.query.filter(Customer.order_count > 1).count()
    vip_buyers = Customer.query.filter(Customer.total_spent > 1000).count()
    
    # Repurchase Analysis
    due_for_repurchase = Customer.query.filter(Customer.last_purchase_date < text("NOW() - INTERVAL '60 days'"), Customer.order_count > 0).count()
    avg_purchase_gap = 28 # We can keep it mocked or calculate if needed

    return jsonify({
        "top_products": top_products,
        "top_categories": top_categories,
        "revenue_trends": revenue_trends,
        "customer_behavior": {
            "total_customers": total_customers,
            "one_time_buyers": one_time_buyers,
            "repeat_buyers": repeat_buyers,
            "vip_buyers": vip_buyers
        },
        "repurchase_analysis": {
            "avg_purchase_gap": avg_purchase_gap,
            "due_for_repurchase": due_for_repurchase,
            "at_risk_of_churn": Customer.query.filter(Customer.churn_score > 0.7).count()
        }
    })

@bp.route('/segments', methods=['GET'])
def list_segments():
    from app.models import AIAudienceOpportunity
    segments = Segment.query.filter(Segment.status != 'archived').order_by(Segment.created_at.desc()).all()
    ai_opp_names = set([o.segment_name for o in AIAudienceOpportunity.query.all() if o.segment_name])
    
    return jsonify([{
        "id": s.id,
        "name": s.name,
        "description": s.description,
        "filters": json.loads(s.filters) if s.filters else [],
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "updated_at": s.updated_at.isoformat() if s.updated_at else (s.created_at.isoformat() if s.created_at else None),
        "status": s.status,
        "count": len(s.customers) if s.customers else 0,
        "is_ai": s.is_ai
    } for s in segments])

@bp.route('/segments', methods=['POST'])
def create_segment():
    data = request.json
    filters = data.get('filters', [])
    seg = Segment(
        name=data.get('name', 'Untitled Audience'),
        description=data.get('description', ''),
        filters=json.dumps(filters),
        status='active'
    )
    db.session.add(seg)
    
    query_str, params = _build_segment_query(filters)
    result = db.session.execute(text(query_str), params).fetchall()
    customer_ids = [row.id for row in result]
    if customer_ids:
        customers = Customer.query.filter(Customer.id.in_(customer_ids)).all()
        seg.customers.extend(customers)
        
    db.session.commit()
    return jsonify({"id": seg.id, "status": "created"}), 201

@bp.route('/segments/<id>', methods=['GET'])
def get_segment(id):
    seg = Segment.query.get(id)
    if not seg:
        return jsonify({"error": "Not found"}), 404
        
    # Calculate revenue
    revenue = sum([c.total_spent for c in seg.customers]) if seg.customers else 0
    
    return jsonify({
        "id": seg.id,
        "name": seg.name,
        "description": seg.description,
        "filters": json.loads(seg.filters) if seg.filters else [],
        "created_at": seg.created_at.isoformat() if seg.created_at else None,
        "updated_at": seg.updated_at.isoformat() if seg.updated_at else None,
        "status": seg.status,
        "count": len(seg.customers) if seg.customers else 0,
        "revenue": revenue,
        "customers": [
            {
                "id": c.id, "first_name": c.first_name, "last_name": c.last_name, 
                "email": c.email, "city": c.city, "total_spent": c.total_spent, 
                "churn_score": c.churn_score, "last_purchase_date": c.last_purchase_date.isoformat() if c.last_purchase_date else None
            } for c in seg.customers
        ] if seg.customers else []
    })

@bp.route('/segments/<id>', methods=['PUT'])
def update_segment(id):
    seg = Segment.query.get(id)
    if not seg:
        return jsonify({"error": "Not found"}), 404
    data = request.json
    if 'name' in data: seg.name = data['name']
    if 'description' in data: seg.description = data['description']
    if 'filters' in data: 
        filters = data['filters']
        seg.filters = json.dumps(filters)
        query_str, params = _build_segment_query(filters)
        result = db.session.execute(text(query_str), params).fetchall()
        customer_ids = [row.id for row in result]
        seg.customers = Customer.query.filter(Customer.id.in_(customer_ids)).all() if customer_ids else []
        
    seg.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({"id": seg.id, "status": "updated"})

@bp.route('/segments/<id>/archive', methods=['POST'])
def archive_segment(id):
    seg = Segment.query.get(id)
    if not seg:
        return jsonify({"error": "Not found"}), 404
    seg.status = 'archived'
    db.session.commit()
    return jsonify({"status": "archived"})

@bp.route('/segments/<id>/duplicate', methods=['POST'])
def duplicate_segment(id):
    seg = Segment.query.get(id)
    if not seg:
        return jsonify({"error": "Not found"}), 404
    new_seg = Segment(
        name=seg.name + " Copy",
        description=seg.description,
        filters=seg.filters,
        status='active'
    )
    db.session.add(new_seg)
    db.session.commit()
    return jsonify({"id": new_seg.id, "status": "duplicated"}), 201

@bp.route('/segments/<id>/refresh', methods=['POST'])
def refresh_segment(id):
    seg = Segment.query.get(id)
    if not seg:
        return jsonify({"error": "Not found"}), 404
    seg.updated_at = datetime.utcnow()
    
    filters = json.loads(seg.filters) if seg.filters else []
    query_str, params = _build_segment_query(filters)
    result = db.session.execute(text(query_str), params).fetchall()
    customer_ids = [row.id for row in result]
    seg.customers = Customer.query.filter(Customer.id.in_(customer_ids)).all() if customer_ids else []
    
    db.session.commit()
    return jsonify({"status": "refreshed"})

def _build_segment_query(filters):
    conditions = []
    params = {}
    
    if not isinstance(filters, list):
        filters = []
        
    # We expect filters as a list of rules like {"field": "city", "operator": "equals", "value": "New York"}
    for idx, rule in enumerate(filters):
        if not isinstance(rule, dict):
            continue
        field = rule.get('field')
        op = rule.get('operator')
        val = rule.get('value')
        
        param_name = f"p{idx}"
        params[param_name] = val
        
        if field == 'city':
            if op == 'equals': conditions.append(f"city = :{param_name}")
            elif op == 'not_equals': conditions.append(f"city != :{param_name}")
        elif field == 'total_spent':
            if op == 'greater_than': conditions.append(f"total_spent > :{param_name}")
            elif op == 'less_than': conditions.append(f"total_spent < :{param_name}")
        elif field == 'order_count':
            if op == 'greater_than': conditions.append(f"order_count > :{param_name}")
            elif op == 'less_than': conditions.append(f"order_count < :{param_name}")
            elif op == 'equals': conditions.append(f"order_count = :{param_name}")
        elif field == 'last_purchase_days':
            # e.g. last_purchase_days greater_than 60 means last_purchase_date < today - 60 days
            if op in ['greater_than', 'greater_than_days']: conditions.append(f"last_purchase_date < NOW() - INTERVAL '{val} days'")
            elif op in ['less_than', 'less_than_days']: conditions.append(f"last_purchase_date > NOW() - INTERVAL '{val} days'")
        elif field == 'churn_score':
            if op == 'greater_than': conditions.append(f"churn_score > :{param_name}")
            elif op == 'less_than': conditions.append(f"churn_score < :{param_name}")
            
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    query = f"SELECT * FROM customers WHERE {where_clause}"
    return query, params

@bp.route('/segments/preview', methods=['POST'])
def preview_segment():
    filters = request.json.get('filters', [])
    query_str, params = _build_segment_query(filters)
    
    # Execute raw SQL
    result = db.session.execute(text(query_str), params).fetchall()
    
    # Convert to list of dicts (limited to 5 for preview)
    matching_customers = []
    total_revenue = 0.0
    for row in result:
        total_revenue += row.total_spent or 0.0
        if len(matching_customers) < 50:
            matching_customers.append({
                "id": row.id,
                "first_name": row.first_name,
                "last_name": row.last_name,
                "email": row.email,
                "city": row.city,
                "total_spent": row.total_spent,
                "churn_score": row.churn_score,
                "last_purchase_date": row.last_purchase_date if row.last_purchase_date else None
            })
            
    return jsonify({
        "count": len(result),
        "potential_revenue": total_revenue,
        "preview": matching_customers
    })

@bp.route('/segments/ai-generate', methods=['POST'])
def ai_generate_segment():
    prompt = request.json.get('prompt', '').lower()
    
    # Mock AI Rule generation based on prompt heuristics
    filters = []
    if "5000" in prompt or "5,000" in prompt:
        filters.append({"field": "total_spent", "operator": "greater_than", "value": 5000})
    if "60 days" in prompt:
        filters.append({"field": "last_purchase_days", "operator": "greater_than", "value": 60})
    if "new york" in prompt:
        filters.append({"field": "city", "operator": "equals", "value": "New York"})
    if "churn" in prompt:
        filters.append({"field": "churn_score", "operator": "greater_than", "value": 0.7})
    if "repeat" in prompt or "more than 3" in prompt:
        filters.append({"field": "order_count", "operator": "greater_than", "value": 3})
        
    return jsonify({"filters": filters})

@bp.route('/retention-analytics', methods=['GET'])
def get_retention_analytics():
    total_customers = Customer.query.count()
    
    # Calculate Risk Segments
    high_risk_customers = Customer.query.filter(Customer.churn_score > 0.7).all()
    high_risk_count = len(high_risk_customers)
    
    medium_risk_count = Customer.query.filter(Customer.churn_score > 0.4, Customer.churn_score <= 0.7).count()
    low_risk_count = Customer.query.filter(Customer.churn_score <= 0.4).count()
    
    revenue_at_risk = sum([c.total_spent for c in high_risk_customers if c.total_spent])
    recoverable_revenue = revenue_at_risk * 0.15 # 15% estimated recovery rate
    
    predicted_churn_rate = (high_risk_count / total_customers * 100) if total_customers > 0 else 0
    
    # Sort top high risk
    top_high_risk = sorted(high_risk_customers, key=lambda c: c.churn_score, reverse=True)[:20]
    
    # Mock Churn Trend
    churn_trend = [
        {"month": "January", "rate": 8},
        {"month": "February", "rate": 10},
        {"month": "March", "rate": 12},
        {"month": "April", "rate": 15},
        {"month": "May", "rate": 18}
    ]
    
    # Mock Churn Drivers
    churn_drivers = [
        {"reason": "No purchase in 60+ days", "percentage": 62},
        {"reason": "Declining email engagement", "percentage": 48},
        {"reason": "Lower order frequency", "percentage": 35},
        {"reason": "No website visits recently", "percentage": 28}
    ]
    
    from app.services.ai_service import ai_service
    ai_hero_alert = ai_service.generate_retention_alert(high_risk_count, revenue_at_risk)
    
    return jsonify({
        "kpis": {
            "high_risk_customers": high_risk_count,
            "revenue_at_risk": revenue_at_risk,
            "predicted_churn_rate": predicted_churn_rate,
            "recoverable_revenue": recoverable_revenue
        },
        "distribution": {
            "high_risk": high_risk_count,
            "medium_risk": medium_risk_count,
            "low_risk": low_risk_count
        },
        "trend": churn_trend,
        "drivers": churn_drivers,
        "hero_alert": ai_hero_alert,
        "opportunities": [
            {
                "title": "VIP Customers At Risk",
                "customers": 42,
                "revenue_at_risk": 120000,
                "expected_recovery": 35000,
                "confidence": 94,
                "action": "20% Discount via WhatsApp"
            },
            {
                "title": "One-Time Buyers At Risk",
                "customers": 65,
                "revenue_at_risk": 8000,
                "expected_recovery": 1200,
                "confidence": 85,
                "action": "Nurture Email Sequence"
            }
        ],
        "segments": [
            "VIP Churn Risk",
            "Inactive 60+ Days",
            "Lost Customers",
            "At-Risk Repeat Buyers",
            "Low Engagement Customers"
        ],
        "top_high_risk": [{
            "id": c.id,
            "name": f"{c.first_name} {c.last_name}",
            "last_purchase": c.last_purchase_date.isoformat() if c.last_purchase_date else None,
            "ltv": c.total_spent,
            "risk_score": c.churn_score,
            "revenue_at_risk": c.total_spent,
            "ai_action": "Launch Win-back" if c.total_spent > 1000 else "Send Discount"
        } for c in top_high_risk]
    })

@bp.route('/value-analytics', methods=['GET'])
def get_value_analytics():
    total_customers = Customer.query.count()
    
    all_customers = Customer.query.filter(Customer.total_spent > 0).all()
    total_revenue = sum([c.total_spent for c in all_customers if c.total_spent])
    
    vip_threshold = 2000
    vip_customers = [c for c in all_customers if c.total_spent and c.total_spent >= vip_threshold]
    vip_count = len(vip_customers)
    vip_revenue = sum([c.total_spent for c in vip_customers])
    
    medium_customers = [c for c in all_customers if c.total_spent and c.total_spent >= 500 and c.total_spent < vip_threshold]
    medium_count = len(medium_customers)
    medium_revenue = sum([c.total_spent for c in medium_customers])

    low_customers = [c for c in all_customers if c.total_spent and c.total_spent < 500]
    low_count = len(low_customers)
    low_revenue = sum([c.total_spent for c in low_customers])
    
    avg_ltv = total_revenue / total_customers if total_customers > 0 else 0
    vip_revenue_contribution = (vip_revenue / total_revenue * 100) if total_revenue > 0 else 0
    
    from app.services.ai_service import ai_service
    ai_data = ai_service.generate_value_analytics(
        total_revenue, total_customers, vip_count, vip_revenue, medium_count, medium_revenue, low_count, low_revenue
    )

    top_revenue_customers = sorted(vip_customers, key=lambda c: c.total_spent, reverse=True)[:20]
    
    try:
        top_insights = ai_service.generate_top_customers_insights(top_revenue_customers)
        insights_map = {item['id']: item for item in top_insights}
    except Exception as e:
        insights_map = {}
        
    top_customers_response = []
    for c in top_revenue_customers:
        insight = insights_map.get(c.id, {})
        top_customers_response.append({
            "id": c.id,
            "name": f"{c.first_name} {c.last_name}",
            "ltv": c.total_spent,
            "orders": c.order_count,
            "last_purchase": c.last_purchase_date.isoformat() if c.last_purchase_date else None,
            "future_value": insight.get("future_value", c.total_spent * 1.3),
            "ai_action": insight.get("ai_action", "Review Account")
        })
        
    return jsonify({
        "kpis": {
            "total_customer_value": total_revenue,
            "avg_ltv": avg_ltv,
            "high_value_customers": vip_count,
            "vip_revenue_contribution": vip_revenue_contribution
        },
        "hero_alert": ai_data.get("hero_alert", {}),
        "distribution": {
            "high_value": vip_count,
            "medium_value": medium_count,
            "low_value": low_count
        },
        "segments": ai_data.get("segments", []),
        "growth_opportunities": ai_data.get("growth_opportunities", []),
        "top_customers": top_customers_response
    })

@bp.route('/audiences', methods=['GET'])
def get_audiences_hub():
    from app.services.ai_service import ai_service
    ai_hero = ai_service.generate_audience_hub_alert()
    
    return jsonify({
        "kpis": {
            "total_audiences": 24,
            "total_reach": 18450,
            "active_campaign_audiences": 12,
            "revenue_influenced": 1245000,
            "ai_suggested_audiences": 8
        },
        "hero_ai": ai_hero,
        "lifecycle_funnel": [
            { "stage": "Total Customers", "count": 500, "conversion": None },
            { "stage": "Segmented Customers", "count": 420, "conversion": 84 },
            { "stage": "Campaign Targeted", "count": 280, "conversion": 66 },
            { "stage": "Converted", "count": 126, "conversion": 45 }
        ],
        "relationships": [
            {
                "parent": "VIP Customers",
                "children": ["VIP Churn Risk", "VIP Active Buyers", "VIP Loyalty Members"]
            },
            {
                "parent": "Shoes Buyers",
                "children": ["High Spend Shoes Buyers", "Repeat Shoes Buyers", "Inactive Shoes Buyers"]
            }
        ],
        "leaderboard": [
            { "rank": 1, "name": "VIP Customers", "revenue": 825000 },
            { "rank": 2, "name": "High LTV Customers", "revenue": 620000 },
            { "rank": 3, "name": "Shoes Buyers", "revenue": 490000 }
        ],
        "categories": {
            "Behavioral": [
                { "name": "Inactive Customers", "count": 142, "health_score": 41, "status": "At Risk", "revenue": 45000, "campaigns": 3 },
                { "name": "Recent Buyers", "count": 128, "health_score": 85, "status": "Healthy", "revenue": 64000, "campaigns": 5 },
                { "name": "Repeat Buyers", "count": 178, "health_score": 88, "status": "Growing", "revenue": 142000, "campaigns": 8 }
            ],
            "Value-Based": [
                { "name": "VIP Customers", "count": 86, "health_score": 92, "status": "Growing", "revenue": 825000, "campaigns": 12 },
                { "name": "High LTV Customers", "count": 142, "health_score": 85, "status": "Stable", "revenue": 620000, "campaigns": 9 },
                { "name": "Growing Customers", "count": 78, "health_score": 89, "status": "Growing", "revenue": 115000, "campaigns": 4 }
            ],
            "Product-Based": [
                { "name": "Shoes Buyers", "count": 310, "health_score": 78, "status": "Stable", "revenue": 490000, "campaigns": 7 },
                { "name": "Jacket Buyers", "count": 145, "health_score": 72, "status": "Stable", "revenue": 210000, "campaigns": 4 }
            ]
        },
        "table_data": [
            { "name": "VIP Customers", "type": "Value", "count": 86, "revenue_potential": 35000, "campaigns": 12, "created_by": "System", "status": "Active" },
            { "name": "Inactive Customers", "type": "Behavioral", "count": 142, "revenue_potential": 24000, "campaigns": 3, "created_by": "System", "status": "At Risk" },
            { "name": "Shoes Buyers", "type": "Product", "count": 310, "revenue_potential": 45000, "campaigns": 7, "created_by": "Sarah J.", "status": "Active" },
            { "name": "VIP Churn Risk", "type": "AI Suggested", "count": 42, "revenue_potential": 24300, "campaigns": 3, "created_by": "Xeno AI", "status": "Action Needed" }
        ]
    })

from app.services.ai_service import ai_service

@bp.route('/ai/customer/<id>', methods=['GET'])
def ai_customer_insight(id):
    data = ai_service.generate_customer_insight(id)
    if not data:
        return jsonify({"error": "Failed to generate insight"}), 500
    return jsonify(data)

@bp.route('/ai/segment/<id>', methods=['GET'])
def ai_segment_insight(id):
    data = ai_service.generate_audience_insights(id)
    if not data:
        return jsonify({"error": "Failed to generate insight"}), 500
    return jsonify(data)

@bp.route('/ai/campaign/<id>', methods=['GET'])
def ai_campaign_insight(id):
    data = ai_service.generate_campaign_analysis(id)
    if not data:
        return jsonify({"error": "Failed to generate insight"}), 500
    return jsonify(data)

@bp.route('/ai/analytics', methods=['GET'])
def ai_analytics_summary():
    data = ai_service.generate_analytics_summary()
    if not data:
        return jsonify({"error": "Failed to generate insight"}), 500
    return jsonify(data)

@bp.route('/ingest', methods=['POST'])
def ingest_data():
    data = request.json
    customers_data = data.get('customers', [])
    
    customers_created = 0
    customers_updated = 0
    orders_created = 0

    from dateutil import parser
    
    for c_data in customers_data:
        email = c_data.get('email')
        if not email:
            continue
            
        customer = Customer.query.filter_by(email=email).first()
        if customer:
            customer.first_name = c_data.get('first_name', customer.first_name)
            customer.last_name = c_data.get('last_name', customer.last_name)
            customer.phone = c_data.get('phone', customer.phone)
            customer.city = c_data.get('city', customer.city)
            customers_updated += 1
        else:
            customer = Customer(
                first_name=c_data.get('first_name', ''),
                last_name=c_data.get('last_name', ''),
                email=email,
                phone=c_data.get('phone', ''),
                city=c_data.get('city', '')
            )
            db.session.add(customer)
            db.session.flush() # To get the customer ID
            customers_created += 1

        orders_data = c_data.get('orders', [])
        for o_data in orders_data:
            order_number = o_data.get('order_number')
            if not order_number:
                continue
                
            existing_order = Order.query.filter_by(order_number=order_number).first()
            if not existing_order:
                order_date_str = o_data.get('order_date')
                order_date = datetime.utcnow()
                if order_date_str:
                    try:
                        order_date = parser.parse(order_date_str)
                    except:
                        pass
                        
                order = Order(
                    customer_id=customer.id,
                    order_number=order_number,
                    amount=o_data.get('amount', 0.0),
                    order_date=order_date,
                    status=o_data.get('status', 'completed'),
                    channel=o_data.get('channel', 'online')
                )
                db.session.add(order)
                db.session.flush()
                
                items_data = o_data.get('items', [])
                for item_data in items_data:
                    item = OrderItem(
                        order_id=order.id,
                        product_name=item_data.get('product_name', 'Unknown'),
                        category=item_data.get('category', ''),
                        quantity=item_data.get('quantity', 1),
                        price=item_data.get('price', 0.0)
                    )
                    db.session.add(item)
                    
                orders_created += 1
                
                # Update customer metrics
                customer.total_spent += order.amount
                customer.order_count += 1
                if not customer.last_purchase_date or order.order_date > customer.last_purchase_date:
                    customer.last_purchase_date = order.order_date

    db.session.commit()
    return jsonify({
        "message": "Data ingested successfully",
        "customers_created": customers_created,
        "customers_updated": customers_updated,
        "orders_created": orders_created
    }), 200

import queue
import requests
from flask import Response

clients = []

@bp.route('/webhooks/channel', methods=['POST'])
def receive_webhook():
    data = request.json
    
    message_id = data.get('message_id')
    status = data.get('status')
    if message_id and status:
        from app.models import DeliveryEvent, Campaign, db
        event = DeliveryEvent.query.get(message_id)
        if event:
            event.status = status.capitalize()
            campaign = Campaign.query.get(event.campaign_id)
            if campaign:
                if status == 'opened':
                    campaign.open_count = getattr(campaign, 'open_count', 0) + 1
                elif status == 'clicked':
                    campaign.click_count = getattr(campaign, 'click_count', 0) + 1
                elif status == 'converted':
                    campaign.expected_revenue = getattr(campaign, 'expected_revenue', 0.0) + 50.0
            db.session.commit()

    # Push to all connected clients
    for q in clients:
        q.put(data)
    return jsonify({"status": "received"}), 200

@bp.route('/webhooks/stream', methods=['GET'])
def stream_webhooks():
    def event_stream():
        q = queue.Queue()
        clients.append(q)
        try:
            while True:
                data = q.get()
                yield f"data: {json.dumps(data)}\n\n"
        finally:
            clients.remove(q)
            
    return Response(event_stream(), mimetype="text/event-stream")

@bp.route('/channel/send_test', methods=['POST'])
def channel_send_test():
    data = request.json
    if 'message_id' not in data:
        import uuid
        data['message_id'] = str(uuid.uuid4())
        
    try:
        # Forward to simulator service on 5001
        requests.post(os.environ.get('CHANNEL_SERVICE_URL', 'http://localhost:5001') + '/send', json=data, timeout=2)
        return jsonify({"status": "dispatched", "message_id": data['message_id']}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/campaigns/opportunities', methods=['GET'])
def get_campaign_opportunities():
    from app.services.ai_service import ai_service
    from app.models import AICampaignOpportunity, db
    import threading
    
    pending = AICampaignOpportunity.query.filter_by(status='pending').all()
    if not pending:
        try:
            ai_service.generate_campaign_opportunities(limit=3)
            pending = AICampaignOpportunity.query.filter_by(status='pending').all()
        except Exception as e:
            print(f"Error generating campaign opportunities: {e}")
            pass

        
    return jsonify([
        {
            "id": opp.id,
            "title": opp.title,
            "target_segment_name": opp.target_segment_name,
            "target_segment_description": opp.target_segment_description,
            "customer_count": opp.customer_count,
            "expected_revenue": opp.expected_revenue,
            "confidence_score": opp.confidence_score,
            "reasoning": opp.reasoning
        } for opp in pending
    ])

@bp.route('/campaigns/generate-from-opportunity/<id>', methods=['POST'])
def generate_campaign_from_opportunity(id):
    from app.services.ai_service import ai_service
    from app.models import AICampaignOpportunity, Campaign, Segment, Journey, CampaignMessage, db
    import threading
    
    opp = AICampaignOpportunity.query.get_or_404(id)
    if opp.status != 'pending':
        return jsonify({"error": "Opportunity already converted"}), 400
        
    try:
        # 1. Generate content
        try:
            content = ai_service.generate_campaign_content(opp.title, opp.target_segment_name, opp.reasoning)
        except Exception as ai_e:
            print("AI Content Generation Failed (Quota likely exceeded), using fallback.", ai_e)
            content = {
                "subject": f"Special Offer: {opp.title}",
                "body": f"Hi {{first_name}},\n\nWe have prepared a special {opp.title} opportunity just for you. Enjoy a special discount on us!\n\nShop now.",
                "channels": ["Email"],
                "offer": "10% OFF"
            }
        
        # 2. Find or Create Target Segment mapping
        seg = Segment.query.filter_by(name=opp.target_segment_name).first()
        if not seg:
            seg = Segment(
                name=opp.target_segment_name,
                description=opp.target_segment_description,
                filters='[]'
            )
            db.session.add(seg)
            db.session.flush()
        
        from sqlalchemy import text
        query_str, params = _build_segment_query([])
        result = db.session.execute(text(query_str), params).fetchall()
        customer_ids = [row.id for row in result]
        if customer_ids:
            from app.models import Customer
            customers = Customer.query.filter(Customer.id.in_(customer_ids)).all()
            seg.customers.extend(customers)
        
        # 3. Create Campaign
        camp = Campaign(
            name=opp.title,
            audience_id=seg.id,
            type='bulk',
            channels=', '.join(content.get('channels', ['Email'])),
            expected_revenue=opp.expected_revenue,
            confidence_score=opp.confidence_score,
            status='Running',
            generated_by='AI',
            ai_confidence=opp.confidence_score,
            creation_source='Grok'
        )
        db.session.add(camp)
        db.session.flush()
        
        # Save message
        msg = CampaignMessage(
            campaign_id=camp.id,
            channel=content.get('channels', ['Email'])[0],
            content=json.dumps({
                "subject": content.get('subject'),
                "body": content.get('body'),
                "offer": content.get('offer')
            })
        )
        db.session.add(msg)
        
        # 4. Create Journey
        journey = Journey(
            name=f"{opp.title} Journey",
            campaign_id=camp.id,
            type='automated'
        )
        db.session.add(journey)
        
        # 5. Mark converted
        opp.status = 'converted'
        
        db.session.commit()
        
        # Launch campaign automatically
        import requests
        try:
            requests.post(f"http://127.0.0.1:5000/api/campaigns/{camp.id}/launch", timeout=2)
        except Exception as e:
            print("Failed to auto-launch campaign", e)
        
        # 6. Synchronously trigger fresh analysis to guarantee 3 are returned
        from app.models import AICampaignOpportunity
        remaining = AICampaignOpportunity.query.filter_by(status='pending').count()
        bg_triggered = False
        if remaining < 3:
            try:
                from app.services.ai_service import ai_service
                ai_service.generate_campaign_opportunities(limit=(3 - remaining))
                bg_triggered = True
            except Exception as regen_e:
                print("Synchronous regeneration failed:", regen_e)
            
            # Recalculate remaining after generation
            remaining = AICampaignOpportunity.query.filter_by(status='pending').count()
        
        return jsonify({
            "success": True,
            "campaign_id": camp.id,
            "created_segment_id": seg.id,
            "replacement_opportunity_generated": bg_triggered,
            "new_opportunity_count": remaining
        })
    except Exception as e:
        print("Failed to generate campaign", e)
        return jsonify({"error": str(e)}), 500

@bp.route('/templates', methods=['GET'])
def get_templates():
    from app.models import Template
    templates = Template.query.all()
    res = []
    for t in templates:
        res.append({
            "id": t.id,
            "name": t.name,
            "category": t.category,
            "thumbnail": t.thumbnail,
            "html_content": t.html_content,
            "json_content": t.json_content,
            "usage_count": t.usage_count,
            "open_rate": t.open_rate,
            "click_rate": t.click_rate,
            "conversion_rate": t.conversion_rate,
            "revenue_generated": t.revenue_generated,
            "ai_analysis": t.ai_analysis,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None,
            "created_by": t.created_by
        })
    return jsonify(res)

@bp.route('/templates', methods=['POST'])
def create_template():
    data = request.json
    from app.models import Template, db
    try:
        t = Template(
            name=data.get('name', 'Untitled'),
            category=data.get('category', 'General'),
            thumbnail=data.get('thumbnail', ''),
            html_content=data.get('html_content', ''),
            json_content=data.get('json_content', '{}'),
            created_by=data.get('created_by', 'System')
        )
        db.session.add(t)
        db.session.commit()
        return jsonify({"success": True, "id": t.id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/templates/<template_id>', methods=['PUT'])
def update_template(template_id):
    data = request.json
    from app.models import Template, db
    try:
        t = Template.query.get(template_id)
        if not t:
            return jsonify({"error": "Not found"}), 404
        if 'name' in data: t.name = data['name']
        if 'category' in data: t.category = data['category']
        if 'thumbnail' in data: t.thumbnail = data['thumbnail']
        if 'html_content' in data: t.html_content = data['html_content']
        if 'json_content' in data: t.json_content = data['json_content']
        db.session.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/templates/<template_id>', methods=['DELETE'])
def delete_template(template_id):
    from app.models import Template, db
    try:
        t = Template.query.get(template_id)
        if t:
            db.session.delete(t)
            db.session.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/templates/ai-generate', methods=['POST'])
def ai_generate_template():
    data = request.json
    prompt = data.get('prompt')
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400
    from app.services.ai_service import ai_service
    try:
        result = ai_service.generate_full_template(prompt)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/templates/ai-rewrite', methods=['POST'])
def ai_rewrite_template_block():
    data = request.json
    block_json = data.get('block_json')
    instruction = data.get('instruction')
    if not block_json or not instruction:
        return jsonify({"error": "block_json and instruction are required"}), 400
    from app.services.ai_service import ai_service
    try:
        result = ai_service.rewrite_template_block(block_json, instruction)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/templates/insights', methods=['GET'])
def get_template_insights():
    from app.services.ai_service import ai_service
    insights = ai_service.generate_template_insights()
    return jsonify(insights)

@bp.route('/command-center/intent', methods=['POST'])
def command_center_intent():
    data = request.json or {}
    goal = data.get('goal', '')
    if not goal:
        return jsonify({"error": "No goal provided"}), 400
        
    from app.services.ai_service import ai_service
    from app.models import Customer, db
    
    intent = ai_service.parse_command_center_intent(goal)
    
    # Query Database based on filters
    query = Customer.query
    filters = intent.get('filters', [])
    for f in filters:
        field = f.get('field')
        operator = f.get('operator')
        value = f.get('value')
        
        if field == 'order_count':
            if operator == '>': query = query.filter(Customer.order_count > value)
            elif operator == '<': query = query.filter(Customer.order_count < value)
            elif operator == '==': query = query.filter(Customer.order_count == value)
        elif field == 'total_spent':
            if operator == '>': query = query.filter(Customer.total_spent > value)
            elif operator == '<': query = query.filter(Customer.total_spent < value)
            elif operator == '==': query = query.filter(Customer.total_spent == value)
        elif field == 'churn_score':
            if operator == '>': query = query.filter(Customer.churn_score > value)
            elif operator == '<': query = query.filter(Customer.churn_score < value)
            elif operator == '==': query = query.filter(Customer.churn_score == value)
        elif field == 'last_purchase_days':
            # E.g. > 60 days
            from sqlalchemy import text
            if operator == '>': query = query.filter(Customer.last_purchase_date < text(f"NOW() - INTERVAL '{value} days'"))
            elif operator == '<': query = query.filter(Customer.last_purchase_date > text(f"NOW() - INTERVAL '{value} days'"))
            elif operator == '==':
                query = query.filter(Customer.last_purchase_date > text(f"NOW() - INTERVAL '{value+1} days'"))
                query = query.filter(Customer.last_purchase_date < text(f"NOW() - INTERVAL '{value-1} days'"))

    matched_customers = query.all()
    count = len(matched_customers)
    
    preview_customers = []
    estimated_revenue = 0
    for c in matched_customers:
        estimated_revenue += (c.total_spent or 0) * 0.1 # Mock 10% expected
        if len(preview_customers) < 5:
            preview_customers.append({"id": c.id, "name": f"{c.first_name} {c.last_name}"})
            
    intent['preview'] = {
        "count": count,
        "customers": preview_customers,
        "estimated_revenue": round(estimated_revenue, 2)
    }
    intent['customer_ids'] = [c.id for c in matched_customers]
    
    return jsonify(intent), 200

@bp.route('/command-center/execute', methods=['POST'])
def command_center_execute():
    data = request.json or {}
    action = data.get('action')
    name = data.get('name')
    customer_ids = data.get('customer_ids', [])
    
    from app.models import Segment, Campaign, Customer, db
    
    if action == 'create_segment':
        segment = Segment(
            name=name,
            description="Generated by AI Command Center",
            is_ai=True,
            status='active'
        )
        db.session.add(segment)
        if customer_ids:
            customers = Customer.query.filter(Customer.id.in_(customer_ids)).all()
            segment.customers.extend(customers)
        db.session.commit()
        return jsonify({"success": True, "id": segment.id}), 200
        
    elif action == 'create_campaign':
        campaign = Campaign(
            name=name,
            channels=data.get('channel', 'Email'),
            status='Running',
            generated_by='AI',
            creation_source='AI Command Center'
        )
        db.session.add(campaign)
        db.session.commit()
        
        from app.models import CampaignMessage, DeliveryEvent
        import threading
        import requests
        
        msg = CampaignMessage(
            campaign_id=campaign.id,
            channel=data.get('channel', 'Email'),
            content=data.get('message', '')
        )
        db.session.add(msg)
        db.session.commit()
        
        customers = []
        if customer_ids:
            customers = Customer.query.filter(Customer.id.in_(customer_ids)).all()
        else:
            customers = Customer.query.limit(50).all()
            
        events = []
        for customer in customers:
            event = DeliveryEvent(
                campaign_id=campaign.id,
                customer_id=customer.id,
                channel=campaign.channels or 'Email',
                status='Pending'
            )
            events.append(event)
            
        db.session.add_all(events)
        db.session.commit()
        
        events_data = [{"id": e.id, "email": c.email, "phone": c.phone, "customer_id": c.id, "campaign_id": campaign.id} for e, c in zip(events, customers)]
        
        def send_to_sim(events_list, channel, message_content):
            for ev_data in events_list:
                payload = {
                    "message_id": ev_data['id'],
                    "customer_id": ev_data['customer_id'],
                    "campaign_id": ev_data['campaign_id'],
                    "recipient": ev_data['phone'] if channel.lower() in ['whatsapp', 'sms'] else ev_data['email'],
                    "channel": channel.lower(),
                    "content": message_content or "Hello"
                }
                try:
                    requests.post(os.environ.get('CHANNEL_SERVICE_URL', 'http://localhost:5001') + '/send', json=payload, timeout=2)
                except:
                    pass

        t = threading.Thread(target=send_to_sim, args=(events_data, campaign.channels or 'Email', msg.content))
        t.start()
        
        return jsonify({"success": True, "id": campaign.id}), 200

    return jsonify({"error": "Unknown action"}), 400
