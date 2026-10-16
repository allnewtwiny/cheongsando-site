(()=>{const box=document.querySelector('[data-proj-keymap]');if(!box)return;
const fx=box.querySelector('.projKeymap__fx'),slider=document.querySelector('[data-proj-slider]');
const L={1:'베이직 11동',2:'베이직 4동',3:'베이직 10동',4:'베이직 3동',5:'인피니티풀',6:'베이직 5동',7:'베이직 9동',8:'베이직 2동',9:'베이직 8동',10:'베이직 6동',11:'베이직 7동',12:'베이직 1동',13:'프리미엄 1동',14:'프리미엄 2동',15:'프리미엄 3동',16:'프리미엄 4동',17:'관리동'};
// 사진 번호별 건물 (index.html 슬라이더 data-photo 순서)
const PH={1:[12],2:[8],3:[4,5],4:[2,6],5:[10],6:[11,9,7,3,1],7:[17],8:[13],9:[14],10:[15],11:[16]};
const photoOf={};Object.keys(PH).forEach(k=>PH[k].forEach(n=>photoOf[n]=+k));
const items=[];
function place(it){const s=(it.g.querySelector(':scope>g,:scope>polygon,:scope>path')||it.g).getBoundingClientRect(),r=box.getBoundingClientRect();
it.e.style.left=(s.left+s.width/2-r.left)+'px';it.e.style.top=(s.top-r.top)+'px';}
box.querySelectorAll('.projKeymap__ov .b').forEach(g=>{
const n=+g.dataset.n,e=document.createElement('div');e.className='projKeymap__badge';e.textContent=L[n]||'';fx.appendChild(e);
const it={g,e,n};items.push(it);
if(n!==5&&n!==17){const s=document.createElement('div');s.className='projKeymap__badge projKeymap__badge--sale';s.textContent='분양 가능';fx.appendChild(s);it.s=s;e.classList.add('hasSale');}
g.addEventListener('mouseenter',()=>{place(it);e.classList.add('on')});
g.addEventListener('mouseleave',()=>e.classList.remove('on'));
g.addEventListener('click',()=>{setFilter(null);focus=n;dim([n]);if(slider&&slider.projGoTo&&photoOf[n])slider.projGoTo(photoOf[n])});});
// 툴바 필터: 프리미엄/베이직은 해당 동만 진하게(나머지 옅게), 분양 가능은 초록 이름표
const ov=box.querySelector('.projKeymap__ov'),bar=document.querySelector('.portfolioFilter');
const GRP={prem:[13,14,15,16],basic:[1,2,3,4,6,7,8,9,10,11,12]};
let mode=null,focus=0;
function dim(set){ov.classList.toggle('dim',!!set);items.forEach(it=>it.g.classList.toggle('keep',!!set&&set.includes(it.n)));}
function setFilter(m){mode=m;box.classList.toggle('flt',!!m);box.classList.toggle('sale',m==='sale');
if(bar)bar.querySelectorAll('[data-flt]').forEach(a=>a.classList.toggle('is-active',a.dataset.flt===m));
dim(GRP[m]||null);if(m==='sale')items.forEach(it=>{if(it.s){place({g:it.g,e:it.s})}});}
if(bar)bar.querySelectorAll('[data-flt]').forEach(a=>a.addEventListener('click',ev=>{ev.preventDefault();focus=0;setFilter(mode===a.dataset.flt?null:a.dataset.flt)}));
let cur=0;
function select(k){cur=k;const set=PH[k]||[];items.forEach(it=>{const on=set.includes(it.n);if(on)place(it);it.e.classList.toggle('sel',on)});
if(focus&&!set.includes(focus)){focus=0;if(!mode)dim(null);}}
if(slider)slider.addEventListener('projcenter',e=>select(e.detail));
function re(){if(cur)select(cur);if(mode==='sale')setFilter('sale');}
window.addEventListener('resize',re);
window.addEventListener('load',re);})();
