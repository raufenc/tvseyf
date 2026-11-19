/* Seyf TV — bağımlılıksız ortak davranışlar; tema bilgisi içermez. */
(() => {
'use strict';
const cfg = JSON.parse(document.getElementById('site-config')?.textContent || '{}');
const ui = cfg.ui || {}, base = new URL(cfg.base || './', location.href);
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const fold = s => String(s || '').replace(/[İIı]/g,'i').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ç/g,'c').replace(/ö/g,'o').replace(/ü/g,'u');
const plain = s => String(s || '').replace(/\*\*/g,'');
const stamp = n => {n=Math.max(0,Math.floor(n));return (n>=3600?Math.floor(n/3600)+':':'')+String(Math.floor(n/60)%60).padStart(n>=3600?2:1,'0')+':'+String(n%60).padStart(2,'0');};
const el = (tag, cls, text) => {const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const announce = s => {if($('#announcer'))$('#announcer').textContent=s;};
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const motion = reduced?'instant':'smooth';
const getJSON = async url => {const r=await fetch(url);if(!r.ok)throw Error(r.status);return r.json();};

$('.menu-toggle')?.addEventListener('click', e => {
 const open=e.currentTarget.getAttribute('aria-expanded')!=='true';
 e.currentTarget.setAttribute('aria-expanded',String(open));$('#main-nav')?.classList.toggle('open',open);
});
$$('.languages a[hreflang]').forEach(a=>a.addEventListener('click',()=>{const route=a.getAttribute('href').split(/[?#]/)[0];a.setAttribute('href',route+location.search+location.hash);}));
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&$('#main-nav')?.classList.contains('open')){$('#main-nav').classList.remove('open');$('.menu-toggle').setAttribute('aria-expanded','false');$('.menu-toggle').focus();}
 if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&!e.target.isContentEditable){e.preventDefault();const field=$('#search-q')||$('#header-q');if(field?.getClientRects().length)field.focus();else location.href=cfg.search;}
});
$$('[data-scroll]').forEach(b=>b.addEventListener('click',()=>{
 const rail=$('.rail',b.closest('.shelf'));const sign=document.documentElement.dir==='rtl'?-1:1;
 rail.scrollBy({left:Number(b.dataset.scroll)*rail.clientWidth*.8*sign,behavior:motion});
}));
$('[data-sort]')?.addEventListener('change',e=>{
 const grid=$('[data-sort-grid]');const rows=[...grid.children];
 // DOM initially stores the canonical newest → oldest order (including tied parts).
 rows.sort((a,b)=>Number(a.dataset.original)-Number(b.dataset.original));
 if(e.target.value==='old')rows.reverse();rows.forEach(n=>grid.append(n));
});
$$('[data-sort-grid] > *').forEach((n,i)=>n.dataset.original=i);
$$('[data-panel]').forEach(b=>b.addEventListener('click',()=>{
 $$('[data-panel]').forEach(x=>{const selected=x===b;x.setAttribute('aria-selected',String(selected));$('#'+x.dataset.panel).hidden=!selected;});
}));
$('[data-cinema]')?.addEventListener('click',e=>{const on=document.body.classList.toggle('cinema-mode');e.currentTarget.setAttribute('aria-pressed',String(on));});

/* IFrame API yalnız kullanıcı oynatmaya niyet ettiğinde yüklenir. */
let player=null, ready=false, pendingSeek=null, apiPromise=null, currentTime=0;
function iframeAPI(){
 if(window.YT?.Player)return Promise.resolve(window.YT);
 if(apiPromise)return apiPromise;
 apiPromise=new Promise((resolve,reject)=>{
  const previous=window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady=()=>{previous?.();resolve(window.YT);};
  const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.onerror=reject;document.head.append(script);
 });return apiPromise;
}
const playerBox=$('[data-player]');
const initialParam=new URLSearchParams(location.search).get('t') || new URLSearchParams(location.hash.slice(1)).get('t');
const initialTime=Math.max(0,parseFloat(initialParam)||0);
async function play(t=initialTime){
 if(!playerBox)return;
 pendingSeek=Math.max(0,Number(t)||0);currentTime=pendingSeek;
 if(player){if(ready){player.seekTo(pendingSeek,true);player.playVideo();}return;}
 if(playerBox.dataset.loading)return;
 playerBox.dataset.loading='true';
 // Insert iframe immediately; API attaches to the same privacy-enhanced player.
 const iframe=document.createElement('iframe');iframe.id='seyf-player';
 iframe.title=ui.play||'Video';iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';iframe.allowFullscreen=true;
 iframe.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(playerBox.dataset.player)+'?autoplay=1&enablejsapi=1&playsinline=1&rel=0&start='+Math.floor(pendingSeek)+'&origin='+encodeURIComponent(location.origin);
 playerBox.replaceChildren(iframe);
 try{const YT=await iframeAPI();player=new YT.Player(iframe,{events:{onReady:()=>{ready=true;if(pendingSeek!==null)player.seekTo(pendingSeek,true);player.playVideo();},onStateChange:()=>{}}});}
 catch(err){announce(ui.unavailable);}
}
$('[data-play]')?.addEventListener('click',()=>play(initialTime));
function seek(t){const n=Math.max(0,Number(t)||0);play(n);const url=new URL(location.href);url.hash='t='+Math.floor(n);history.replaceState(null,'',url);highlight(n);}
document.addEventListener('click',e=>{const b=e.target.closest('[data-seek]');if(b)seek(b.dataset.seek);});
function activeAt(nodes,t){let active=null;for(const n of nodes){if(Number(n.dataset.chapter??n.dataset.time)<=t)active=n;else break;}return active;}
let lastParagraph=null;
function highlight(t){
 const chapters=$$('[data-chapter]'),now=activeAt(chapters,t);chapters.forEach(n=>{n.classList.toggle('active',n===now);if(n===now)n.setAttribute('aria-current','true');else n.removeAttribute('aria-current');});
 const rows=$$('.transcript-row'),paragraph=activeAt(rows,t);rows.forEach(n=>n.classList.toggle('active',n===paragraph));
 if(paragraph&&paragraph!==lastParagraph&&$('#follow-text')?.checked){const host=$('#transcript');host.scrollTo({top:paragraph.offsetTop-host.offsetTop-host.clientHeight*.25,behavior:motion});}
 lastParagraph=paragraph;
}
if(playerBox){highlight(initialTime);setInterval(()=>{if(ready&&player?.getCurrentTime){currentTime=player.getCurrentTime()||0;highlight(currentTime);}},1000);}
window.addEventListener('hashchange',()=>{const t=new URLSearchParams(location.hash.slice(1)).get('t');if(t!==null)seek(t);});

/* Metin dili, geri dönüş ve işaretlemeler güvenli textContent üzerinden. */
let transcriptRows=[],transcriptRequest=0,marks=[],markIndex=-1;
const transcript=$('#transcript');
async function loadTranscript(lang){
 if(!transcript)return;
 const request=++transcriptRequest;const available=JSON.parse(transcript.dataset.available||'{}');
 const actual=available[lang]?lang:(available.tr?'tr':Object.keys(available).find(l=>available[l]));
 $$('[data-transcript-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.transcriptLang===actual)));
 $('#transcript-note').textContent=actual==='tr'?(cfg.lang==='tr'?ui.auto_tr:ui.original_tr):actual?ui.auto_translation:'';
 transcript.dir=actual==='ar'?'rtl':'ltr';transcript.lang=actual||lang;
 transcript.replaceChildren();transcriptRows=[];
 if(!actual){transcript.append(el('p','empty-state',ui.no_transcript));return;}
 try{
  const rows=await getJSON(new URL('veri/metin/'+transcript.dataset.video+'.'+actual+'.json',base));
  if(request!==transcriptRequest)return;
  transcriptRows=rows;
  const fragment=document.createDocumentFragment();
  const chapters=JSON.parse(transcript.dataset.chapters||'[]');let lastChapter=-2;
  rows.forEach(([time,text])=>{
   let chapter=-1;chapters.forEach((c,i)=>{if(Number(c.t)<=time)chapter=i;});
   if(chapter>=0&&chapter!==lastChapter){const c=chapters[chapter];fragment.append(el('h3','transcript-heading',c.ad[actual]||c.ad.tr||''));}
   lastChapter=chapter;
   const row=el('div','transcript-row');row.dataset.time=time;const b=el('button','',stamp(time));b.dataset.seek=time;b.setAttribute('aria-label',ui.watch+' '+stamp(time));row.append(b,el('p','',text));fragment.append(row);
  });
  transcript.replaceChildren(fragment);if(!rows.length)transcript.append(el('p','empty-state',ui.no_transcript));
  findText();highlight(currentTime||initialTime);
 }catch(err){if(request===transcriptRequest)transcript.replaceChildren(el('p','empty-state',ui.unavailable));}
}
$$('[data-transcript-lang]').forEach(b=>b.addEventListener('click',()=>loadTranscript(b.dataset.transcriptLang)));
function markText(node,text,query){
 const f=fold(text),q=fold(query);node.replaceChildren();if(!q){node.textContent=text;return;}
 let p=0,index;
 while((index=f.indexOf(q,p))>=0){node.append(document.createTextNode(text.slice(p,index)));node.append(el('mark','',text.slice(index,index+q.length)));p=index+q.length;}
 node.append(document.createTextNode(text.slice(p)));
}
function findText(){
 const q=$('#text-query')?.value.trim()||'';
 $$('.transcript-row p').forEach((n,i)=>markText(n,transcriptRows[i]?.[1]||'',q));
 marks=$$('mark',transcript);markIndex=-1;$('#text-count').textContent=q?'0 / '+marks.length:'';
 if(marks.length)nextMatch(1);
}
function nextMatch(delta){
 if(!marks.length)return;
 if(markIndex>=0)marks[markIndex].classList.remove('current');markIndex=(markIndex+delta+marks.length)%marks.length;
 const mark=marks[markIndex];mark.classList.add('current');const row=mark.closest('.transcript-row');
 transcript.scrollTo({top:row.offsetTop-transcript.offsetTop-20,behavior:motion});$('#text-count').textContent=(markIndex+1)+' / '+marks.length;
}
$('#text-query')?.addEventListener('input',findText);
$$('[data-find]').forEach(b=>b.addEventListener('click',()=>nextMatch(Number(b.dataset.find))));
if(transcript)loadTranscript(cfg.lang);

/* Paylaşım: yalnız doğrudan kullanıcı eyleminden yeni pencere veya pano. */
$$('[data-share]').forEach(b=>b.addEventListener('click',async()=>{
 const url=new URL(location.href);url.hash='';
 if($('#share-time')?.checked)url.searchParams.set('t',Math.floor(ready?player.getCurrentTime():currentTime||initialTime));else url.searchParams.delete('t');
 const text=document.title.replace(/ · Seyf TV$/,'');
 if(b.dataset.share==='copy'){
  try{await navigator.clipboard.writeText(url.href);announce(ui.copied);const old=b.textContent;b.textContent=ui.copied;setTimeout(()=>b.textContent=old,1800);}
  catch(err){const field=el('textarea');field.value=url.href;document.body.append(field);field.select();document.execCommand('copy');field.remove();announce(ui.copied);}
 }else{
  const dest=b.dataset.share==='whatsapp'?'https://wa.me/?text='+encodeURIComponent(text+' '+url.href):'https://twitter.com/intent/tweet?text='+encodeURIComponent(text)+'&url='+encodeURIComponent(url.href);
  window.open(dest,'_blank','noopener,noreferrer');
 }
}));

/* Kısa videolar: tek dialog, kapatıldığında iframe kaldırılır. */
const shortCards=$$('[data-short]');let shortDialog=null,shortIndex=0,shortOpener=null,lastNavigate=0,touchY=0,lastGesture=0;
function renderShort(){
 const card=shortCards[shortIndex];const host=$('.short-modal-player',shortDialog);
 const iframe=el('iframe');iframe.tabIndex=-1;iframe.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(card.dataset.short)+'?autoplay=1&playsinline=1&rel=0';iframe.title=card.dataset.title;iframe.src+='&enablejsapi=1&origin='+encodeURIComponent(location.origin);iframe.allow='autoplay; encrypted-media; picture-in-picture';iframe.allowFullscreen=true;host.replaceChildren(iframe);
 const surface=el('button','short-surface');surface.setAttribute('aria-label',ui.pause);surface.setAttribute('aria-pressed','false');surface.append(el('span','big-play','▶'));
 surface.addEventListener('click',()=>{if(Date.now()-lastGesture<400)return;const paused=surface.getAttribute('aria-pressed')!=='true';surface.setAttribute('aria-pressed',String(paused));surface.classList.toggle('paused',paused);surface.setAttribute('aria-label',paused?ui.play:ui.pause);iframe.contentWindow.postMessage(JSON.stringify({event:'command',func:paused?'pauseVideo':'playVideo',args:[]}), 'https://www.youtube-nocookie.com');});host.append(surface);
 $('.short-modal-title',shortDialog).textContent=card.dataset.title;
 $('[data-short-step="-1"]',shortDialog).disabled=shortIndex===0;
 $('[data-short-step="1"]',shortDialog).disabled=shortIndex===shortCards.length-1;
}
function navigateShort(delta){if(Date.now()-lastNavigate<550)return;lastNavigate=Date.now();const next=Math.max(0,Math.min(shortCards.length-1,shortIndex+delta));if(next!==shortIndex){shortIndex=next;renderShort();}}
function openShort(index,opener){
 if(!shortDialog){
  shortDialog=el('dialog','short-dialog');shortDialog.setAttribute('aria-label',ui.shorts);
  const close=el('button','short-close',ui.close);close.setAttribute('aria-label',ui.close);close.onclick=()=>shortDialog.close();
  const layout=el('div','short-modal-layout');layout.append(el('div','short-modal-player'),el('h2','short-modal-title'),el('p','short-modal-hint',ui.escape_short));
  const controls=el('div','short-controls');[-1,1].forEach((delta)=>{const btn=el('button','',delta===1?'↓':'↑');btn.dataset.shortStep=delta;btn.setAttribute('aria-label',delta===1?ui.next:ui.previous);btn.onclick=()=>navigateShort(delta);controls.append(btn);});
  shortDialog.append(close,layout,controls);document.body.append(shortDialog);
  shortDialog.addEventListener('close',()=>{$('.short-modal-player',shortDialog).replaceChildren();document.body.style.overflow='';shortOpener?.focus();});
  shortDialog.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();navigateShort(e.key==='ArrowDown'?1:-1);}});
  shortDialog.addEventListener('wheel',e=>{e.preventDefault();if(Math.abs(e.deltaY)>15)navigateShort(e.deltaY>0?1:-1);},{passive:false});
  shortDialog.addEventListener('touchstart',e=>touchY=e.touches[0].clientY,{passive:true});
  shortDialog.addEventListener('touchend',e=>{const d=touchY-e.changedTouches[0].clientY;if(Math.abs(d)>45){lastGesture=Date.now();navigateShort(d>0?1:-1);}},{passive:true});
 }
 shortOpener=opener;shortIndex=index;renderShort();shortDialog.showModal();document.body.style.overflow='hidden';$('.short-close',shortDialog).focus();
}
shortCards.forEach((b,i)=>b.addEventListener('click',()=>openShort(i,b)));

/* İki kademeli arama: küçük dizin hemen, metin parçaları istek üzerine sırayla. */
const form=$('#site-search');let searchIndex=null,chunksCache=new Map(),searchToken=0;
if(form){
 const params=new URLSearchParams(location.search);
 for(const name of ['q','program','teacher'])if(params.has(name))form.elements[name].value=params.get(name);
 form.addEventListener('submit',e=>{e.preventDefault();runSearch();});
 $$('select',form).forEach(n=>n.addEventListener('change',()=>runSearch()));
 let debounce;$('#search-q').addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(runSearch,300);});
 window.addEventListener('popstate',()=>{const p=new URLSearchParams(location.search);for(const name of ['q','program','teacher'])form.elements[name].value=p.get(name)||'';runSearch(false);});
 runSearch(false);
}
async function runSearch(update=true){
 const token=++searchToken;const query=form.elements.q.value.trim();const program=form.elements.program.value,teacher=form.elements.teacher.value;
 const status=$('#search-status'),results=$('#results');results.replaceChildren();
 if(update){const u=new URL(location.href);for(const [k,v] of [['q',query],['program',program],['teacher',teacher]]){if(v)u.searchParams.set(k,v);else u.searchParams.delete(k);}history.replaceState(null,'',u);}
 if(!query){status.textContent=ui.search_intro;return;}
 status.textContent=ui.searching;
 try{
  if(!searchIndex)searchIndex=await getJSON(new URL(cfg.lang+'/ara-dizin.json',base));
  if(token!==searchToken)return;
  const terms=fold(query).split(/\s+/).filter(Boolean);const matches=s=>terms.every(t=>fold(s).includes(t));
  const allowed=searchIndex.videos.filter(v=>(!program||v.program===program)&&(!teacher||v.teachers.includes(teacher)));
  const byId=new Map(allowed.map(v=>[v.id,v]));const found=new Map();
  allowed.forEach(v=>{
   const chapterHits=v.chapters.filter(c=>matches(c[1])).slice(0,3).map(c=>({t:c[0],text:plain(c[1])}));
   const rank=matches(v.title)||matches(v.search_title)?3:chapterHits.length?2:matches(v.description)?0:-1;
   if(rank>=0)found.set(v.id,{video:v,rank,chapterHits,textHits:[]});
  });
  renderResults(found,query,false);
  for(const name of searchIndex.chunks){
   if(token!==searchToken)return;
   let pending=chunksCache.get(name);
   if(!pending){pending=getJSON(new URL(cfg.lang+'/'+name,base));chunksCache.set(name,pending);}
   let rows;try{rows=await pending;}catch(err){chunksCache.delete(name);throw err;}
   if(token!==searchToken)return;
   for(const row of rows){if(byId.has(row.id)&&matches(row.text)){
    if(!found.has(row.id))found.set(row.id,{video:byId.get(row.id),rank:0,chapterHits:[],textHits:[]});
    const match=found.get(row.id);
    if(row.t!==null){
     match.rank=Math.max(match.rank,1);
     if(match.textHits.length<3&&!match.textHits.some(h=>h.t===row.t))match.textHits.push({t:row.t,text:excerpt(row.text,query)});
    }
   }}
   renderResults(found,query,false);
  }
  if(token===searchToken)renderResults(found,query,true);
 }catch(err){if(token===searchToken)status.textContent=ui.unavailable;}
}
function excerpt(text,query){text=plain(text);const key=fold(query).split(/\s+/)[0];const at=fold(text).indexOf(key);const start=Math.max(0,at-70);return (start?'…':'')+text.slice(start,start+260)+(text.length>start+260?'…':'');}
function renderResults(found,query,done){
 const results=$('#results');results.replaceChildren();const fragment=document.createDocumentFragment();
 for(const {video,chapterHits,textHits} of [...found.values()].sort((a,b)=>b.rank-a.rank)){
  const item=el('article','search-result');const route=cfg.home+'izle/'+video.id+'/';
  const imageLink=el('a');imageLink.href=route;const img=el('img');img.src='https://i.ytimg.com/vi/'+video.id+'/hqdefault.jpg';img.width=480;img.height=270;img.loading='lazy';img.alt=video.title;imageLink.append(img);
  const body=el('div'),h=el('h2'),a=el('a');a.href=route;markText(a,video.title,query);h.append(a);body.append(h);
  const p=el('p');markText(p,excerpt(video.description,query),query);body.append(p);
  // Metin eşleşmeleri görünür kalır; aynı saniyenin bölüm başlığı tekrarlanmaz.
  const hits=[...textHits,...chapterHits].filter((hit,i,all)=>all.findIndex(h=>h.t===hit.t)===i);
  hits.slice(0,3).forEach(hit=>{const link=el('a','hit');link.href=route+'?t='+encodeURIComponent(hit.t);const time=el('bdi','',stamp(hit.t)+' · '),s=el('span');markText(s,hit.text,query);link.append(time,s);body.append(link);});
  item.append(imageLink,body);fragment.append(item);
 }
 results.append(fragment);$('#search-status').textContent=(found.size?found.size+' '+ui.results:done?ui.no_results:ui.searching)+(!done&&found.size?' · '+ui.searching:'');
}
})();
