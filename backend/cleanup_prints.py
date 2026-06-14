import re
path = r'd:\ai_crm\backend\app\routes\__init__.py'
content = open(path, encoding='utf-8').read()
new_content = re.sub(r'^\s*print\([\"\'f]*(DEBUG:|AI AUDIENCE HIT|CUSTOMER IDS RECEIVED:|CUSTOMERS FOUND:).*?\n', '', content, flags=re.MULTILINE)
if len(content) != len(new_content):
    open(path, 'w', encoding='utf-8').write(new_content)
    print('Cleaned up debug prints')
