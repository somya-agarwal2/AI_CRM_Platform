import os
import re

components_dir = os.path.join(os.path.dirname(__file__), 'src', 'components')

for filename in os.listdir(components_dir):
    if not filename.endswith('.tsx'):
        continue
    
    filepath = os.path.join(components_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Replace inline hardcoded localhost URLs (in fetch/axios calls that aren't using API_URL variable)
    content = content.replace("'http://localhost:5000/api'", "API_URL")
    content = content.replace('"http://localhost:5000/api"', "API_URL")
    content = content.replace('`http://localhost:5000/api', '`${API_URL}')
    content = content.replace("'http://localhost:5000/api/", "`${API_URL}/")
    content = content.replace('"http://localhost:5000/api/', '`${API_URL}/')
    
    # Fix remaining full URL occurrences (template literals and strings)
    content = re.sub(r"'http://localhost:5000/api/([^']+)'", r'`${API_URL}/\1`', content)
    content = re.sub(r'"http://localhost:5000/api/([^"]+)"', r'`${API_URL}/\1`', content)
    
    # Replace the old import line if it was already converted to import style
    # Make sure the import is not duplicated
    if 'import API_URL from' in content and "import API_URL from '../config';" not in content:
        pass  # already handled
    
    # If file has API_URL usage but no import, add the import at the top (after first import line)
    if 'API_URL' in content and "import API_URL from '../config'" not in content:
        # Add import after the first import statement
        lines = content.split('\n')
        insert_at = 0
        for i, line in enumerate(lines):
            if line.startswith('import '):
                insert_at = i + 1
        lines.insert(insert_at, "import API_URL from '../config';")
        content = '\n'.join(lines)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filename}")

print("Done!")
