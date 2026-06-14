
code = '''
def process_command_intent(goal):
    provider = get_ai_provider()
    
    fallback = {
        "sql_filter": "churn_score > 0.7",
        "segment_name": "High Risk Customers",
        "campaign_name": "Win Back Campaign",
        "message": "We miss you! Here is 20% off.",
        "channel": "WhatsApp",
        "expected_revenue": 15000,
        "confidence": 88
    }
    
    if not provider:
        return fallback

    prompt = f"""You are an expert AI Marketing CRM Copilot.
Convert the user's natural language goal into a JSON object.

Goal: {goal}

We have a SQLite 'customers' table with the following schema:
- id (String)
- first_name (String)
- last_name (String)
- city (String)
- total_spent (Float)
- order_count (Integer)
- churn_score (Float between 0 and 1)

Output exactly a JSON object containing:
- sql_filter: A valid SQL WHERE clause for the `customers` table based on the user's goal. For example, if they want high spenders, use 'total_spent > 1000'. If they want churn risk, use 'churn_score > 0.7'. You must only use the fields listed above. Do not include 'WHERE', just the condition. If no filter applies, use '1=1'.
- segment_name: A concise name for this audience (e.g. "VIP Customers").
- campaign_name: A short name for the campaign to run.
- message: A customized short message text for the campaign. You can use {{{{first_name}}}}.
- channel: A suggested channel (e.g., 'WhatsApp', 'Email', 'SMS').
- expected_revenue: A float representing predicted revenue if launched.
- confidence: An integer between 0-100 representing your confidence in this strategy.

Only output valid JSON, nothing else."""

    try:
        response_text = provider.generate(prompt)
        cleaned = clean_json_response(response_text)
        import json
        data = json.loads(cleaned)
        return data
    except Exception as e:
        print(f"AI provider error: {e}")
        return fallback
'''

with open(r'd:\ai_crm\backend\app\services\ai_service.py', 'a', encoding='utf-8') as f:
    f.write('\n' + code + '\n')
