import sys,base64,io,numpy as np
from PIL import Image,ImageDraw
from scipy import ndimage as nd
S=sys.argv[1];rng=np.random.default_rng(11)
H,W=4962,4530
w=np.array(Image.open(S+'/w.png').convert('L')).copy()
w[:110,:1400]=255
wh=w>=250
lab,_=nd.label(wh);seed=lab[1200,1000];mw=lab==seed
print('seed',seed,'frac',mw.mean())
mw[:130,2080:]=False
mw[:,:6]=mw[:,6:7];mw[:4,:]=mw[4:5,:]
m=np.array(Image.fromarray((mw*255).astype(np.uint8)).resize((W,H),Image.NEAREST))>0
m=nd.binary_opening(m,iterations=3);m=nd.binary_erosion(m,iterations=5)
# coast distance: only from the land side (not image borders)
land=np.array(Image.fromarray(((w<250)*255).astype(np.uint8)).resize((W,H),Image.NEAREST))>0
land[:170,:2120]=False
dist=nd.distance_transform_edt(~land)
img=Image.new('RGBA',(W,H),(232,238,241,255));d=ImageDraw.Draw(img)
# soft deepening away from coast
t=np.clip(dist/900,0,1);base=np.stack([232-10*t,238-7*t,241-4*t,np.full_like(t,255)],-1).astype(np.uint8)
img=Image.fromarray(base,'RGBA');d=ImageDraw.Draw(img)
# coastal ripple rings
for k,(r,a) in enumerate([(22,150),(48,115),(84,85),(130,60),(190,40)]):
    ring=(np.abs(dist-r)<1.6)
    ring&=(nd.gaussian_filter(rng.random((H//16+1,W//16+1)),1.5).repeat(16,0).repeat(16,1)[:H,:W]>0.47-0.02*k)
    ys,xs=np.nonzero(ring);c=np.array(img)
    c[ys,xs,:3]=(c[ys,xs,:3]*(1-a/400)+np.array([120,140,150])*(a/400)).astype(np.uint8);img=Image.fromarray(c,'RGBA')
d=ImageDraw.Draw(img)
# scattered wave dashes, more near coast
N=int(m.sum()*0.00045);xs=rng.integers(0,W,N*3);ys=rng.integers(0,H,N*3)
ok=m[ys,xs]&(dist[ys,xs]>230)&(rng.random(N*3)<0.55)
for x,y in zip(xs[ok],ys[ok]):
    L=rng.uniform(14,30);a=int(rng.integers(150,185))
    pts=[(x+u,y+2.2*np.sin(u/L*2*np.pi)) for u in np.linspace(-L/2,L/2,8)]
    d.line(pts,fill=(a-20,a-5,a+5,255),width=2)
ys,xs=np.nonzero(m);x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
a=np.array(img)[y0:y1,x0:x1].copy();a[...,3]=m[y0:y1,x0:x1]*255
im=Image.fromarray(a,'RGBA').resize(((x1-x0)//2,(y1-y0)//2),Image.LANCZOS)
buf=io.BytesIO();im.save(buf,'PNG',optimize=True);b=base64.b64encode(buf.getvalue()).decode()
print('png KB',len(buf.getvalue())//1024)
open(S+'/sea_g.svg','w').write('<g id="sea" transform="scale(%f)"><image x="%d" y="%d" width="%d" height="%d" href="data:image/png;base64,%s"/></g>'%(1/6,x0,y0,x1-x0,y1-y0,b))
