import numpy as np, json, subprocess, re, math, random
from PIL import Image, ImageDraw
from scipy import ndimage as nd
S='/private/tmp/claude-501/-Users-2look/1d5c92e8-69bd-4374-810e-d2844cd2c8e7/scratchpad'
OUT='/Users/2look/Desktop/CLAUDE/01_프로젝트/청산도/사이트_HTML/keymap_work.html'
g=np.array(Image.open(S+'/src.png').convert('L')).astype(np.uint8)
H,W=g.shape;J=json.load(open(S+'/polys.json'));polys=[J['L'],J['U']]
m=Image.new('L',(W,H),0);d=ImageDraw.Draw(m)
for p in polys: d.polygon([tuple(q) for q in p],fill=255)
inside=np.array(m)>0
ln=Image.new('L',(W,H),0);d=ImageDraw.Draw(ln)
for p in polys: d.line([tuple(q) for q in p+[p[0]]],fill=255,width=1)
dist=nd.distance_transform_edt(np.array(ln)==0)
T=np.load(S+'/thick.npy');Td=nd.binary_dilation(T,iterations=4)
a=g.copy()
M=60;a[:M,:]=255;a[-M:,:]=255;a[:,:M]=255;a[:,-M:]=255
R=(g>=236)&(g<248)
Rc=nd.binary_closing(nd.binary_opening(R,iterations=4),iterations=6)
lab,n=nd.label(Rc);sz=nd.sum(Rc,lab,range(1,n+1));Rc=np.isin(lab,1+np.nonzero(sz>20000)[0])
# building faces: regions enclosed by dark lines, filled flat
open_=g>=110
lab2,n2=nd.label(open_)
med=nd.median(g,lab2,range(1,n2+1));area=nd.sum(open_,lab2,range(1,n2+1))
bld=np.zeros_like(open_);roof=np.zeros_like(open_)
# community building: outline has gaps, close it inside its bbox
x0,x1,y0,y1=1300,1850,2250,2620
cs=nd.binary_closing(g[y0:y1,x0:x1]<200,iterations=4);fs=nd.binary_fill_holes(cs)&~cs
lb,nb=nd.label(fs)
for j in range(1,nb+1):
    q=lb==j
    if q.sum()<5000: continue
    q=nd.binary_dilation(q,iterations=4)&(g[y0:y1,x0:x1]>=110);mv=np.median(g[y0:y1,x0:x1][q])
    roof[y0:y1,x0:x1]|=q;a[y0:y1,x0:x1][q]=163 if mv<182 else (200 if mv<225 else 241)
for i in range(n2):
    if 800<area[i]<250000 and 140<=med[i]<=215:
        f=nd.binary_fill_holes(lab2==i+1);bld|=f
        a[f&(g>=110)]=163 if med[i]<182 else 200
def fillsmall(R,t=12000):
    hl,hn=nd.label(~R);hs=nd.sum(~R,hl,range(1,hn+1));return R|np.isin(hl,1+np.nonzero(hs<t)[0])
