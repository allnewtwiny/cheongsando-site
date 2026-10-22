import sys,base64,io,numpy as np
from PIL import Image,ImageDraw
from scipy import ndimage as nd
S=sys.argv[1];K=1.125
Y0,Y1=165,4200;OX0,OX1=71,4096;EXT=2023;OV=80
o=np.array(Image.open(S+'/orig.png').convert('L')).astype(float)  # 0.5 px/unit, origin (71,-51)
def edge_forest(cols):
    b=o[:,cols];mu=nd.uniform_filter1d(b.mean(1),15);sd=np.sqrt(np.clip(nd.uniform_filter1d((b*b).mean(1),15)-mu**2,0,None));m=nd.uniform_filter1d(b.mean(1),25)
    f=((sd>22)&(m<225)).astype(float);f=nd.uniform_filter1d(f,40)
    return lambda yu: np.interp((yu+51)*0.5,np.arange(len(f)),f)
fL=edge_forest(slice(8,40));fR=edge_forest(slice(-40,-8))
def coast(xu):  # road centre y, left panel; xu<=OX0
    d=OX0+8-xu  # distance leftwards from seam
    s=0.33-0.21*np.clip(d/2023,0,1)  # slope tapers
    y=2581+0.33*d-0.21*d*d/(2*2023)
    return y+18*np.sin(d/310)*np.clip(d/400,0,1)
