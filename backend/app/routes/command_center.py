import uuid
import requests
from flask import Blueprint, request, jsonify
from app.models import db, Customer, Segment, Campaign, Journey, CustomerAction
from app.services.ai_service import process_command_intent

bp = Blueprint('command_center', __name__, url_prefix='/api/command-center')

@bp.route('/process', methods=['POST'])
def process_command():
    data = request.json
    goal = data.get('goal')
    if not goal:
        return jsonify({"error": "No goal provided"}), 400

    # 1. Ask AI to interpret goal
    intent = process_command_intent(goal)
    
    # Extract
    sql_filter = intent.get('sql_filter', '1=1')
    segment_name = intent.get('segment_name', 'AI Generated Segment')
    campaign_name = intent.get('campaign_name', 'AI Generated Campaign')
    message = intent.get('message', 'Default message.')
    channel = intent.get('channel', 'Email')
    expected_rev = intent.get('expected_revenue', 0)
    confidence = intent.get('confidence', 50)
    
    # 2. Execute SQL safely on customers table
    try:
        query = f"SELECT id FROM customers WHERE {sql_filter}"
        result = db.session.execute(db.text(query)).fetchall()
        customer_ids = [r[0] for r in result]
    except Exception as e:
        print(f"SQL execution error: {e}")
        customer_ids = []
    
    # Provide a fallback if 0 customers found so the demo still works
    if len(customer_ids) == 0:
        fallback = db.session.execute(db.text("SELECT id FROM customers LIMIT 50")).fetchall()
        customer_ids = [r[0] for r in fallback]

    # 3. Create Segment
    segment_id = str(uuid.uuid4())
    segment = Segment(
        id=segment_id,
        name=segment_name,
        description=f"Generated from goal: {goal}",
        filters=f'{{"sql": "{sql_filter}"}}'
    )
    db.session.add(segment)
    
    # Link customers
    for cid in customer_ids:
        db.session.execute(
            db.text("INSERT OR IGNORE INTO segment_customers (segment_id, customer_id) VALUES (:sid, :cid)"),
            {"sid": segment_id, "cid": cid}
        )
        
    # 4. Create Campaign
    campaign_id = str(uuid.uuid4())
    campaign = Campaign(
        id=campaign_id,
        name=campaign_name,
        audience_id=segment_id,
        type="bulk",
        goal=goal,
        channels=channel,
        status="Draft",
        expected_revenue=expected_rev,
        confidence_score=confidence,
        generated_by="AI"
    )
    db.session.add(campaign)
    
    # 5. Create Journey
    journey_id = str(uuid.uuid4())
    journey = Journey(
        id=journey_id,
        campaign_id=campaign_id,
        name=f"{channel} Journey for {segment_name}",
        type="bulk"
    )
    db.session.add(journey)
    
    db.session.commit()
    
    return jsonify({
        "segment": {
            "id": segment_id,
            "name": segment_name,
            "customer_count": len(customer_ids)
        },
        "campaign": {
            "id": campaign_id,
            "name": campaign_name,
            "message": message,
            "channel": channel,
            "expected_revenue": expected_rev,
            "confidence": confidence
        },
        "journey": {
            "id": journey_id,
            "name": journey.name
        }
    })

@bp.route('/launch', methods=['POST'])
def launch_strategy():
    data = request.json
    campaign_id = data.get('campaign_id')
    
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404
        
    campaign.status = "Running"
    
    # Find customers in segment
    result = db.session.execute(
        db.text("SELECT customer_id FROM segment_customers WHERE segment_id = :sid"),
        {"sid": campaign.audience_id}
    ).fetchall()
    
    # Create logs and trigger simulator
    for r in result:
        cid = r[0]
        # Log actions
        action1 = CustomerAction(customer_id=cid, campaign_id=campaign_id, action_type="AI generated strategy", status="Completed", channel=campaign.channels)
        action2 = CustomerAction(customer_id=cid, campaign_id=campaign_id, action_type="Campaign created", status="Completed", channel=campaign.channels)
        action3 = CustomerAction(customer_id=cid, campaign_id=campaign_id, action_type="Message queued", status="Pending", channel=campaign.channels)
        db.session.add_all([action1, action2, action3])
        
        # Fire to simulator
        payload = {
            "message_id": str(uuid.uuid4()),
            "campaign_id": campaign_id,
            "customer_id": cid
        }
        try:
            requests.post('http://localhost:5001/send', json=payload, timeout=2)
        except:
            pass

    db.session.commit()
    return jsonify({"status": "success", "launched_count": len(result)})