nondark=~nd.binary_dilation(g<110,iterations=1)
nl,nn=nd.label(nondark);ns=nd.sum(nondark,nl,range(1,nn+1));small=np.isin(nl,1+np.nonzero(ns<15000)[0])
Rc=fillsmall(nd.binary_closing(Rc,iterations=8))
bx=Image.new('L',(W,H),0);ImageDraw.Draw(bx).polygon([(870,3380),(975,3380),(1000,3640),(900,3640)],fill=255)
Rc|=(np.array(bx)>0)&nondark&(g>=200)
Rc|=nd.binary_dilation(Rc,iterations=6)&nondark&(g>=200)
Rc&=~small;Rc=fillsmall(nd.binary_closing(Rc,iterations=3))
wb=Image.new('L',(W,H),0);ImageDraw.Draw(wb).rectangle((1790,3120,1860,3250),fill=255);Rc&=~(np.array(wb)>0)
Rc=Rc&~nd.binary_dilation(roof,iterations=8)&~bld
Rc=Rc|(nd.binary_dilation(Rc,iterations=3)&(g>=200)&~roof&~bld)
Ri=Rc&(g>=110)&~nd.binary_dilation(g<110,iterations=1)
a[Ri]=int(np.median(g[R]))
a[(dist<11)|(Td&(dist<32))]=255
# thin dash-dot "+" leftovers near line
a[(dist<20)&(a<150)&nd.binary_dilation(g<90,iterations=1)&~nd.binary_dilation(inside&(dist>20),iterations=1)]=255
insD=nd.binary_dilation(inside,iterations=30)
YY,XX=np.mgrid[0:H,0:W]
green=Rc&~insD&(YY<1760)&((XX<1880+(1800-YY)*820/1650)|((YY<700)&(XX<2800)))
red=Rc&insD
grayr=Rc&~red&~green
a[nd.binary_dilation(grayr|green,iterations=14)&~insD]=255
Image.fromarray(a).save(S+'/clean.png');A0=a.copy()
cols={'l1':(248,'#f0f0ef'),'l2':(236,'#d6d6d4'),'l3':(212,'#bcbcba'),'l4':(180,'#7d7d7b'),'l5':(120,'#2a2a2a')}
groups=[]
for k,(th,c) in cols.items():
    b=np.where(a<th,0,255).astype(np.uint8);Image.fromarray(b).convert('1').save(f'{S}/c_{k}.bmp')
    subprocess.run(['potrace','-s','-t','3','-a','1.0','-O','0.4','-o',f'{S}/c_{k}.svg',f'{S}/c_{k}.bmp'],check=True)
    sv=open(f'{S}/c_{k}.svg').read();gm=re.search(r'<g transform.*?</g>',sv,re.S).group(0)
    gm=re.sub(r'fill="#000000"',f'fill="{c}"',gm);groups.append(gm)
rg=''
for nm,mk,col in (('road-in',red,'#e2463b'),):
    Image.fromarray(np.where(mk,0,255).astype(np.uint8)).convert('1').save(S+'/road.bmp')
    subprocess.run(['potrace','-s','-t','20','-a','1.0','-O','0.4','-o',S+'/road.svg',S+'/road.bmp'],check=True)
    rg+=f'<g id="{nm}" opacity=".8">'+re.search(r'<g transform.*?</g>',open(S+'/road.svg').read(),re.S).group(0).replace('fill="#000000"',f'fill="{col}"')+'</g>'
# public road (user blue strokes)
PW=60
pubd='';PR=Image.new('L',(W,H),0);pdr=ImageDraw.Draw(PR)
for st in json.load(open(S+'/road_public.json')):
    p=st['p'] if isinstance(st,dict) else st
    if len(p)<10: continue
    P=np.array(p,float);k=15
    Q=np.array([P[max(0,i-k):i+k+1].mean(0) for i in range(len(P))]);Q[0]=P[0];Q[-1]=P[-1]
    keep=[0]
    for i in range(1,len(Q)):
        if np.hypot(*(Q[i]-Q[keep[-1]]))>=25: keep.append(i)
    if keep[-1]!=len(Q)-1: keep.append(len(Q)-1)
    Q=Q[keep];pdr.line([tuple(q) for q in Q],fill=255,width=PW,joint='curve')
    pubd+='M'+' L'.join(f'{q[0]:.0f},{q[1]:.0f}' for q in Q)
PR=np.array(PR)>0
Image.fromarray(np.where(PR,0,255).astype(np.uint8)).convert('1').save(S+'/road.bmp')
subprocess.run(['potrace','-s','-t','20','-a','1.0','-O','0.4','-o',S+'/road.svg',S+'/road.bmp'],check=True)
pubg='<g id="road-public" opacity=".8">'+re.search(r'<g transform.*?</g>',open(S+'/road.svg').read(),re.S).group(0).replace('fill="#000000"','fill="#9c9c9a"')+'</g>'
# roads v3: smoothed constant-width centerlines, access hugs boundary, filleted junctions
LH=8;AW=84;CW=64
dO=nd.distance_transform_edt(~inside);dI=nd.distance_transform_edt(inside);SD=dO-dI
gy,gx=np.gradient(nd.gaussian_filter(SD,3))
def samp(A,x,y):
    xi=np.clip(np.round(x).astype(int),0,W-1);yi=np.clip(np.round(y).astype(int),0,H-1);return A[yi,xi]