def panel(side,seed):
    rng=np.random.default_rng(seed)
    if side=='L': ux0,ux1=OX0-EXT,OX0+OV
    else: ux0,ux1=OX1-OV,OX1+EXT
    W=int((ux1-ux0)*K);H=int((Y1-Y0)*K)
    xu=ux0+np.arange(W)/K;yu=Y0+np.arange(H)/K
    X,Y=np.meshgrid(xu,yu)
    if side=='L':
        cy=coast(xu)[None,:];road=np.abs(Y-cy)<34;sea=Y<cy-34;seamd=np.clip(OX0-X,0,None)
    else:
        road=np.zeros((H,W),bool);sea=road.copy();seamd=np.clip(X-OX1,0,None)
    land=~road&~sea;m=nd.binary_erosion(land,iterations=3)
    def noise(sig,sd):
        r=np.random.default_rng(sd).random((H//8+1,W//8+1));r=nd.gaussian_filter(r,sig/8)
        r=(r-r.mean())/r.std();return np.array(Image.fromarray(r.astype(np.float32)).resize((W,H),Image.BILINEAR))
    n1=noise(260,seed+1);n2=noise(180,seed+2);n3=noise(60,seed+3)
    f=(fL if side=='L' else fR)(Y)
    bump=(3.6*np.clip(f*1.6,0,1)-1.2)*np.exp(-seamd/450)
    forest=(n1+0.35*n3+bump)>0.55
    field=(~forest)&((n2+0.3*n3)>0.75)&(seamd>60)
    img=Image.new('L',(W,H),246)
    lab,nf=nd.label(field&m)
    for i in range(1,nf+1):
        ys,xs=np.nonzero(lab[::4,::4]==i)
        if len(xs)<20: continue
        ang=rng.uniform(0,np.pi);ux,uy=np.cos(ang),np.sin(ang);px,py=-uy,ux
        cx,cy_=xs.mean()*4,ys.mean()*4;R=max(np.ptp(xs),np.ptp(ys))*4
        layer=Image.new('L',(W,H),0);ld=ImageDraw.Draw(layer)
        for k in np.arange(-R,R,9):
            ld.line((cx+px*k-ux*R,cy_+py*k-uy*R,cx+px*k+ux*R,cy_+py*k+uy*R),fill=255,width=2)
        img.paste(Image.new('L',(W,H),198),(0,0),Image.fromarray(np.minimum(np.array(layer),(lab==i)*255).astype(np.uint8)))
    d=ImageDraw.Draw(img)
    dens=np.clip(0.5+0.35*n3,0.1,1);N=int(m.sum()*0.0016)
    xs=rng.integers(0,W,N*2);ys=rng.integers(0,H,N*2)
    ok=m[ys,xs]&~forest[ys,xs]&(rng.random(N*2)<dens[ys,xs])
    for x,y in zip(xs[ok],ys[ok]):
        c=int(rng.integers(130,185))
        for a in rng.uniform(-0.9,0.9,int(rng.integers(2,5))):
            L=rng.uniform(5,11);d.line((x,y,x+np.sin(a)*L,y-np.cos(a)*L),fill=c,width=2)
    N=int(m.sum()*0.004);xs=rng.integers(0,W,N);ys=rng.integers(0,H,N)
    for x,y in zip(xs,ys):
        if m[y,x]: d.point((x,y),fill=int(rng.integers(150,200)))
    fy,fx=np.nonzero(forest[::14,::14]&m[::14,::14]);pts=np.stack([fx*14,fy*14],1)+rng.integers(-6,7,(len(fx),2))
    pts=pts[rng.random(len(pts))<0.75]
    n=int(W*H/1.5e4);sx=rng.integers(0,W,n);sy=rng.integers(0,H,n);k=m[sy,sx]&~forest[sy,sx]&(n3[sy,sx]>1.0)&(rng.random(n)<0.5)
    pts=np.concatenate([pts,np.stack([sx[k],sy[k]],1)]);pts=pts[np.argsort(pts[:,1])]
    for x,y in pts:
        r=rng.uniform(11,22)
        d.ellipse((x-r+5,y-r*0.8+7,x+r+7,y+r*0.8+9),fill=200)
        t=np.linspace(0,2*np.pi,int(r*1.6));rr=r*(1+0.13*np.sin(t*rng.integers(5,9)+rng.uniform(0,6))+rng.normal(0,0.04,len(t)))
        poly=list(zip(x+rr*np.cos(t),y+rr*np.sin(t)))
        d.polygon(poly,fill=int(rng.integers(232,244)));d.line(poly+[poly[0]],fill=int(rng.integers(95,130)),width=2)
        for _ in range(int(rng.integers(2,5))):
            a=rng.uniform(0,2*np.pi);q=rng.uniform(0.2,0.6)*r;s=rng.uniform(2,5)
            d.arc((x+np.cos(a)*q-s,y+np.sin(a)*q-s,x+np.cos(a)*q+s,y+np.sin(a)*q+s),rng.uniform(0,180),rng.uniform(200,330),fill=150,width=2)
    L=np.array(img);rgb=np.stack([L,L,L],-1).astype(np.uint8)
    if side=='L':
        dist=nd.distance_transform_edt(sea)
        t=np.clip(dist/900,0,1);base=np.stack([232-10*t,238-7*t,241-4*t],-1)
        for kk,(r,a) in enumerate([(22,150),(48,115),(84,85),(130,60),(190,40)]):
            ring=(np.abs(dist-r)<1.6)&(nd.gaussian_filter(rng.random((H//16+1,W//16+1)),1.5).repeat(16,0).repeat(16,1)[:H,:W]>0.47-0.02*kk)
            base[ring]=base[ring]*(1-a/400)+np.array([120,140,150])*(a/400)
        rgb[sea]=base[sea].astype(np.uint8)
        si=Image.fromarray(rgb);sd_=ImageDraw.Draw(si)
        N=int(sea.sum()*0.00045);xs=rng.integers(0,W,N*3);ys=rng.integers(0,H,N*3)
        ok=sea[ys,xs]&(dist[ys,xs]>230)&(rng.random(N*3)<0.55)
        for x,y in zip(xs[ok],ys[ok]):
            Lw=rng.uniform(14,30);a=int(rng.integers(150,185))
            sd_.line([(x+u,y+2.2*np.sin(u/Lw*2*np.pi)) for u in np.linspace(-Lw/2,Lw/2,8)],fill=(a-20,a-5,a+5),width=2)
        rgb=np.array(si)
        rgb[road]=RG
        edge=road&~nd.binary_erosion(road,iterations=int(4*K))
        rgb[edge]=42
    al=np.full((H,W),255,np.uint8)
    a=np.clip(((OX0+OV-X) if side=='L' else (X-(OX1-OV)))/(OV-24),0,1)
    al=(a*255).astype(np.uint8)
    im=Image.fromarray(np.dstack([rgb,al]),'RGBA').resize((W//2,H//2),Image.LANCZOS)
    buf=io.BytesIO();im.save(buf,'PNG',optimize=True)
    print(side,'KB',len(buf.getvalue())//1024)
    return '<image x="%.1f" y="%d" width="%.1f" height="%d" preserveAspectRatio="none" href="data:image/png;base64,%s"/>'%(ux0,Y0,W/K,Y1-Y0,base64.b64encode(buf.getvalue()).decode())
rgbo=np.array(Image.open(S+'/orig.png').convert('RGB'))
RG=np.median(rgbo[1305:1325,8:20].reshape(-1,3),0).astype(np.uint8);print('road',RG)
open(S+'/ext_g.svg','w').write(panel('L',21)+panel('R',31))
