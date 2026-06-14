import urllib.request
import json
import time
import sys

backend_url = "https://operon-backend.onrender.com/"
print(f"Polling backend deployment at: {backend_url}")

max_attempts = 30
for i in range(1, max_attempts + 1):
    try:
        req = urllib.request.Request(backend_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as res:
            if res.status == 200:
                body = json.loads(res.read().decode('utf-8'))
                print(f"[SUCCESS] Attempt {i}: Backend is live! Message: {body.get('message')}")
                sys.exit(0)
    except Exception as e:
        print(f"[POLLING] Attempt {i}/{max_attempts}: Backend is still deploying or spinning up (Error: {e}). Retrying in 10s...")
    time.sleep(10)

print("[FAILED] Backend did not respond with 200 OK after 5 minutes.")
sys.exit(1)
