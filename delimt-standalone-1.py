#!/usr/bin/env python3
"""Prepare and build Delimt's standalone testing APK from the existing checkout."""
import argparse
import base64
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import urllib.error
import urllib.request
from urllib.parse import urlsplit

PUBLIC = ('EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY', 'EXPO_PUBLIC_API_URL')
NATIVE = (
    'modules/delimt-protection/expo-module.config.json',
    'modules/delimt-protection/android/build.gradle',
    'modules/delimt-protection/android/src/main/AndroidManifest.xml',
    'modules/delimt-protection/android/src/main/java/expo/modules/delimtprotection/DelimtProtectionModule.kt',
    'modules/delimt-protection/android/src/main/java/expo/modules/delimtprotection/DelimtAccessibilityService.java',
)


def stop(message):
    raise SystemExit(message)


def prepare(mobile):
    for source in NATIVE:
        if not (mobile / source).is_file():
            stop(f'Missing Android protection source: {source}. Keep the complete working Step 3 checkout.')
        result = subprocess.run(['git', 'check-ignore', '--no-index', '--quiet', '--', source], cwd=mobile)
        if result.returncode == 0:
            stop(f'Android protection source is ignored: {source}. Use /android/ instead of android/ in mobile/.gitignore.')
        if result.returncode != 1:
            stop('Run this inside your Delimt Git checkout.')
    file = mobile / 'eas.json'
    config = json.loads(file.read_text())
    if not isinstance(config.get('build'), dict):
        stop('The working EAS build configuration is missing.')
    values = {}
    # Start with the known working development settings, then local overrides.
    for key, value in config['build'].get('development', {}).get('env', {}).items():
        if key in PUBLIC and isinstance(value, str):
            values[key] = value
    for name in ('.env', '.env.local'):
        path = mobile / name
        if not path.is_file():
            continue
        for line in path.read_text().splitlines():
            match = re.match(r'^\s*(?:export\s+)?(EXPO_PUBLIC_[A-Z0-9_]+)\s*=\s*(.*?)\s*$', line)
            if match and match[1] in PUBLIC:
                value = match[2]
                if len(value) >= 2 and value[0] in ('"', "'") and value[-1] == value[0]:
                    value = value[1:-1]
                values[match[1]] = value
    for key in PUBLIC:
        if os.environ.get(key):
            values[key] = os.environ[key]
    url = values.get(PUBLIC[0], '')
    key = values.get(PUBLIC[1], '')
    if not url.startswith('https://') or not urlsplit(url).hostname or not key or 'your_supabase' in url + key:
        stop('The working public Supabase URL/key are missing. Run npm run configure from mobile first.')
    public_key = key.startswith('sb_publishable_')
    try:
        body = key.split('.')[1]
        public_key = public_key or json.loads(base64.urlsafe_b64decode(body + '=' * (-len(body) % 4))).get('role') == 'anon'
    except (ValueError, IndexError, UnicodeError):
        pass
    if not public_key:
        stop('Use the Supabase anon/publishable key. Server and Groq keys cannot be included in an APK.')
    api = values.get(PUBLIC[2], 'https://www.delimt.com').rstrip('/')
    api = re.sub(r'^https://delimt\.com(?=/|$)', 'https://www.delimt.com', api)
    if not api.startswith('https://') or not urlsplit(api).hostname:
        stop('The mobile backend URL must use HTTPS.')
    values[PUBLIC[2]] = api
    preview = config['build'].setdefault('preview', {})
    preview['developmentClient'] = False
    preview['distribution'] = 'internal'
    preview['environment'] = 'preview'
    preview.setdefault('android', {}).update({'buildType': 'apk', 'gradleCommand': ':app:assembleRelease'})
    preview.setdefault('env', {}).update({key: values[key] for key in PUBLIC})
    # Store the original EAS settings in the already-ignored Expo working folder.
    backup = mobile / '.expo' / 'delimt-preview-backup'
    backup.mkdir(parents=True, exist_ok=True)
    descriptor, name = tempfile.mkstemp(prefix='eas-', suffix='.json', dir=backup)
    with os.fdopen(descriptor, 'wb') as handle:
        handle.write(file.read_bytes())
    descriptor, temporary = tempfile.mkstemp(prefix='.delimt-eas-', dir=mobile)
    try:
        with os.fdopen(descriptor, 'w') as handle:
            handle.write(json.dumps(config, indent=2) + '\n')
        os.chmod(temporary, 0o644)
        os.replace(temporary, file)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    print('Standalone preview configuration is ready. The original EAS settings were backed up.')
    print('Your .env, app.json, dependency versions, native service and development profile were kept.')
    return api


def check_backend(api):
    target = api + '/api/mobile-intervene'
    request = urllib.request.Request(target, headers={'Accept': 'application/json'})
    try:
        response = urllib.request.urlopen(request, timeout=15)
    except urllib.error.HTTPError as response:
        status = response.code
        content_type = response.headers.get('Content-Type', '')
        body = response.read(4096)
    except (urllib.error.URLError, TimeoutError):
        stop('Could not reach the mobile backend. No EAS build was started.')
    else:
        status = response.status
        content_type = response.headers.get('Content-Type', '')
        body = response.read(4096)
        response.close()
    try:
        payload = json.loads(body)
    except (ValueError, UnicodeError):
        payload = None
    if status not in (401, 405) or 'json' not in content_type.lower() or not isinstance(payload, dict):
        stop('The mobile AI endpoint is not ready at ' + target + '. It must serve the authenticated API, not the website. Deploy api/mobile-intervene.js and server/mobile-intervention.js and keep /api routes out of the website catch-all rewrite. No EAS build was started.')
    print('Mobile API routing responds as expected. This checks the route, not a live signed-in Groq conversation.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build', action='store_true', help='Check the mobile API and start the preview APK build.')
    args = parser.parse_args()
    result = subprocess.run(['git', 'rev-parse', '--show-toplevel'], capture_output=True, text=True)
    if result.returncode:
        stop('Open a Codespaces terminal inside your existing Delimt repository.')
    mobile = Path(result.stdout.strip()) / 'mobile'
    api = prepare(mobile)
    if not args.build:
        print('Next: test Talk to Delimt for a fresh AI reply, then run python3 delimt-standalone.py --build from the repository root.')
        return
    check_backend(api)
    subprocess.run(['npx', '--yes', 'eas-cli@latest', 'build', '--platform', 'android', '--profile', 'preview', '--clear-cache'], cwd=mobile, check=True)
    print('Install the resulting APK and open Delimt directly. No Expo server is needed for this testing build.')


if __name__ == '__main__':
    main()
