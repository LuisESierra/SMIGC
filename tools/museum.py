from pathlib import Path
import urllib.request,re,json,concurrent.futures
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'docs/museum-home.html').read_text(encoding='utf-8')
def get(url):
    return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0','Referer':'https://museo.uao.edu.co/'}),timeout=30).read()
urls=re.findall(r'<link[^>]+href=[\"\']([^\"\']+)',html)
urls=[x for x in urls if '/css/post-' in x or '/google-fonts/css/' in x]
def fetch(url):
    try:
        data=get(url.split('?')[0]); name=url.split('/')[-1].split('?')[0]
        (ROOT/'docs'/name).write_bytes(data)
        return {'url':url,'file':name}
    except Exception as e:return {'url':url,'error':str(e)}
results=list(concurrent.futures.ThreadPoolExecutor(6).map(fetch,urls))
(ROOT/'docs/museum-css-sources.json').write_text(json.dumps(results,indent=2))
for x in results:
    if 'file' in x:
        css=(ROOT/'docs'/x['file']).read_text()
        print(x['file'],re.findall(r'--e-global-[^;]+',css)[:25])
images=list(dict.fromkeys(re.findall(r'<img[^>]+src="([^"]+)"',html)))
print(json.dumps(images,indent=2))
print(json.dumps(results,indent=2))