def resamp(P,step=8):
    d=np.r_[0,np.cumsum(np.hypot(*np.diff(P,axis=0).T))];t=np.arange(0,d[-1],step)
    return np.c_[np.interp(t,d,P[:,0]),np.interp(t,d,P[:,1])]
def smooth(P,sig):
    Q=np.c_[nd.gaussian_filter1d(P[:,0],sig,mode='nearest'),nd.gaussian_filter1d(P[:,1],sig,mode='nearest')];Q[0]=P[0];Q[-1]=P[-1];return Q
def hug(P,tgt,near):
    P=P.copy()
    for _ in range(6):
        sd=samp(SD,P[:,0],P[:,1]);m=sd<near
        g=np.c_[samp(gx,P[:,0],P[:,1]),samp(gy,P[:,0],P[:,1])];n=np.hypot(g[:,0],g[:,1])+1e-6
        P[m]+=((tgt-sd[m])/n[m])[:,None]*g[m]
    return P
RD=Image.new('L',(W,H),0);rdr=ImageDraw.Draw(RD)
def draw(P,w):
    rdr.line([tuple(q) for q in P],fill=255,width=int(w),joint='curve')
    for q in (P[0],P[-1]): rdr.ellipse((q[0]-w/2,q[1]-w/2,q[0]+w/2,q[1]+w/2),fill=255)
for st in json.load(open(S+'/road_public.json')):
    p=st['p'] if isinstance(st,dict) else st
    if len(p)<10: continue
    draw(smooth(resamp(np.array(p,float)),10),CW)
for st in json.load(open(S+'/road_access.json')):
    P=smooth(resamp(np.array(st['p'],float)),5)
    P=hug(P,LH+AW/2,AW*1.6)
    P=smooth(resamp(P),14);P=hug(P,LH+AW/2,AW*1.6)
    draw(P,AW)
AR=np.array(RD)>0
def dclose(M,r): return nd.distance_transform_edt(nd.distance_transform_edt(~M)<=r)>r
def dopen(M,r): return nd.distance_transform_edt(~(nd.distance_transform_edt(M)>r))<=r
AR=dopen(dclose(AR,70)&(dO>LH),14)
AR=nd.gaussian_filter(AR.astype(float),3)>.5
# pen fixes v5: blue=delete, purple=constant-width connector, red=remove knobs, orange=flat cut on site line
M5=json.loads(open(S+'/memo5.bin','rb').read().decode('utf-16-le'))
def pmask(p):
    I=Image.new('L',(W,H),0);ImageDraw.Draw(I).polygon([tuple(q) for q in p],fill=255);return np.array(I)>0
for st in M5:
    c=st['c'];pm=pmask(st['p'])
    if c=='#1f6fff': AR&=~pm
    elif c=='#e00000':
        AR&=~nd.binary_dilation(pm,iterations=6)
    elif c=='#8a2be2':
        ys,xs=np.nonzero(AR&pm);P=np.c_[xs,ys].astype(float);mu=P.mean(0)
        u=np.linalg.svd(P-mu,full_matrices=False)[2][0]
        AR&=~pm;keep=AR.copy()
        t=(np.array(st['p'],float)-mu)@u;a=mu+u*(t.min()-30);b=mu+u*(t.max()+30)
        C=Image.new('L',(W,H),0);ImageDraw.Draw(C).line([tuple(a),tuple(b)],fill=255,width=AW)
        AR=keep|(np.array(C)>0)
        AR=AR|(dclose(AR,22)&nd.binary_dilation(pm,iterations=40))
    elif c=='#ff7a00':
        U=json.load(open(S+'/polys.json'))['U'];p0=np.array(U[18]);d=np.array(U[19])-p0;n=np.array([d[1],-d[0]])
        yy,xx=np.mgrid[0:H,0:W];side=(xx-p0[0])*n[0]+(yy-p0[1])*n[1]
        s_body=np.sign(((np.array(U[16])-p0)*n).sum())
        AR&=~((np.sign(side)!=s_body)&nd.binary_dilation(pm,iterations=120))
