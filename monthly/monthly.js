'use strict';
(() => {
  const YEAR=2027, key='notopened.monthly.topic.v1';
  const options={love:'연애운',money:'재물운',health:'건강운',study:'학업운',family:'가족운',work:'사업·직장운'};
  const index=Object.keys(options);
  const $=id=>document.getElementById(id);
  const put=(id,text)=>{$(id).textContent=text;};
  const allowed=value=>Object.hasOwn(options,value);
  const load=()=>{try{const value=localStorage.getItem(key);return allowed(value)?value:null;}catch{return null;}};
  const korea=new Date(Date.now()+9*3600000);
  const nowYear=korea.getUTCFullYear(), nowMonth=korea.getUTCMonth()+1;
  const suggest=nowYear<YEAR?1:(nowYear>YEAR?12:nowMonth);
  const params=new URLSearchParams(location.search);
  const request=params.get('topic');
  const requestedMonth=params.get('month');
  let pinned=load();
  $('topic').value=allowed(request)?request:(pinned||'work');
  $('month').value=/^(?:[1-9]|1[0-2])$/.test(requestedMonth||'')?requestedMonth:String(suggest);
  function paint(){
    const month=Number($('month').value), topic=$('topic').value;
    const [title,body]=window.NOTOPENED_MONTHLY[month-1].slice(index.indexOf(topic)*2);
    const isCurrent=nowYear===YEAR&&month===nowMonth;
    const future=nowYear<YEAR||(nowYear===YEAR&&month>nowMonth);
    put('edition',`2027년 ${month}월${isCurrent?' · 이번 달':future?' · 미리보기':' · 지난 달'}`);
    put('reading-label',`${month}월 · ${options[topic]}`);
    put('reading-title',title);put('reading-body',body);
    $('forget').hidden=!pinned;
    $('next-month').hidden=month===12;
    put('remember',pinned===topic?'이 주제를 기억하고 있어요':'이 주제 기억하기');
    $('remember').disabled=pinned===topic;
  }
  $('controls').hidden=false;
  $('extras').hidden=false;
  $('month').addEventListener('change',paint);
  $('topic').addEventListener('change',paint);
  $('next-month').addEventListener('click',()=>{
    if(Number($('month').value)<12){
      $('month').value=String(Number($('month').value)+1);
      paint(); $('month').focus();
    }
  });
  $('remember').addEventListener('click',()=>{
    const topic=$('topic').value;
    if(!allowed(topic))return;
    try {localStorage.setItem(key,topic);pinned=topic;paint();put('save-status',options[pinned]+' 주제를 이 브라우저에 기억했어요.');}
    catch{put('save-status','이 브라우저가 저장을 허용하지 않아 기억하지 못했어요.');}
  });
  $('forget').addEventListener('click',()=>{
    try{localStorage.removeItem(key);pinned=null;paint();put('save-status','기억한 주제를 지웠어요.');$('remember').focus();}
    catch{put('save-status','브라우저에서 저장한 주제를 지울 수 없어요.');}
  });
  window.addEventListener('storage',event=>{if(event.key===key||event.key===null){pinned=load();paint();}});
  paint();
})();
