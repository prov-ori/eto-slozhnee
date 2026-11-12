(() => {
  'use strict';
  const K=window.ETO_KNOWLEDGE;
  if(!K)return;
  const I=window.ETO_I18N;
  const langs=['ru','en','et'];
  const getLang=()=>I?.get?.()||(()=>{try{const l=localStorage.getItem('eto-lang');return langs.includes(l)?l:'ru'}catch{return'ru'}})();
  const pick=o=>I?.pick?.(o,o)||o?.[getLang()]||o?.ru||o?.en||'';
  const labels={
    ru:{disclaimer:'Это учебная схема, а не анатомическая карта. Пункты обозначают функциональные системы и сети; они не задают точные границы и не означают «одна зона — одна функция».',eyebrow:'СЕТЕВАЯ СХЕМА',title:'Системы работают вместе',intro:'Выбери узел, чтобы увидеть его роль, ограничения и связанные концепты.',allEyebrow:'ВСЕ СИСТЕМЫ',allTitle:'Разобрать подробнее',links:'Связанные концепты',network:'сеть',system:'система'},
    en:{disclaimer:'This is a teaching schematic, not an anatomical map. Nodes represent functional systems and networks; they do not mark precise borders or imply “one area — one function”.',eyebrow:'NETWORK SCHEMATIC',title:'Systems work together',intro:'Choose a node to see its role, limitations and related concepts.',allEyebrow:'ALL SYSTEMS',allTitle:'Explore in detail',links:'Related concepts',network:'network',system:'system'},
    et:{disclaimer:'See on õppeskeem, mitte anatoomiline kaart. Sõlmed tähistavad funktsionaalseid süsteeme ja võrgustikke; need ei näita täpseid piire ega tähenda „üks piirkond — üks funktsioon”.',eyebrow:'VÕRGUSTIKUSKEEM',title:'Süsteemid töötavad koos',intro:'Vali sõlm, et näha selle rolli, piiranguid ja seotud mõisteid.',allEyebrow:'KÕIK SÜSTEEMID',allTitle:'Uuri lähemalt',links:'Seotud mõisted',network:'võrgustik',system:'süsteem'}
  };
  const featured=['prefrontal-networks','hippocampal-system','reward','salience','language','visual'];
  const domain=id=>K.domains.find(d=>d.id===id);
  const concept=id=>K.concepts.find(c=>c.id===id);
  let selected=featured.find(id=>K.atlas.some(a=>a.id===id))||K.atlas[0]?.id;
  function tx(o){return o?.[getLang()]||o?.ru||o?.en||''}
  function render(){
    const lang=getLang(),l=labels[lang]||labels.ru;
    const disclaimer=document.querySelector('#atlasDisclaimer'),net=document.querySelector('#atlasNetwork'),detail=document.querySelector('#atlasDetail');
    if(disclaimer)disclaimer.textContent=l.disclaimer;
    const eyebrow=document.querySelector('#atlasSchematicEyebrow');if(eyebrow)eyebrow.textContent=l.eyebrow;
    const title=document.querySelector('#atlasSchematicTitle');if(title)title.textContent=l.title;
    const intro=document.querySelector('#atlasSchematicIntro');if(intro)intro.textContent=l.intro;
    const ae=document.querySelector('#atlasAllEyebrow');if(ae)ae.textContent=l.allEyebrow;
    const at=document.querySelector('#atlasAllTitle');if(at)at.textContent=l.allTitle;
    const items=featured.map(id=>K.atlas.find(a=>a.id===id)).filter(Boolean);
    if(net){net.innerHTML=items.map((a,i)=>{const d=domain(a.domain);return '<button type="button" class="atlas-node'+(a.id===selected?' active':'')+'" data-atlas-id="'+a.id+'" role="listitem" aria-pressed="'+String(a.id===selected)+'"><span class="atlas-node-index">'+(i+1)+'</span><span class="atlas-node-copy"><strong>'+tx(a.title)+'</strong><small>'+tx(d?.label)+'</small></span></button>'}).join('');
      net.querySelectorAll('[data-atlas-id]').forEach(btn=>btn.addEventListener('click',()=>{selected=btn.dataset.atlasId;renderDetail();net.querySelectorAll('.atlas-node').forEach(b=>{const on=b.dataset.atlasId===selected;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});if(matchMedia('(max-width:1080px)').matches)detail?.scrollIntoView({block:'nearest',behavior:'smooth'})}));}
    renderDetail();
    function renderDetail(){if(!detail)return;const a=K.atlas.find(x=>x.id===selected)||items[0];if(!a){detail.textContent='';return}const d=domain(a.domain);const links=(a.links||[]).map(id=>concept(id)).filter(Boolean);detail.innerHTML='<div class="domain-pill">'+(d?.icon||'')+' '+tx(d?.label)+'</div><h2>'+tx(a.title)+'</h2><p>'+tx(a.summary)+'</p>'+(links.length?'<div class="concept-links"><b>'+l.links+':</b> '+links.map(c=>'<a href="concepts.html#'+c.id+'">'+tx(c.title)+'</a>').join('')+'</div>':'');}
  }
  document.addEventListener('DOMContentLoaded',render,{once:true});
  window.addEventListener('eto:language',render);
})();
