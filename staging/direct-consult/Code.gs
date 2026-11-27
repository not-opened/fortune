/* Standalone Apps Script, Gmail advanced service with gmail.send only. */
const CONSULT = Object.freeze({
  sender:'fortune@notopened.com',
  topics:['직장·진로','연애·관계','가족·일상','새해·계획','기타'],
  maxDaily:24, ticketMinutes:12
});
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Form').setTitle('낫오픈드 무료운세 상담');
}
function beginConsult(email, trap) {
  email = email_(email);
  if (!email || trap !== '') return {status:'invalid'};
  const key = sign_(email);
  const date = Utilities.formatDate(new Date(),'Asia/Seoul','yyyy-MM-dd');
  const id = Utilities.getUuid();
  const code = String(parseInt(sign_('otp:'+id).slice(0,7),16)%1000000).padStart(6,'0');
  const now=Date.now();
  const saved = locked_(() => {
    const p=PropertiesService.getScriptProperties();
    const last=p.getProperty('rate:'+key);
    if (last && +last > now-24*3600000) return false;
    const dayKey='daily:'+date;
    const n=+(p.getProperty(dayKey)||0);
    if (n>=CONSULT.maxDaily) return false;
    const all=p.getProperties();
    for(const k of Object.keys(all)) {
      if(k.startsWith('daily:') && k!==dayKey || k.startsWith('rate:') && +all[k]<now-24*3600000) p.deleteProperty(k);
    }
    p.setProperty(dayKey,String(n+1));
    p.setProperty('rate:'+key,String(now));
    CacheService.getScriptCache().put('ticket:'+id,JSON.stringify({key,attempts:0,until:now+CONSULT.ticketMinutes*60000}),CONSULT.ticketMinutes*60);
    return true;
  });
  if (!saved) return {status:'limited'};
  try {
    send_(email,'[낫오픈드] 이메일 확인번호', '무료운세 상담을 신청하신 경우에만 이 번호를 입력해 주세요.\n\n확인번호: '+code+'\n\n'+CONSULT.ticketMinutes+'분 안에 입력해 주세요. 신청하지 않으셨다면 이 메일은 무시하셔도 됩니다.');
    return {status:'code',id};
  } catch(e) { CacheService.getScriptCache().remove('ticket:'+id); return {status:'unavailable'}; }
}
function finishConsult(r) {
  if (!r || typeof r!=='object' || r.consent!==true || r.trap!=='') return {status:'invalid'};
  const email=email_(r.email);
  const question=typeof r.question==='string'?r.question.trim():'';
  const birth=typeof r.birth==='string'?r.birth:'';
  const time=typeof r.time==='string'?r.time:'';
  const calendar=r.calendar||'모름';
  if(!email || !question || question.length>500 || question.includes('\u0000') ||
     !CONSULT.topics.includes(r.topic) || !/^[0-9a-f-]{36}$/i.test(r.id) || !/^\d{6}$/.test(r.code) ||
     (r.birth && (!birth || !validDate_(birth))) ||
     (r.time && (!time || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time))) ||
     !['양력','음력','모름'].includes(calendar)) return {status:'invalid'};
  const key='ticket:'+r.id;
  const receipt = 'N'+r.id.replace(/-/g,'').slice(0,12).toUpperCase();
  const auth=locked_(() => {
    const cache=CacheService.getScriptCache(), raw=cache.get(key);
    if(!raw) return 'expired';
    const t=JSON.parse(raw);
    if(Date.now()>=t.until) {cache.remove(key); return 'expired';}
    if(t.key!==sign_(email)) return 'wrong';
    const expectedCode=String(parseInt(sign_('otp:'+r.id).slice(0,7),16)%1000000).padStart(6,'0');
    if (r.code !== expectedCode) {
      if(++t.attempts>=5) {cache.remove(key); return 'expired';}
      cache.put(key,JSON.stringify(t),Math.max(1, Math.ceil((t.until-Date.now())/1000)));
      return 'wrong';
    }
    if(t.done) return 'accepted';
    if(t.sending) return 'pending';
    t.sending=true;
    cache.put(key,JSON.stringify(t),Math.max(1, Math.ceil((t.until-Date.now())/1000)));
    return 'send';
  });
  if (auth !== 'send') return {status:auth, ...(auth==='accepted'?{receipt}:{})};
  try {
    const data=JSON.stringify({receipt,email,topic:r.topic,question,birth,calendar,time});
    const inbox=PropertiesService.getScriptProperties().getProperty('CONSULT_INBOX');
    if(!email_(inbox)) throw Error('Intake not configured');
    send_(inbox, '낫오픈드 웹 직접접수 '+receipt, '낫오픈드 웹 직접접수 v1\n'+data+'\n신청자가 이메일 소유를 확인했습니다.');
    locked_(() => {
      const c=CacheService.getScriptCache(), raw=c.get(key);
      if(raw){const t=JSON.parse(raw);t.done=true;c.put(key,JSON.stringify(t),Math.max(1, Math.ceil((t.until-Date.now())/1000)));}
    });
    return {status:'accepted',receipt};
  } catch (e) { return {status:'pending'}; }
}
function email_(s) {
  if(typeof s!=='string') return '';
  const v=s.trim().toLowerCase();
  if(v.length>254 || !/^[a-z\d][a-z\d._%+\-]{0,63}@[a-z\d](?:[a-z\d-]*[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]*[a-z\d])?)+$/.test(v) || v.includes('..') || v.includes('.@') || v.endsWith('@notopened.com')) return '';
  return v;
}
function validDate_(s) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s) || s<'1900-01-01' || s>Utilities.formatDate(new Date(),'Asia/Seoul','yyyy-MM-dd')) return false;
  const v=new Date(s+'T00:00:00Z');
  return Number.isFinite(v.getTime()) && v.toISOString().slice(0,10)===s;
}
function locked_(fn){const l=LockService.getScriptLock();l.waitLock(5000);try{return fn();}finally{l.releaseLock();}}
function sign_(value){
  const p=PropertiesService.getScriptProperties();
  const secret=p.getProperty('CONSULT_HMAC_SECRET');
  if(!secret) throw Error('Intake not configured');
  return Utilities.computeHmacSha256Signature(value,secret,Utilities.Charset.UTF_8).map(b=>(b&255).toString(16).padStart(2,'0')).join('');
}
function send_(to,subject,body) {
  const s=Utilities.base64Encode(subject,Utilities.Charset.UTF_8);
  const b=Utilities.base64Encode(body,Utilities.Charset.UTF_8).match(/.{1,76}/g).join('\r\n');
  const from=CONSULT.sender;
  const mime='From: '+from+'\r\nTo: '+to+'\r\nSubject: =?UTF-8?B?'+s+'?=\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n'+b;
  const sent=Gmail.Users.Messages.send({raw:Utilities.base64EncodeWebSafe(mime,Utilities.Charset.UTF_8)},'me');
  if(!sent || !sent.id) throw Error('Send unconfirmed');
}
function setupOwner_(){
  locked_(() => {
    const p=PropertiesService.getScriptProperties();
    if(!p.getProperty('CONSULT_HMAC_SECRET')) p.setProperty('CONSULT_HMAC_SECRET',Utilities.getUuid()+Utilities.getUuid()+Utilities.getUuid());
  });
}
