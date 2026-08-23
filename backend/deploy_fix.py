import json, sys, os
from subprocess import Popen, PIPE

env = os.environ.copy()
env['RENDER_API_KEY'] = 'rnd_7SfWJNEbemYy6vTtJ9soYqfHu7WV'

p = Popen(['npx', '-y', '@niyogi/render-mcp', 'start'], stdin=PIPE, stdout=PIPE, text=True, env=env)

init_req = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
        "protocolVersion": "2024-11-05",
        "capabilities": {},
        "clientInfo": {"name": "test", "version": "1.0"}
    }
}
p.stdin.write(json.dumps(init_req) + '\n')
p.stdin.flush()
p.stdout.readline()

init_notif = {
    "jsonrpc": "2.0",
    "method": "notifications/initialized"
}
p.stdin.write(json.dumps(init_notif) + '\n')
p.stdin.flush()

tool_req = {
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
        "name": "deploy_service",
        "arguments": {
            "serviceId": "srv-da4kuqbbc2fs73biel70",
            "clearCache": True
        }
    }
}
p.stdin.write(json.dumps(tool_req) + '\n')
p.stdin.flush()

res = p.stdout.readline()
print("STDOUT:", res)
