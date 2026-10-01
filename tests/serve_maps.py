"""Local browser QA: normal pages plus isolated basemap/data/WebGL failures.

Only binds loopback. Failure injection changes HTTP responses, not source files.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import os
import json
import time

root = Path(__file__).resolve().parents[1]
os.chdir(root)

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        original = urlsplit(self.path).path
        if original == '/__stalled-style.json':
            self.send_json({'version': 8, 'sources': {'openmaptiles': {'type': 'vector', 'url': '/__hang-metadata.json'}}, 'layers': [{'id': 'background', 'type': 'background'}, {'id': 'roads', 'type': 'line', 'source': 'openmaptiles', 'source-layer': 'transportation'}]})
            return
        if original == '/__hang-metadata.json':
            time.sleep(30)
            self.send_json({'tilejson': '3.0.0', 'tiles': []})
            return
        parts = original.strip('/').split('/')
        scenario = parts[0] if parts[0] in {'__offline', '__missing-data', '__no-webgl', '__stalled'} else ''
        path = '/' + '/'.join(parts[1:]) if scenario else original
        if any(part.startswith('.') for part in parts):
            self.send_error(403)
            return
        if path.startswith('/__missing') or (scenario == '__missing-data' and (path.endswith('buildings.json') or path.endswith('.csv'))):
            self.send_error(503)
            return
        if scenario and path.endswith('map-runtime.mjs'):
            content = (root / 'assets/js/map-runtime.mjs').read_text(encoding='utf-8')
            if scenario == '__offline':
                content = content.replace('https://tiles.openfreemap.org/styles/dark', '/__missing-style.json')
            elif scenario == '__stalled':
                content = content.replace('https://tiles.openfreemap.org/styles/dark', '/__stalled-style.json')
            elif scenario == '__no-webgl':
                content = content.replace('map = new lib.Map(', "map = (() => { throw new Error('WebGL unavailable in test'); })(")
            payload = content.encode()
            self.send_response(200)
            self.send_header('Content-Type', 'text/javascript')
            self.send_header('Content-Length', str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        self.path = path
        super().do_GET()

    def send_json(self, value):
        payload = json.dumps(value).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

print('Map QA server: http://127.0.0.1:4173', flush=True)
ThreadingHTTPServer(('127.0.0.1', 4173), Handler).serve_forever()
