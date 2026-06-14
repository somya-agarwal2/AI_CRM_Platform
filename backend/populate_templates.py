import requests
import json

templates = [
    {
        'name': 'VIP Win Back Series',
        'category': 'VIP',
        'json_content': json.dumps({"blocks":[]})
    },
    {
        'name': 'AI: Summer Newsletter',
        'category': 'Newsletter',
        'json_content': json.dumps({"blocks":[]})
    },
    {
        'name': 'AI: Cart Recovery Boost',
        'category': 'Cart Recovery',
        'json_content': json.dumps({"blocks":[]})
    },
    {
        'name': 'Monthly Product Launch',
        'category': 'Product Launch',
        'json_content': json.dumps({"blocks":[]})
    }
]

for t in templates:
    res = requests.post('http://localhost:5000/api/templates', json=t)
    print(res.json())
