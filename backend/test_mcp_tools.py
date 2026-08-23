import subprocess
import json
import os

env = os.environ.copy()
env['RENDER_API_KEY'] = 'rnd_7SfWJNEbemYy6vTtJ9soYqfHu7WV'

proc = subprocess.Popen(
    ['npx', '-y', '@niyogi/render-mcp', 'start'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    env=env,
    text=True
)

request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
}

stdout_data, stderr_data = proc.communicate(json.dumps(request) + '\n')
print("STDOUT:", stdout_data)
print("STDERR:", stderr_data)
