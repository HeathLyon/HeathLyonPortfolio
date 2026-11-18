"""Build articles/index.json from HTML articles; run at repository root."""
import json
import re
from datetime import date
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'articles'

class ArticleParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ''; self.description = ''; self.image = ''; self.category = ''; self.date = ''
        self.in_title = False; self.in_h1 = False; self.in_eyebrow = False; self.in_time = False
        self.h1 = ''; self.head_title = ''; self.preamble = True
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'meta':
            if a.get('name') == 'description': self.description = a.get('content', '')
            if a.get('property') == 'og:image': self.image = a.get('content', '')
        if tag == 'title': self.in_title = True
        if tag == 'h1' and not self.h1: self.in_h1 = True
        if tag == 'p' and 'eyebrow' in a.get('class','').split() and not self.category: self.in_eyebrow = True
        if tag == 'time' and not self.date:
            self.date = a.get('datetime', ''); self.in_time = True
        if tag == 'img' and not self.image and ('story' in a.get('class','') or 'article' in a.get('class','')):
            self.image = a.get('src','')
    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
        if tag == 'h1': self.in_h1 = False
        if tag == 'p': self.in_eyebrow = False
        if tag == 'time': self.in_time = False
    def handle_data(self, s):
        if self.in_title: self.head_title += s
        if self.in_h1: self.h1 += s
        if self.in_eyebrow: self.category += s

def norm_image(src, file):
    if not src: return 'images/logo/FrontFPV.webp'
    if src.startswith(('https://','http://','/')): return src
    return (file.parent / src).relative_to(ROOT).as_posix() if not src.startswith('../') else (Path('articles') / src).as_posix()  # normalized below

def main():
    items = []
    if not FOLDER.exists():
        print('No articles folder; nothing to index')
        return
    for file in sorted(FOLDER.rglob('*.html')):
        if file.name.lower() == 'index.html': continue
        parser = ArticleParser()
        parser.feed(file.read_text(encoding='utf-8'))
        title = (parser.h1 or parser.head_title).strip()
        title = re.sub(r'\s*[|–-]\s*Heath FPV\s*$', '', title).strip()
        if not title: continue
        rawimage = parser.image
        if rawimage and not rawimage.startswith(('https://','http://','/')):
            # URLs inside articles are relative to the article folder, e.g. ../images/...
            from posixpath import normpath, join
            image = normpath(join(file.parent.relative_to(ROOT).as_posix(), rawimage))
        else: image = rawimage or 'images/logo/FrontFPV.webp'
        category = re.sub(r'\s+', ' ', parser.category).strip() or 'Article'
        iso_date = parser.date if re.fullmatch(r'\d{4}-\d{2}-\d{2}',parser.date) else '1970-01-01'
        items.append({'title':title, 'url':file.relative_to(ROOT).as_posix(), 'date':iso_date, 'category':category, 'description':parser.description.strip(), 'image':image})
    items.sort(key=lambda a:(a['date'],a['url']),reverse=True)
    output = FOLDER / 'index.json'
    output.write_text(json.dumps(items,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(f'Indexed {len(items)} articles in {output}')

if __name__ == '__main__':main()