# pen fixes v6: red loops = smooth awkward seams (local close + blur)
M6=json.loads(open(S+'/memo6.bin','rb').read().decode('utf-16-le'))
for st in M6:
    if st['c']!='#e00000' or np.mean([q[0] for q in st['p']])>2500: continue
    pm=pmask(st['p']);ys,xs=np.nonzero(pm);y0,y1,x0,x1=max(ys.min()-260,0),ys.max()+260,max(xs.min()-260,0),xs.max()+260
    a=AR[y0:y1,x0:x1];sd=lambda m:nd.distance_transform_edt(m)-nd.distance_transform_edt(~m)
    pr=pm[y0:y1,x0:x1];rn=nd.binary_dilation(red[y0:y1,x0:x1],iterations=8)&nd.binary_dilation(pr,iterations=40)
    if rn.any(): a=a|rn
    f2=nd.gaussian_filter(sd(dclose(a,70)),16 if not rn.any() else 26)
    w=np.clip(nd.gaussian_filter(nd.binary_dilation(pr,iterations=45).astype(float),14)*1.6,0,1)
    AR[y0:y1,x0:x1]=(w*f2+(1-w)*sd(a))>0
# v6 straighten 2단지 access road (two red loops merged)
pm=np.zeros((H,W),bool)
for st in M6:
    if st['c']=='#e00000' and np.mean([q[0] for q in st['p']])>2500: pm|=pmask(st['p'])
if pm.any():
    ys,xs=np.nonzero(pm);y0,y1,x0,x1=max(ys.min()-320,0),ys.max()+320,max(xs.min()-320,0),xs.max()+320
    a=AR[y0:y1,x0:x1];pr=pm[y0:y1,x0:x1];sd=lambda m:nd.distance_transform_edt(m)-nd.distance_transform_edt(~m)
    lab,_=nd.label(a);ids=np.unique(lab[nd.binary_dilation(pr,iterations=40)&a]);seg=np.isin(lab,ids[ids>0])&nd.binary_dilation(pr,iterations=260)
    dt=nd.distance_transform_edt(a);py,px=np.nonzero(seg&(dt>6));P=np.c_[px,py].astype(float);mu=P.mean(0)
    u=np.linalg.svd(P-mu,full_matrices=False)[2][0];nv=np.array([-u[1],u[0]]);t=(P-mu)@u;v=(P-mu)@nv
    cf=np.polyfit(t,v,2);tt=np.linspace(t.min()-120,t.max()+120,400);L=mu+np.outer(tt,u)+np.outer(np.polyval(cf,tt),nv)
    ci=np.clip(L.round().astype(int),0,[a.shape[1]-1,a.shape[0]-1]);dc=dt[ci[:,1],ci[:,0]];wd=max(int(2*np.median(dc[dc>0])),AW)
    B=Image.new('L',(x1-x0,y1-y0),0);bd=ImageDraw.Draw(B);r=wd/2
    for q in L: bd.ellipse((q[0]-r,q[1]-r,q[0]+r,q[1]+r),fill=255)
    w=np.clip(nd.gaussian_filter(nd.binary_dilation(pr,iterations=110).astype(float),40)*1.8,0,1)*seg.any()
    w*=nd.binary_dilation(seg|(np.array(B)>0),iterations=30)
    AR[y0:y1,x0:x1]=(w*sd(np.array(B)>0)+(1-w)*sd(a))>0
    print('wd',wd)
