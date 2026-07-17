import os
import re

target_dir = r"c:\Users\userpc\mk-digital-backend"
pattern = re.compile(r"ProviderStatus", re.IGNORECASE)

results = []
for root, dirs, files in os.walk(target_dir):
    if "node_modules" in root or ".git" in root or "mongodb" in root:
        continue
    for file in files:
        if file.endswith(".js"):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    for line_num, line in enumerate(f, 1):
                        if pattern.search(line):
                            results.append(f"{path}:{line_num} - {line.strip()}")
            except Exception as e:
                pass

for r in results:
    print(r)
