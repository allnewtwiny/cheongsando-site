import sys,base64,io,numpy as np
from PIL import Image,ImageDraw
from scipy import ndimage as nd
S=sys.argv[1];rng=np.random.default_rng(7)
H,W=4962,4530
mw=np.load(S+'/nat_mask_w.npy').astype(np.uint8)*255
m=np.array(Image.fromarray(mw).resize((W,H),Image.NEAREST))>0
m=nd.binary_erosion(m,iterations=5)
def noise(sig,seed):
    r=np.random.default_rng(seed).random((H//8,W//8));r=nd.gaussian_filter(r,sig/8)
    r=(r-r.mean())/r.std();return np.array(Image.fromarray(r.astype(np.float32)).resize((W,H),Image.BILINEAR))
n1=noise(260,1);n2=noise(180,2);n3=noise(60,3)
forest=(n1+0.35*n3)>0.55
field=(~forest)&((n2+0.3*n3)>0.75)
img=Image.new('L',(W,H),246);d=ImageDraw.Draw(img)
# fields: soft parallel furrows per patch
lab,nf=nd.label(field)
for i in range(1,nf+1):
    ys,xs=np.nonzero(lab[::4,::4]==i)
    if len(xs)<20: continue
    ang=rng.uniform(0,np.pi);ux,uy=np.cos(ang),np.sin(ang);px,py=-uy,ux
    cx,cy=xs.mean()*4,ys.mean()*4;R=max(np.ptp(xs),np.ptp(ys))*4
    pm=Image.fromarray(((lab==i)*255).astype(np.uint8))
    layer=Image.new('L',(W,H),0);ld=ImageDraw.Draw(layer)
    for k in np.arange(-R,R,9):
        x0,y0=cx+px*k-ux*R,cy+py*k-uy*R;x1,y1=cx+px*k+ux*R,cy+py*k+uy*R
        ld.line((x0,y0,x1,y1),fill=255,width=2)
    img.paste(Image.new("L",(W,H),198),(0,0),Image.fromarray(np.minimum(np.array(layer),np.array(pm))))
d=ImageDraw.Draw(img)
# meadow grass tufts
dens=np.clip(0.5+0.35*n3,0.1,1)
N=int(m.sum()*0.0016)
xs=rng.integers(0,W,N*2);ys=rng.integers(0,H,N*2)
ok=m[ys,xs]&~forest[ys,xs]&(rng.random(N*2)<dens[ys,xs])
for x,y in zip(xs[ok],ys[ok]):
    c=int(rng.integers(130,185))
    for a in rng.uniform(-0.9,0.9,int(rng.integers(2,5))):
        L=rng.uniform(5,11);d.line((x,y,x+np.sin(a)*L,y-np.cos(a)*L),fill=c,width=2)
# stipple
N=int(m.sum()*0.004);xs=rng.integers(0,W,N);ys=rng.integers(0,H,N)
for x,y in zip(xs,ys):
    if m[y,x]: d.point((x,y),fill=int(rng.integers(150,200)))
# forest trees: sort by y, shadow then canopy scribble
fy,fx=np.nonzero(forest[::14,::14]&m[::14,::14]);pts=np.stack([fx*14,fy*14],1)+rng.integers(-6,7,(len(fx),2))
pts=pts[rng.random(len(pts))<0.75];pts=pts[np.argsort(pts[:,1])]
# scattered single trees in meadow
sx=rng.integers(0,W,4000);sy=rng.integers(0,H,4000);k=m[sy,sx]&~forest[sy,sx]&(n3[sy,sx]>1.0)&(rng.random(4000)<0.5)
pts=np.concatenate([pts,np.stack([sx[k],sy[k]],1)]);pts=pts[np.argsort(pts[:,1])]
for x,y in pts:
    r=rng.uniform(11,22)
    d.ellipse((x-r+5,y-r*0.8+7,x+r+7,y+r*0.8+9),fill=200)
    t=np.linspace(0,2*np.pi,int(r*1.6));rr=r*(1+0.13*np.sin(t*rng.integers(5,9)+rng.uniform(0,6))+rng.normal(0,0.04,len(t)))
    poly=list(zip(x+rr*np.cos(t),y+rr*np.sin(t)))
    d.polygon(poly,fill=int(rng.integers(232,244)))
    d.line(poly+[poly[0]],fill=int(rng.integers(95,130)),width=2)
    for _ in range(int(rng.integers(2,5))):
        a=rng.uniform(0,2*np.pi);q=rng.uniform(0.2,0.6)*r;s=rng.uniform(2,5)
        d.arc((x+np.cos(a)*q-s,y+np.sin(a)*q-s,x+np.cos(a)*q+s,y+np.sin(a)*q+s),rng.uniform(0,180),rng.uniform(200,330),fill=150,width=2)
ys,xs=np.nonzero(m);x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
a=np.array(img)[y0:y1,x0:x1];al=(m[y0:y1,x0:x1]*255).astype(np.uint8)
la=Image.fromarray(np.stack([a,al],-1),'LA').resize(((x1-x0)//2,(y1-y0)//2),Image.LANCZOS)
buf=io.BytesIO();la.save(buf,'PNG',optimize=True);b=base64.b64encode(buf.getvalue()).decode()
print('png KB',len(buf.getvalue())//1024)
open(S+'/nature_g.svg','w').write('<g id="nature" transform="scale(%f)"><image x="%d" y="%d" width="%d" height="%d" href="data:image/png;base64,%s"/></g>'%(1/6,x0,y0,x1-x0,y1-y0,b))
Image.fromarray(np.array(img)).resize((W//4,H//4)).save(S+'/nat_prev.png')