# v7: merge inner roads into the gray road layer (one flat shape, smoothed seams)
sd=lambda m:nd.distance_transform_edt(m)-nd.distance_transform_edt(~m)
# v8: redraw inner roads as clean constant-width bands from their skeleton
def zs(B):
    B=B.copy().astype(np.uint8)
    while True:
        ch=False
        for st in (0,1):
            P=np.pad(B,1);n=[P[:-2,1:-1],P[:-2,2:],P[1:-1,2:],P[2:,2:],P[2:,1:-1],P[2:,:-2],P[1:-1,:-2],P[:-2,:-2]]
            Bn=sum(n);Ar=sum(((n[i]==0)&(n[(i+1)%8]==1)) for i in range(8))
            c=(B==1)&(Bn>=2)&(Bn<=6)&(Ar==1)
            c&=(((n[0]*n[2]*n[4])==0)&((n[2]*n[4]*n[6])==0)) if st==0 else (((n[0]*n[2]*n[6])==0)&((n[0]*n[4]*n[6])==0))
            if c.any(): B[c]=0;ch=True
        if not ch: return B>0
RB=dopen(red,6);RB=nd.gaussian_filter(RB.astype(float),6)>.5
K=zs(nd.binary_closing(RB[::4,::4],iterations=2))
IW=int(2*4*np.median(nd.distance_transform_edt(RB[::4,::4])[K]))
def nb(y,x): return [(y+dy,x+dx) for dy in (-1,0,1) for dx in (-1,0,1) if (dy or dx) and 0<=y+dy<K.shape[0] and 0<=x+dx<K.shape[1] and K[y+dy,x+dx]]
deg={(y,x):len(nb(y,x)) for y,x in zip(*np.nonzero(K))}
nodes={q for q,d in deg.items() if d!=2}
seen=set();edges=[]
for n0 in nodes:
    for q in nb(*n0):
        if (n0,q) in seen: continue
        path=[n0,q];prev=n0
        while path[-1] not in nodes:
            nx=[r for r in nb(*path[-1]) if r!=prev and r not in path[-3:]]
            if not nx: break
            prev=path[-1];path.append(nx[0])
        seen.add((path[-1],path[-2]));seen.add((n0,q));edges.append(path)
RI=Image.new('L',(W,H),0);rdi=ImageDraw.Draw(RI);INL=[]
for e in edges:
    P=np.array([(x*4+2,y*4+2) for y,x in e],float)
    end=[deg[e[0]]==1,deg[e[-1]]==1]
    if len(P)*4<IW*1.2 and any(end): continue
    if len(P)>3: P=smooth(resamp(P),6)
    INL.append(P)
    rdi.line([tuple(q) for q in P],fill=255,width=IW,joint='curve')
    for q in (P[0],P[-1]):
        r=IW/2;rdi.ellipse((q[0]-r,q[1]-r,q[0]+r,q[1]+r),fill=255)
RM=np.array(RI)>0
RM=dopen(dclose(RM,24),8)&insD
np.save(S+'/RM.npy',RM)
RM=np.zeros_like(RM)  # v9: inner roads back to original plan (user will draw)
print('IW',IW,'edges',len(edges),'kept',len(INL))
touch=nd.binary_dilation(RM,iterations=8)&nd.binary_dilation(AR,iterations=8)
AR=AR|RM
AR=AR|(dclose(AR,30)&nd.binary_dilation(touch,iterations=50))
rg=''
# v7b: clear plan marks under roads so the road reads as one flat fill
a=A0;a[nd.binary_erosion(AR,iterations=2)]=255
# v10: inside the complexes use the untouched source plan (no gray road fill)
IN=nd.binary_dilation(inside,iterations=12)&~nd.binary_erosion(AR,iterations=2);a[IN]=g[IN]
# v9: erase V check / entrance tick marks (thin dark strokes only)
VP=[(680,442),(484,484),(430,657),(557,640),(772,397),(373,322),(458,300),(330,477),(303,497),(297,697),(325,782),(688,617),(366,318)]
VP=[(300+2*x,2050+2*y) for x,y in VP]+[(2500+x*5/3,300+y*5/3) for x,y in ((402,152),(340,335),(350,393),(470,483),(343,345))]
thk=nd.binary_dilation(nd.binary_opening(g<120,np.ones((3,3))),iterations=1)
VZ=np.zeros_like(thk)
for x,y in VP: VZ|=(XX-x)**2+(YY-y)**2<46**2
VE=VZ&(g<215)&~thk
np.save(S+'/VE.npy',VE)
a[VE]=255
groups=[]
for k,(th,c) in cols.items():
    b=np.where(a<th,0,255).astype(np.uint8);Image.fromarray(b).convert('1').save(f'{S}/c_{k}.bmp')
    subprocess.run(['potrace','-s','-t','3','-a','1.0','-O','0.4','-o',f'{S}/c_{k}.svg',f'{S}/c_{k}.bmp'],check=True)
    sv=open(f'{S}/c_{k}.svg').read();gm=re.search(r'<g transform.*?</g>',sv,re.S).group(0)
    gm=re.sub(r'fill="#000000"',f'fill="{c}"',gm);groups.append(gm)
