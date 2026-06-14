from flask import Flask, request, jsonify
import threading
import time
import requests
import random
import sys

app = Flask(__name__)

CRM_WEBHOOK_URL = "http://localhost:5000/api/crm/webhook/event"

def simulate_lifecycle(message_id, campaign_id, customer_id):
    # 5 sec -> Sent
    time.sleep(5)
    send_webhook(message_id, campaign_id, customer_id, "Sent")
    
    # 10 sec total (5 more) -> Delivered
    time.sleep(5)
    if random.random() > 0.95:
        send_webhook(message_id, campaign_id, customer_id, "Failed")
        return
    send_webhook(message_id, campaign_id, customer_id, "Delivered")
    
    # 20 sec total (10 more) -> Opened
    time.sleep(10)
    if random.random() > 0.60:
        return
    send_webhook(message_id, campaign_id, customer_id, "Opened")
    
    # 30 sec total (10 more) -> Clicked
    time.sleep(10)
    if random.random() > 0.40:
        return
    send_webhook(message_id, campaign_id, customer_id, "Clicked")
    
    # 60 sec total (30 more) -> Purchased
    time.sleep(30)
    if random.random() > 0.50:
        return
    send_webhook(message_id, campaign_id, customer_id, "Purchased")

def send_webhook(message_id, campaign_id, customer_id, event_status):
    payload = {
        "message_id": message_id,
        "campaign_id": campaign_id,
        "customer_id": customer_id,
        "event": event_status
    }
    try:
        requests.post(CRM_WEBHOOK_URL, json=payload, timeout=5)
        print(f"[Simulator] Sent webhook: {event_status} for msg {message_id}")
    except Exception as e:
        print(f"[Simulator] Failed to send webhook: {e}")

@app.route('/send', methods=['POST'])
def send_message():
    data = request.json
    if not data:
        return jsonify({"error": "No payload"}), 400
        
    message_id = data.get('message_id')
    campaign_id = data.get('campaign_id')
    customer_id = data.get('customer_id')
    
    if not message_id:
        return jsonify({"error": "message_id required"}), 400
        
    # Start simulation thread
    t = threading.Thread(target=simulate_lifecycle, args=(message_id, campaign_id, customer_id))
    t.start()
    
    return jsonify({"status": "Queued", "message_id": message_id}), 200

if __name__ == '__main__':
    print("Starting Channel Simulator on port 5001...")
    # Run quietly to avoid cluttering main logs, or run with debug=False
    app.run(port=5001, debug=False, use_reloader=False)
