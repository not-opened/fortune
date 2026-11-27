'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const form = $('consult'), question = $('question'), birth = $('birth'), calendar = $('calendar');
  const topic = $('topic'), prepared = $('prepared'), status = $('status');
  const to = 'fortune@notopened.com';
  const korea = new Date(Date.now() + 9*60*60*1000);
  birth.max = korea.toISOString().slice(0,10);
  form.hidden = false;

  function invalidate() {
    question.setCustomValidity('');
    birth.setCustomValidity('');
    prepared.hidden = true;
    $('body').value = '';
    $('open-mail').href = 'mailto:' + to;
    status.textContent = '';
  }
  form.addEventListener('input',invalidate);
  form.addEventListener('change',invalidate);
  form.addEventListener('submit',event => {
    event.preventDefault();
    const content = question.value.trim();
    if(!content){question.setCustomValidity('질문을 한 가지 적어 주세요.');question.reportValidity();return;}
    if(!form.reportValidity())return;
    const subject = '무료운세 상담 신청 · ' + topic.value;
    const lines = ['낫오픈드 무료운세 상담을 신청합니다.','', '주제: '+topic.value,'질문: '+content];
    if(birth.value)lines.push('','생년월일: '+birth.value+' ('+calendar.value+')');
    if($('birth-time').value)lines.push('태어난 시간: '+$('birth-time').value);
    lines.push('','AI가 작성하는 참고용 풀이이며, 문의 내용이 이메일로 전달된다는 점을 확인했습니다.');
    const message = lines.join('\r\n');
    $('subject').textContent = subject;
    $('body').value = message;
    $('open-mail').href = 'mailto:'+to+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(message);
    prepared.hidden = false;
    status.textContent = '';
    $('prepared-title').focus();
  });
  $('copy').addEventListener('click',async() => {
    try {await navigator.clipboard.writeText($('body').value);status.textContent='본문을 복사했어요.';}
    catch { $('body').focus();$('body').select();status.textContent='선택된 본문을 복사해 주세요.'; }
  });
})();