PR=AR
Image.fromarray(np.where(AR,0,255).astype(np.uint8)).convert('1').save(S+'/road.bmp')
subprocess.run(['potrace','-s','-t','40','-a','1.2','-O','0.6','-o',S+'/road.svg',S+'/road.bmp'],check=True)
pubg='<g id="road-access">'+re.search(r'<g transform.*?</g>',open(S+'/road.svg').read(),re.S).group(0).replace('fill="#000000"','fill="#afafad"')+'</g>'
# trees
inner=inside
dout=nd.distance_transform_edt(~inner)
random.seed(7);trees=[]
ys,xs=np.nonzero((dout>45)&(dout<360)&~nd.binary_dilation(red|PR,iterations=45)&(np.arange(W)[None,:]>M)&(np.arange(H)[:,None]>M));idx=list(range(len(xs)));random.shuffle(idx)
for i in idx[:60000]:
    x,y=int(xs[i]),int(ys[i]);dd=dout[y,x]
    r=random.uniform(46,78)*(1.0 if dd<200 else 0.85)
    if dd<r+28: continue
    if x<r or y<r or x>W-r or y>H-r: continue
    if random.random()<(dd-120)/400: continue
    if all((x-tx)**2+(y-ty)**2>((r+tr)*0.86)**2 for tx,ty,tr in trees): trees.append((x,y,r))
def tree(x,y,r):
    n=random.choice([9,10,11,12]);rot=random.uniform(0,6.28);pts=[]
    for k in range(n):
        t0=rot+2*math.pi*k/n;t1=rot+2*math.pi*(k+1)/n;rr=r*random.uniform(.9,1.0)
        if k==0: pts.append(f'M{x+rr*math.cos(t0):.1f},{y+rr*math.sin(t0):.1f}')
        tm=(t0+t1)/2;rb=r*1.18
        pts.append(f'Q{x+rb*math.cos(tm):.1f},{y+rb*math.sin(tm):.1f} {x+r*math.cos(t1):.1f},{y+r*math.sin(t1):.1f}')
    p=''.join(pts)+'Z'
    return (f'<circle cx="{x+r*.22:.1f}" cy="{y+r*.26:.1f}" r="{r*1.05:.1f}" class="ts"/>',
            f'<path d="{p}" class="tc"/><circle cx="{x}" cy="{y}" r="{max(4,r*.09):.1f}" class="td"/>')
tr=[tree(*t) for t in trees]
sh=''.join(t[0] for t in tr);cn=''.join(t[1] for t in tr)
bl=''.join(f'<polygon points="{" ".join(f"{q[0]:.1f},{q[1]:.1f}" for q in p)}" class="sb"/>' for p in polys)
xs_=[q[0] for p in polys for q in p];ys_=[q[1] for p in polys for q in p];pad=400
vb=f'{min(xs_)-pad:.0f} {min(ys_)-pad:.0f} {max(xs_)-min(xs_)+2*pad:.0f} {max(ys_)-min(ys_)+2*pad:.0f}'
import re as _re
_a=open(S+'/ai_user_v2.svg',encoding='latin-1').read()
_a=_a[_a.find('>',_a.find('<svg'))+1:_a.rfind('</svg>')]
AIG='<g id="ai-plan" transform="translate(71,-51) scale(%.6f,%.6f)">'%(4025/754.688,4412/827.25)+_a+open(S+'/bfill_g.svg').read()+open(S+'/fix_g.svg').read()+open(S+'/nature_g.svg').read()+open(S+'/sea_g.svg').read()+'</g>'

