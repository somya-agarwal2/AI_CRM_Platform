import threading
import requests
from flask import current_app
from models import db, Campaign, Message, Customer
import uuid
from datetime import datetime
import os

CHANNEL_SERVICE_URL = os.environ.get('CHANNEL_SERVICE_URL', 'http://localhost:5001') + '/send'

def send_campaign_async(app, campaign_id):
    with app.app_context():
        campaign = Campaign.query.get(campaign_id)
        if not campaign:
            return
            
        campaign.status = 'sending'
        db.session.commit()

        # Find audience
        try:
            segment = campaign.segment
            result = db.session.execute(db.text(segment.query_sql)).fetchall()
            customer_ids = [row[0] for row in result]
        except Exception as e:
            campaign.status = 'failed'
            db.session.commit()
            return

        for c_id in customer_ids:
            customer = Customer.query.get(c_id)
            if not customer: continue

            # Create message
            msg = Message(
                id=str(uuid.uuid4()),
                campaign_id=campaign_id,
                customer_id=c_id,
                channel=campaign.channel,
                recipient_address=customer.email if campaign.channel == 'email' else customer.phone,
                content=campaign.message_template.replace('{{name}}', customer.name.split()[0]),
                status='pending',
                sent_at=datetime.utcnow()
            )
            db.session.add(msg)
            db.session.commit()

            # Send to channel service
            payload = {
                "message_id": msg.id,
                "recipient": msg.recipient_address,
                "channel": msg.channel,
                "content": msg.content
            }
            try:
                # We use a very short timeout so it doesn't block long, the channel service acknowledges immediately
                requests.post(CHANNEL_SERVICE_URL, json=payload, timeout=2)
            except requests.RequestException:
                msg.status = 'failed'
                db.session.commit()

        campaign.status = 'completed'
        db.session.commit()

def launch_campaign(campaign_id):
    app = current_app._get_current_object()
    thread = threading.Thread(target=send_campaign_async, args=(app, campaign_id))
    thread.start()
