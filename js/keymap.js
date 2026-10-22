(()=>{const box=document.querySelector('[data-proj-keymap]');if(!box)return;
const fx=box.querySelector('.projKeymap__fx'),slider=document.querySelector('[data-proj-slider]');
const L={1:'베이직 11동',2:'베이직 4동',3:'베이직 10동',4:'베이직 3동',5:'인피니티풀',6:'베이직 5동',7:'베이직 9동',8:'베이직 2동',9:'베이직 8동',10:'베이직 6동',11:'베이직 7동',12:'베이직 1동',13:'프리미엄 1동',14:'프리미엄 2동',15:'프리미엄 3동',16:'프리미엄 4동',17:'관리동'};
// 사진 번호별 건물 (index.html 슬라이더 data-photo 순서)
const PH={1:[12],2:[8],3:[4,5],4:[2,6],5:[10],6:[11,9,7,3,1],7:[17],8:[13],9:[14],10:[15],11:[16]};
const photoOf={};Object.keys(PH).forEach(k=>PH[k].forEach(n=>photoOf[n]=+k));
// 동 클릭 시 키맵 좌측 정사각 피드 (상단 렌더, 하단 짧은 설명)
const feed=box.querySelector('[data-km-feed]'),ft=feed&&feed.querySelector('[data-km-title]');
function openFeed(n){if(!feed)return;showSum(null);ft.textContent=L[n]||'';feed.classList.add('is-open');feed.setAttribute('aria-hidden','false');}
function closeFeed(){if(!feed)return;feed.classList.remove('is-open');feed.setAttribute('aria-hidden','true');focus=0;if(!mode)dim(null);}
const items=[];
function place(it){const s=(it.g.querySelector(':scope>g,:scope>polygon,:scope>path')||it.g).getBoundingClientRect(),r=box.getBoundingClientRect();
it.e.style.left=(s.left+s.width/2-r.left)+'px';it.e.style.top=(s.top-r.top)+'px';}
box.querySelectorAll('.projKeymap__ov .b').forEach(g=>{
const n=+g.dataset.n,e=document.createElement('div');e.className='projKeymap__badge';e.textContent=L[n]||'';fx.appendChild(e);
const it={g,e,n};items.push(it);
if(n!==5&&n!==17){const s=document.createElement('div');s.className='projKeymap__badge projKeymap__badge--sale';s.textContent='분양 가능';fx.appendChild(s);it.s=s;e.classList.add('hasSale');}
g.addEventListener('mouseenter',()=>{place(it);e.classList.add('on')});
g.addEventListener('mouseleave',()=>e.classList.remove('on'));
g.addEventListener('click',()=>{setFilter(null);focus=n;dim([n]);openFeed(n);if(slider&&slider.projGoTo&&photoOf[n])slider.projGoTo(photoOf[n])});});
// 툴바 필터: 프리미엄/베이직은 해당 동만 진하게(나머지 옅게), 분양 가능은 초록 이름표
const ov=box.querySelector('.projKeymap__ov'),bar=document.querySelector('.portfolioFilter');
const GRP={prem:[13,14,15,16],basic:[1,2,3,4,6,7,8,9,10,11,12]};
let mode=null,focus=0;
function dim(set){ov.classList.toggle('dim',!!set);items.forEach(it=>it.g.classList.toggle('keep',!!set&&set.includes(it.n)));}
// 툴바 버튼별 요약 패널 (동 수와 목록은 확정값, 면적과 구성은 준비 중)
const sum=box.querySelector('[data-km-sum]');
const PREM=GRP.prem.map(n=>L[n]).sort(),BASIC=GRP.basic.map(n=>L[n]).sort((a,b)=>parseInt(a.slice(4))-parseInt(b.slice(4)));
const SUM={prem:{t:'프리미엄',lead:'프리미엄 타입 4개 동입니다.',spec:[['동 수','4동'],['분양 가능','4동'],['면적','준비 중'],['구성','준비 중']],list:PREM},
basic:{t:'베이직',lead:'베이직 타입 11개 동입니다.',spec:[['동 수','11동'],['분양 가능','11동'],['면적','준비 중'],['구성','준비 중']],list:BASIC},
sale:{t:'분양 가능',lead:'현재 분양 가능한 동은 모두 15개입니다.',spec:[['합계','15동'],['프리미엄','4동'],['베이직','11동'],['분양 조건','준비 중']],list:PREM.concat(BASIC)}};
function showSum(m){if(!sum)return;const d=SUM[m];sum.classList.toggle('is-open',!!d);sum.setAttribute('aria-hidden',d?'false':'true');if(!d)return;
feed.classList.remove('is-open');feed.setAttribute('aria-hidden','true');
sum.querySelector('[data-sum-title]').textContent=d.t;sum.querySelector('[data-sum-lead]').textContent=d.lead;
sum.querySelector('[data-sum-spec]').innerHTML=d.spec.map(r=>'<dt>'+r[0]+'</dt><dd>'+r[1]+'</dd>').join('');
sum.querySelector('[data-sum-list]').innerHTML=d.list.map(t=>'<li>'+t+'</li>').join('');}
function setFilter(m){mode=m;showSum(m);box.classList.toggle('flt',!!m);box.classList.toggle('sale',m==='sale');
if(bar)bar.querySelectorAll('[data-flt]').forEach(a=>a.classList.toggle('is-active',a.dataset.flt===m));
dim(GRP[m]||null);if(m==='sale')items.forEach(it=>{if(it.s){place({g:it.g,e:it.s})}});}
if(bar)bar.querySelectorAll('[data-flt]').forEach(a=>a.addEventListener('click',ev=>{ev.preventDefault();focus=0;setFilter(mode===a.dataset.flt?null:a.dataset.flt)}));
box.addEventListener('click',ev=>{if(!ev.target.closest('.b,.projKeymap__feed'))closeFeed()});
let cur=0;
function select(k){cur=k;const set=PH[k]||[];items.forEach(it=>{const on=set.includes(it.n);if(on)place(it);it.e.classList.toggle('sel',on)});
if(focus&&!set.includes(focus)){focus=0;if(!mode)dim(null);}}
if(slider)slider.addEventListener('projcenter',e=>select(e.detail));
function re(){if(cur)select(cur);if(mode==='sale')setFilter('sale');}
window.addEventListener('resize',re);
window.addEventListener('load',re);})();