html=f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><title>취향섬 키맵 작업</title>
<style>html,body{{margin:0;background:#fafaf9;overflow:hidden;touch-action:none}}svg{{display:block;width:100%;height:100vh}}
.ts{{fill:#000;opacity:.06}}.tc{{fill:#e4e4e2;stroke:#9a9a98;stroke-width:5;stroke-linejoin:round}}.td{{fill:#9a9a98}}
.sb{{fill:none;stroke:#2a2a2a;stroke-width:14;stroke-linejoin:round}}.pr{{fill:none;stroke:#8a8a88;stroke-width:70;stroke-linecap:round;stroke-linejoin:round}}.pc{{fill:none;stroke:#fff;stroke-width:5;stroke-dasharray:40 30;stroke-linecap:butt;stroke-linejoin:round}}.lb{{font:700 120px sans-serif;fill:#2a2a2a}}.mp{{fill:none;stroke-width:14;stroke-linecap:round;stroke-linejoin:round}}#hit{{cursor:crosshair;touch-action:none}}#tb{{position:fixed;top:12px;left:12px;display:flex;gap:6px;flex-wrap:wrap}}#tb button{{font:600 13px sans-serif;padding:7px 11px;border:1px solid #bbb;background:#fff;border-radius:6px;cursor:pointer}}#tb button.on{{color:#fff}}#pal{{display:flex;gap:4px;align-items:center}}#tb .sw{{width:28px;height:28px;padding:0;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #bbb}}#tb .sw.sel{{box-shadow:0 0 0 3px #2a2a2a}}</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="{vb}" preserveAspectRatio="xMidYMid meet">

{AIG}
<g id="memo"></g><rect id="hit" x="{vb.split()[0]}" y="{vb.split()[1]}" width="{vb.split()[2]}" height="{vb.split()[3]}" fill="transparent" style="display:none"/></svg>
<div id="tb"><button id="bPen" class="on">펜</button><span id="pal"></span><button id="bUndo">되돌리기</button><button id="bClr">전부 지우기</button><button id="bPng">PNG 저장</button><button id="bZi">확대</button><button id="bZo">축소</button><button id="bZr">전체 보기</button></div>
<script>
(function(){{
var svg=document.querySelector('svg'),memo=document.getElementById('memo'),hit=document.getElementById('hit'),K='chq_keymap_memo_v9',strokes=[],cur=null,pen=true,col='#ff7a00',C=[['파랑','#1f6fff'],['주황','#ff7a00'],['빨강','#e00000'],['보라','#8a2be2'],['노랑','#ffd400'],['검정','#111111']];
try{{strokes=JSON.parse(localStorage.getItem(K)||'[]')||[]}}catch(e){{strokes=[]}}
function save(){{try{{localStorage.setItem(K,JSON.stringify(strokes))}}catch(e){{}}}}
function d(p){{return p.map(function(q,i){{return (i?'L':'M')+q[0]+','+q[1]}}).join('')}}
function draw(){{memo.innerHTML='';strokes.forEach(function(s){{if(Array.isArray(s))s={{c:'#ff7a00',p:s}};var e=document.createElementNS('http://www.w3.org/2000/svg','path');e.setAttribute('d',d(s.p));e.setAttribute('class','mp');e.setAttribute('stroke',s.c);memo.appendChild(e)}})}}
var pal=document.getElementById('pal');C.forEach(function(k){{var b=document.createElement('button');b.className='sw';b.title=k[0];b.style.background=k[1];b.onclick=function(){{col=k[1];setPen(true);mark()}};pal.appendChild(b)}});
function mark(){{[].forEach.call(pal.children,function(b,i){{b.classList.toggle('sel',C[i][1]===col)}});document.getElementById('bPen').style.background=pen?col:'';document.getElementById('bPen').style.borderColor=pen?col:''}}
function pt(ev){{var p=svg.createSVGPoint();p.x=ev.clientX;p.y=ev.clientY;p=p.matrixTransform(svg.getScreenCTM().inverse());return [Math.round(p.x),Math.round(p.y)]}}
function setPen(v){{pen=v;hit.style.display=v?'':'none';document.getElementById('bPen').className=v?'on':'';mark()}}
hit.addEventListener('pointerdown',function(ev){{cur={{c:col,p:[pt(ev)]}};strokes.push(cur);hit.setPointerCapture(ev.pointerId);draw()}});
hit.addEventListener('pointermove',function(ev){{if(!cur)return;cur.p.push(pt(ev));draw()}});
function end(){{if(cur){{cur=null;save()}}}}
hit.addEventListener('pointerup',end);hit.addEventListener('pointercancel',end);
document.getElementById('bPen').onclick=function(){{setPen(!pen)}};
document.getElementById('bUndo').onclick=function(){{strokes.pop();save();draw()}};
document.getElementById('bClr').onclick=function(){{if(confirm('메모를 전부 지울까요?')){{strokes=[];save();draw()}}}};
document.getElementById('bPng').onclick=function(){{
  var w=2000,h=Math.round(w*V0[3]/V0[2]),c=svg.cloneNode(true);c.querySelector('#hit').remove();c.setAttribute('viewBox',V0.join(' '));
  c.setAttribute('width',w);c.setAttribute('height',h);
  var st=document.createElementNS('http://www.w3.org/2000/svg','style');st.textContent=document.querySelector('style').textContent;c.insertBefore(st,c.firstChild);
  var img=new Image();img.onload=function(){{var cv=document.createElement('canvas');cv.width=w;cv.height=h;var x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(img,0,0,w,h);
    var a=document.createElement('a');a.download='keymap_memo.png';a.href=cv.toDataURL('image/png');a.click()}};
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(c));
}};
// zoom/pan inside the page (browser pinch zoom breaks pen coords)
var V0=svg.getAttribute('viewBox').split(' ').map(Number),V=V0.slice(),gs=false,g0=1;
function setV(){{svg.setAttribute('viewBox',V.join(' '))}}
function zoomAt(cx,cy,f){{var p=svg.createSVGPoint();p.x=cx;p.y=cy;p=p.matrixTransform(svg.getScreenCTM().inverse());
  var nw=Math.max(V0[2]/40,Math.min(V0[2]*1.5,V[2]/f)),k=nw/V[2];V=[p.x-(p.x-V[0])*k,p.y-(p.y-V[1])*k,V[2]*k,V[3]*k];setV()}}
window.addEventListener('wheel',function(e){{e.preventDefault();
  if(e.ctrlKey){{if(!gs)zoomAt(e.clientX,e.clientY,Math.exp(-e.deltaY*0.01))}}
  else{{var r=svg.getScreenCTM().a;V[0]+=e.deltaX/r;V[1]+=e.deltaY/r;setV()}}}},{{passive:false}});
document.addEventListener('gesturestart',function(e){{e.preventDefault();gs=true;g0=1}});
document.addEventListener('gesturechange',function(e){{e.preventDefault();zoomAt(e.clientX,e.clientY,e.scale/g0);g0=e.scale}});
document.addEventListener('gestureend',function(e){{e.preventDefault();gs=false}});
document.getElementById('bZi').onclick=function(){{zoomAt(innerWidth/2,innerHeight/2,1.5)}};
document.getElementById('bZo').onclick=function(){{zoomAt(innerWidth/2,innerHeight/2,1/1.5)}};
document.getElementById('bZr').onclick=function(){{V=V0.slice();setV()}};
setPen(true);draw();
}})();
</script></body></html>'''
open(OUT,'w').write(html);print(len(trees),'trees',vb,len(html)//1024,'KB')
