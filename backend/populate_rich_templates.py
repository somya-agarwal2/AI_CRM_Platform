import requests
import json

base_url = 'http://localhost:5000/api/templates'

# Fetch existing and delete them
existing = requests.get(base_url).json()
for t in existing:
    requests.delete(f"{base_url}/{t['id']}")

# Create rich templates
rich_templates = [
    {
        'name': 'Summer Flash Sale',
        'category': 'Promotional',
        'thumbnail': 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80',
        'json_content': json.dumps({
            "blocks": [
                {"id": "b1", "type": "Header", "content": "SUMMER FLASH SALE", "styles": {"padding": "24px", "color": "#ffffff", "backgroundColor": "#f43f5e", "textAlign": "center", "fontSize": "28px"}},
                {"id": "b2", "type": "Image", "url": "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80", "styles": {"width": "100%", "padding": "0"}},
                {"id": "b3", "type": "Text", "content": "Up to 50% off on all summer collections. Don't miss out on our biggest event of the season!", "styles": {"padding": "20px", "textAlign": "center", "fontSize": "16px", "color": "#334155"}},
                {"id": "b4", "type": "Button", "content": "Shop Now", "styles": {"padding": "12px 24px", "backgroundColor": "#0f172a", "color": "#ffffff", "textAlign": "center", "borderRadius": "4px"}}
            ]
        })
    },
    {
        'name': 'VIP Exclusive Access',
        'category': 'VIP',
        'thumbnail': 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
        'json_content': json.dumps({
            "blocks": [
                {"id": "b1", "type": "Header", "content": "Exclusive VIP Access", "styles": {"padding": "30px", "color": "#eab308", "backgroundColor": "#1e293b", "textAlign": "center", "fontSize": "26px"}},
                {"id": "b2", "type": "Text", "content": "Because you're one of our best customers, we're giving you 24-hour early access to our new collection.", "styles": {"padding": "20px", "textAlign": "center", "fontSize": "16px", "color": "#475569"}},
                {"id": "b3", "type": "Coupon", "content": "VIP2026", "styles": {"padding": "16px", "backgroundColor": "#f8fafc", "border": "2px dashed #cbd5e1", "textAlign": "center", "fontSize": "20px", "fontWeight": "bold", "color": "#334155"}},
                {"id": "b4", "type": "Button", "content": "Unlock Early Access", "styles": {"padding": "14px 28px", "backgroundColor": "#eab308", "color": "#ffffff", "textAlign": "center", "borderRadius": "8px"}}
            ]
        })
    },
    {
        'name': 'Did You Forget Something?',
        'category': 'Cart Recovery',
        'thumbnail': 'https://images.unsplash.com/photo-1555529771-835f59bfc50c?auto=format&fit=crop&w=600&q=80',
        'json_content': json.dumps({
            "blocks": [
                {"id": "b1", "type": "Header", "content": "Your Cart is Waiting...", "styles": {"padding": "24px", "color": "#334155", "backgroundColor": "#f1f5f9", "textAlign": "center", "fontSize": "24px"}},
                {"id": "b2", "type": "Text", "content": "We noticed you left some great items in your cart. Complete your purchase now before they sell out!", "styles": {"padding": "20px", "textAlign": "center", "fontSize": "16px", "color": "#64748b"}},
                {"id": "b3", "type": "Button", "content": "Return to Cart", "styles": {"padding": "14px 28px", "backgroundColor": "#3b82f6", "color": "#ffffff", "textAlign": "center", "borderRadius": "4px"}}
            ]
        })
    },
    {
        'name': 'Weekly Community Update',
        'category': 'Newsletter',
        'thumbnail': 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=600&q=80',
        'json_content': json.dumps({
            "blocks": [
                {"id": "b1", "type": "Image", "url": "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80", "styles": {"width": "100%", "padding": "0"}},
                {"id": "b2", "type": "Header", "content": "Weekly Roundup", "styles": {"padding": "20px", "color": "#1e293b", "backgroundColor": "#ffffff", "textAlign": "center", "fontSize": "22px"}},
                {"id": "b3", "type": "Text", "content": "Here is what happened this week in our community. From new feature launches to community highlights.", "styles": {"padding": "16px", "textAlign": "left", "fontSize": "15px", "color": "#475569"}},
                {"id": "b4", "type": "Button", "content": "Read Full Story", "styles": {"padding": "10px 20px", "backgroundColor": "#10b981", "color": "#ffffff", "textAlign": "center", "borderRadius": "30px"}}
            ]
        })
    }
]

for t in rich_templates:
    res = requests.post(base_url, json=t)
    if res.status_code == 200:
        new_id = res.json().get('id')
        # Inject some fake usage stats directly into the DB for visual completeness
        import sqlite3
        conn = sqlite3.connect('ai_crm_v2.db')
        c = conn.cursor()
        import random
        c.execute('''UPDATE templates 
                     SET usage_count=?, open_rate=?, click_rate=?, conversion_rate=? 
                     WHERE id=?''', 
                  (random.randint(50, 500), round(random.uniform(20.0, 45.0), 1), round(random.uniform(5.0, 15.0), 1), round(random.uniform(1.0, 5.0), 1), new_id))
        conn.commit()
        conn.close()

print("Rich templates created successfully.")
