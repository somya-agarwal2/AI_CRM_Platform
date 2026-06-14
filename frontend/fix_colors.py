import os
path = r'd:\ai_crm\frontend\src\components\Templates.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("color: 'white'", "color: 'var(--text-primary)'")
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
