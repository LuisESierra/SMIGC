from pathlib import Path
import re,urllib.request,json
ROOT=Path(__file__).resolve().parents[1]
dest=ROOT/'public/assets/museum'; dest.mkdir(parents=True,exist_ok=True)
base='https://museo.uao.edu.co/wp-content/uploads/'
assets={'logo.png':'2025/06/uao-lili-negro.png','uao.webp':'2025/06/UAO-LOGO-NUEVO_Mesa-de-trabajo-1-1-1-1-300x124.webp','collection.jpg':'2025/06/DSC08229-1024x901.jpg','figure.jpg':'2025/06/DSC08209-828x1024.jpg','exhibition.png':'2025/06/Tras-las-huellas-02-882x1024.png','lines.png':'2025/04/lines.png'}
sources=[]
def download(url,path):
    data=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0','Referer':'https://museo.uao.edu.co/'}),timeout=30).read()
    path.write_bytes(data)
for name,route in assets.items():
    download(base+route,dest/name); sources.append({'file':name,'url':base+route})
fonts=''
for name in ['poppins','opensans']:
    css=(ROOT/'docs'/f'{name}.css').read_text()
    for block in re.findall(r'/\* latin \*/\s*(@font-face\s*{.*?})',css,re.S):
        if 'font-style: normal' not in block:continue
        if name=='poppins' and not re.search(r'font-weight: (400|500|600|700);',block):continue
        if name=='opensans' and 'font-weight: 400;' not in block:continue
        url=re.search(r'url\(([^)]+)\)',block)[1]; filename=url.split('/')[-1]
        download(url,dest/filename)
        if name=='opensans':block=block.replace('font-weight: 400;','font-weight: 300 800;')
        fonts+=block.replace(url,'/assets/museum/'+filename)+'\n'
        sources.append({'file':filename,'url':url})
(dest/'fonts.css').write_text(fonts)
(ROOT/'docs/museum-assets.json').write_text(json.dumps(sources,indent=2))
print('Downloaded',len(sources),'verified resources')
