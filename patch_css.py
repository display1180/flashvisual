import re

html_file = 'ascii_flash.html'
with open(html_file, 'r') as f:
    content = f.read()

css_addition = """
    .hidden-override {
      display: none !important;
    }
"""

if '.hidden-override' not in content:
    content = content.replace('</style>', css_addition + '</style>')
    with open(html_file, 'w') as f:
        f.write(content)
