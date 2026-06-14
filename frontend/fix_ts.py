import re
import os

log_path = r'C:\Users\sanskar\.gemini\antigravity-ide\brain\adec836b-0f37-48d2-af1c-59f95f47385f\.system_generated\tasks\task-8803.log'
content = open(log_path, encoding='utf-8').read()

errors = re.findall(r'src/(.*?)\((\d+),\d+\): error TS6133: \'(.*?)\' is declared', content)

files_to_fix = {}
for file, line, var in errors:
    full_path = os.path.join(r'd:\ai_crm\frontend\src', file)
    if full_path not in files_to_fix:
        files_to_fix[full_path] = []
    files_to_fix[full_path].append((int(line), var))

for file, issues in files_to_fix.items():
    if not os.path.exists(file): continue
    lines = open(file, encoding='utf-8').readlines()
    
    issues.sort(key=lambda x: x[0], reverse=True)
    
    for line_num, var in issues:
        idx = line_num - 1
        line = lines[idx]
        
        if 'import ' in line or 'from ' in line:
            new_line = re.sub(r'\b' + var + r'\b\s*,?', '', line)
            new_line = new_line.replace('{ ,', '{ ').replace(', }', ' }').replace('{  }', '')
            if re.match(r'^\s*import\s*(?:\{\s*\})?\s*from\s*[\'\"].*?[\'\"]\s*;?\s*$', new_line):
                new_line = ''
            elif re.match(r'^\s*import\s*[\'\"][\w\-]+[\'\"]\s*;?\s*$', new_line):
                pass
            lines[idx] = new_line
        else:
            if '=' in line and ('const ' in line or 'let ' in line):
                lines[idx] = '// ' + line
    
    with open(file, 'w', encoding='utf-8') as f:
        f.writelines(lines)

print('Auto-fixed unused vars')
