from pathlib import Path
import os, json, hashlib, urllib.request, re, shutil
ROOT = Path(__file__).resolve().parents[1]
ORIGINAL = ROOT.parent / 'SMIGC'
def snapshot():
    result = {}
    for folder, dirs, files in os.walk(ORIGINAL):
        for name in files:
            p = Path(folder)/name
            rel = p.relative_to(ORIGINAL).as_posix()
            st = p.stat()
            item = {'size': st.st_size, 'mtime_ns': st.st_mtime_ns}
            if not name.startswith('.env') and not any(x in p.relative_to(ORIGINAL).parts for x in ('node_modules','logs','.git')):
                item['sha256'] = hashlib.sha256(p.read_bytes()).hexdigest()
            result[rel] = item
    return result
if __name__ == '__main__':
    import sys
    docs = ROOT/'docs'; docs.mkdir(exist_ok=True)
    if '--verify' in sys.argv:
        before = json.loads((docs/'original-before.json').read_text())
        after = snapshot()
        changes = [k for k in before.keys() | after.keys() if before.get(k) != after.get(k)]
        report = {'original': str(ORIGINAL), 'files': len(after), 'changed': changes, 'env_contents_read': False}
        (docs/'original-verification.json').write_text(json.dumps(report,indent=2))
        print(json.dumps(report))
        sys.exit(bool(changes))
    if (docs/'original-before.json').exists():
        raise SystemExit('La referencia inicial ya existe. Usa --verify; no se reemplazará la evidencia.')
    (docs/'original-before.json').write_text(json.dumps(snapshot(),indent=2))
    assets = []
    for p in (ORIGINAL/'src').rglob('*'):
        if p.suffix.lower() in ('.png','.jpg','.jpeg','.webp','.mp4','.mp3','.gif','.svg'):
            dest = ROOT/'public/assets/original'/p.relative_to(ORIGINAL/'src')
            dest.parent.mkdir(parents=True,exist_ok=True)
            shutil.copyfile(p,dest)
            assets.append({'path':p.relative_to(ORIGINAL/'src').as_posix(),'bytes':p.stat().st_size})
    (docs/'asset-inventory.json').write_text(json.dumps(assets,indent=2))
    req = urllib.request.Request('https://museo.uao.edu.co/',headers={'User-Agent':'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode()
    (docs/'museum-home.html').write_text(html,encoding='utf-8')
    urls = re.findall(r'<link[^>]+href=[\"\']([^\"\']+)',html)
    css = []
    for i,url in enumerate(urls):
        if '.css' in url:
            try:
                data = urllib.request.urlopen(url).read().decode()
                (docs/f'museum-{i}.css').write_text(data,encoding='utf-8')
                css.append({'url':url,'file':f'museum-{i}.css'})
            except Exception as e: print(str(e))
    (docs/'museum-css-sources.json').write_text(json.dumps(css,indent=2))
    print(json.dumps({'assets':len(assets),'asset_mb':round(sum(x['bytes'] for x in assets)/1e6,1),'css':css}))
