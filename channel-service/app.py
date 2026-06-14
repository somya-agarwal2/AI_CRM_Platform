from flask import Flask, request, jsonify
import threading
import time
import requests
import random
import os

app = Flask(__name__)

# In production, set BACKEND_URL env var to your Render backend URL
WEBHOOK_URL = os.environ.get('BACKEND_URL', 'http://localhost:5000') + '/api/webhooks/status'

def simulate_delivery(message_id, channel, recipient):
    # Sent status
    time.sleep(0.1)
    send_webhook(message_id, 'sent')
    
    # Delivered status
    time.sleep(random.uniform(0.2, 0.5))
    if random.random() > 0.95:
        send_webhook(message_id, 'failed')
        return
    send_webhook(message_id, 'delivered')

    # Opened status
    time.sleep(random.uniform(0.3, 1.0))
    open_prob = 0.8 if channel == 'whatsapp' else 0.4
    if random.random() > open_prob:
        return
    send_webhook(message_id, 'opened')

    # Clicked status
    time.sleep(random.uniform(0.5, 1.5))
    click_prob = 0.3 if channel == 'whatsapp' else 0.15
    if random.random() > click_prob:
        return
    send_webhook(message_id, 'clicked')

    # Converted status
    time.sleep(random.uniform(0.5, 2.0))
    if random.random() > 0.1:
        return
    revenue = round(random.uniform(30.0, 250.0), 2)
    send_webhook(message_id, 'converted', revenue)

def send_webhook(message_id, status, revenue=0.0):
    try:
        requests.post(WEBHOOK_URL, json={
            "message_id": message_id,
            "status": status,
            "revenue": revenue
        }, timeout=3)
    except Exception as e:
        print(f"Failed to send webhook for {message_id}: {e}")

@app.route('/send', methods=['POST'])
def send_message():
    data = request.get_json()
    message_id = data.get('message_id')
    channel = data.get('channel')
    recipient = data.get('recipient')
    content = data.get('content')
    
    if not message_id or not channel or not recipient:
        return jsonify({"error": "Missing required fields"}), 400
        
    print(f"Received {channel} message for {recipient}")
    
    # Start async simulation
    thread = threading.Thread(target=simulate_delivery, args=(message_id, channel, recipient))
    thread.start()
    
    return jsonify({"status": "accepted"}), 202

if __name__ == '__main__':
    app.run(port=5001, debug=True)
