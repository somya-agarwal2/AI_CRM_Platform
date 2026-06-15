import re

path = r'd:\ai_crm\backend\app\routes\__init__.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = "requests.post('http://localhost:5001/send'"
new = "requests.post(os.environ.get('CHANNEL_SERVICE_URL', 'http://localhost:5001') + '/send'"

count = content.count(old)
content = content.replace(old, new)

# Ensure os is imported at the top
if 'import os\n' not in content[:1000]:
    content = 'import os\n' + content

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'Fixed {count} occurrences in routes/__init__.py')
