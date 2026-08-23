import subprocess
import json
import os

env = os.environ.copy()
env['RENDER_API_KEY'] = 'rnd_7SfWJNEbemYy6vTtJ9soYqfHu7WV'

proc = subprocess.Popen(
    ['npx', '-y', '@niyogi/render-mcp'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    env=env,
    text=True
)

request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
        "name": "get_logs",
        "arguments": {
            "service_id": "srv-da4kuqbbc2fs73biel70",
            "limit": 100
        }
    }
}

stdout_data, _ = proc.communicate(json.dumps(request) + '\n')
print(stdout_data)
