import time
import json
import threading
import queue
import requests
import random
from flask import Flask, request, jsonify

app = Flask(__name__)
message_queue = queue.Queue()

CRM_WEBHOOK_URL = "http://localhost:5000/api/webhooks/channel"

def worker():
    print("Channel Simulator Worker Started")
    while True:
        payload = message_queue.get()
        if payload is None:
            break
            
        message_id = payload.get("message_id")
        recipient = payload.get("recipient")
        channel = payload.get("channel")
        
        print(f"Processing message {message_id} to {recipient} via {channel}")
        
        # Simulate Network Latency
        time.sleep(random.uniform(0.5, 1.5))
        
        # 10% chance of immediate failure
        if random.random() < 0.1:
            send_webhook(message_id, "failed", "Invalid recipient or network error")
            message_queue.task_done()
            continue
            
        # Delivered
        send_webhook(message_id, "delivered")
        
        # Simulate open delay
        time.sleep(random.uniform(1.0, 3.0))
        
        # 60% chance of opening
        if random.random() < 0.6:
            send_webhook(message_id, "opened")
            
            # Simulate click delay
            time.sleep(random.uniform(1.0, 2.0))
            
            # 30% chance of clicking
            if random.random() < 0.3:
                send_webhook(message_id, "clicked")
        
        message_queue.task_done()

def send_webhook(message_id, status, error=None):
    try:
        data = {
            "message_id": message_id,
            "status": status,
            "timestamp": time.time()
        }
        if error:
            data["error"] = error
            
        print(f"Sending webhook for {message_id}: {status}")
        requests.post(CRM_WEBHOOK_URL, json=data, timeout=5)
    except Exception as e:
        print(f"Failed to send webhook for {message_id}: {e}")

@app.route('/send', methods=['POST'])
def send_message():
    payload = request.json
    if not payload or 'message_id' not in payload:
        return jsonify({"error": "message_id is required"}), 400
        
    message_queue.put(payload)
    return jsonify({"status": "accepted", "message_id": payload['message_id']}), 202

if __name__ == '__main__':
    # Start the worker thread
    t = threading.Thread(target=worker, daemon=True)
    t.start()
    
    print("Starting Channel Simulator Service on port 5001...")
    app.run(port=5001, debug=False, use_reloader=False)
