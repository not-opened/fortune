const vm=require('node:vm'), fs=require('node:fs'), crypto=require('node:crypto'), assert=require('node:assert/strict');
const map=new Map, cache=new Map, out=[];let fail=false;
const properties={getProperty:k=>map.get(k),setProperty:(k,v)=>map.set(k,v),deleteProperty:k=>map.delete(k),getProperties:()=>Object.fromEntries(map)};
const ctx=vm.createContext({
  PropertiesService:{getScriptProperties:()=>properties},
  CacheService:{getScriptCache:()=>({get:k=>cache.get(k),put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},
  LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
  Utilities:{Charset:{UTF_8:'UTF-8'},getUuid:crypto.randomUUID,formatDate:()=>new Date().toISOString().slice(0,10),
    computeHmacSha256Signature:(value,secret)=>[...crypto.createHmac('sha256',secret).update(value).digest()],
    base64Encode:s=>Buffer.from(s).toString('base64'), base64EncodeWebSafe:s=>Buffer.from(s).toString('base64url')},
  Gmail:{Users:{Messages:{send:({raw})=>{if(fail)throw Error('timeout');const mime=Buffer.from(raw,'base64url').toString('utf8');out.push(mime);return{id:'123'}}}}}
});
vm.runInContext(fs.readFileSync('Code.gs','utf8'),ctx);ctx.setupOwner_();
map.set('CONSULT_INBOX','staff@example.com');
const begin=(...args)=>ctx.beginConsult(...args);
const finish=r=>ctx.finishConsult(r);
const getBody=raw=>Buffer.from(raw.split('\r\n\r\n')[1].replace(/\r\n/g,''),'base64').toString();
assert.equal(begin('x@example.com\r\nBcc:x@else.com','').status,'invalid');
assert.equal(begin('x@example.com','trap').status,'invalid');
const r=begin('person@example.com','');
assert.equal(r.status,'code');
assert.equal(begin('person@example.com','').status,'limited');
assert.equal(out.length,1);
assert.match(out[0],/^From: fortune@notopened.com\r\nTo: person@example.com/);
const code=getBody(out[0]).match(/확인번호: (\d{6})/)[1];
const x={id:r.id,code,email:'person@example.com',trap:'',question:'이직을 어떻게 생각하면 좋을까요?',topic:'직장·진로',consent:true,birth:'',time:''};
assert.equal(finish({...x,email:'other@example.com'}).status,'wrong');
assert.equal(finish({...x,consent:false}).status,'invalid');
assert.equal(finish({...x,birth:'2025-02-30'}).status,'invalid');
assert.equal(finish({...x,code:code==='000000'?'999999':'000000'}).status,'wrong');
assert.equal(out.length,1);
const accept=finish(x);assert.equal(accept.status,'accepted');
assert.equal(finish(x).receipt,accept.receipt);
assert.equal(out.length,2);
assert.match(out[1],/To: staff@example.com/);
assert.match(getBody(out[1]),/이직을 어떻게/);
assert(!JSON.stringify([...map]).includes('person@example.com'));
assert(!JSON.stringify([...cache]).includes('이직을 어떻게'));
const y=begin('second@example.com','');
const yCode=getBody(out[2]).match(/확인번호: (\d{6})/)[1];
fail=true;
assert.equal(finish({...x,id:y.id,code:yCode,email:'second@example.com'}).status,'pending');
assert.equal(finish({...x,id:y.id,code:yCode,email:'second@example.com'}).status,'pending');
assert.equal(out.length,3);
console.log('PASS: validation, code, verified delivery, duplicate guard, unknown delivery, no question stored before verification');
