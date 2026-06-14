import re

with open(r'd:\ai_crm\frontend\src\components\SegmentDetail.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Strip block comments
code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
# Strip single-line comments
code = re.sub(r'//.*', '', code)

# Let's find all JSX tags in the return block
# We can find them by looking for <TagName or </TagName>
# Keep a stack of tags
stack = []
line_num = 1

# Let's process char by char to handle JSX tags accurately
i = 0
n = len(code)
while i < n:
    char = code[i]
    if char == '\n':
        line_num += 1
        i += 1
        continue
    
    # Check if we are starting a tag
    if char == '<' and i + 1 < n:
        # Check if it is a comment
        if code[i+1:i+4] == '!--':
            # Skip comment
            i = code.find('-->', i) + 3
            continue
        
        # Check if it is a closing tag
        if code[i+1] == '/':
            # Find the end of tag name
            end = code.find('>', i)
            tag_name = code[i+2:end].strip()
            if stack:
                open_tag, open_line = stack.pop()
                if open_tag != tag_name:
                    print(f"Tag Mismatch: Opened <{open_tag}> at line {open_line} but closed with </{tag_name}> at line {line_num}")
            else:
                print(f"Unmatched closing tag </{tag_name}> at line {line_num}")
            i = end + 1
            continue
        
        # Check if it is an opening tag or self-closing
        # Let's read the tag name (alphanumeric and some characters like ArrowLeft etc.)
        # We can look for the next space or > or /
        j = i + 1
        while j < n and code[j].isalnum():
            j += 1
        tag_name = code[i+1:j]
        
        if tag_name:
            # Let's find the closing > of this opening tag
            # We must be careful about strings or JSX expressions inside the tag, e.g. style={{...}}
            # Let's just find the next > that is not inside quotes or braces
            bracket_level = 0
            in_q = False
            q_char = None
            k = i
            self_closing = False
            while k < n:
                c = code[k]
                if in_q:
                    if c == q_char:
                        in_q = False
                    k += 1
                    continue
                if c in ('"', "'", '`'):
                    in_q = True
                    q_char = c
                    k += 1
                    continue
                if c == '{':
                    bracket_level += 1
                elif c == '}':
                    bracket_level -= 1
                elif c == '>' and bracket_level == 0:
                    if code[k-1] == '/':
                        self_closing = True
                    break
                k += 1
            
            if not self_closing and tag_name not in ('img', 'br', 'hr', 'input'):
                # Check if it is a component or HTML tag
                # Only track if it looks like a tag (lowercase or PascalCase)
                if tag_name[0].isalpha():
                    stack.append((tag_name, line_num))
            i = k + 1
            continue
    i += 1

print("\n--- Remaining Open Tags at EOF ---")
for tag, line in stack:
    print(f"Line {line} <{tag}>")
