# index.html의 공통 부분(헤드 인라인 style, 상단바, 상단 메뉴와 하단 메뉴, 푸터)을 하위 페이지 5개에 복사한다.
# 사용: /usr/bin/python3 -I sync_common.py </dev/null
import os, re
d = os.path.dirname(os.path.abspath(__file__)) + '/'
PAGES = ['cheongsando', 'masterplan', 'invest', 'ecosystem', 'archive', 'consult']

def cut(s, a, b, start=0):
    i = s.index(a, start); j = s.index(b, i) + len(b)
    return i, j

src = open(d + 'index.html', encoding='utf-8').read()
STY = ('<style>', '</style>')
NAV = ('<div class="marketsMenu"', '<main id="swup"')
FOOT = ('<footer ', '</footer>')
TOP = ('<div class="navigationMain__topBar">', '<div class="navigationMain__topBarItems">')
blocks = {k: src[slice(*cut(src, *v))] for k, v in {'sty': STY, 'nav': NAV, 'foot': FOOT, 'top': TOP}.items()}

for p in PAGES:
    f = d + p + '.html'
    s = open(f, encoding='utf-8').read()
    for k, v in (('sty', STY), ('top', TOP), ('nav', NAV), ('foot', FOOT)):
        i, j = cut(s, *v)
        s = s[:i] + blocks[k] + s[j:]
    # 상단바를 메인 페이지 스크롤 후 모양(작은 마크, 글자 메뉴)으로 고정
    s = re.sub(r'<body class="chqSub[^"]*"( data-page="home")?', '<body class="chqSub is-pastHero" data-page="home"', s, count=1)
    # 상단바 글자 메뉴에서 자기 페이지 항목을 진하게 (aria-current)
    t0 = s.index('<nav class="topBarMenu"'); t1 = s.index('</nav>', t0)
    s = s[:t0] + s[t0:t1].replace('<a href="%s.html">' % p, '<a href="%s.html" aria-current="page">' % p, 1) + s[t1:]
    # 하단 메뉴에서 자기 페이지 항목에 current-menu 표시
    m0 = s.index('<div class="marketsMenu"'); m1 = s.index('</nav>', m0)
    h = s.index('href="%s.html"' % p, m0)
    if h < m1:
        li = s.rindex('<li class="marketsMenu__item"', m0, h)
        e = s.index('>', li)
        s = s[:e] + ' current-menu' + s[e:]
    open(f, 'w', encoding='utf-8').write(s)
    print(p, 'ok')
