'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const form = $('consult'), question = $('question'), birth = $('birth'), calendar = $('calendar');
  const topic = $('topic'), prepared = $('prepared'), status = $('status');
  const to = 'fortune@notopened.com';
  const korea = new Date(Date.now() + 9*60*60*1000);
  birth.max = korea.toISOString().slice(0,10);
  form.hidden = false;
  const kind = $('consult-kind');
  const isDream = () => kind.querySelector('input:checked')?.value === 'dream';
  const normalPlaceholder = question.placeholder;
  const renderKind = () => {
    const dream = isDream();
    $('fortune-topic-row').hidden = dream;
    $('fortune-birth-row').hidden = dream;
    for (const field of [topic,birth,calendar,$('birth-time')]) field.disabled = dream;
    $('question-label').textContent = dream ? '기억나는 꿈 장면' : '질문 한 가지';
    question.placeholder = dream ? '예: 비 오는 날, 오래된 집 앞에서 길을 잃었어요.' : normalPlaceholder;
    question.maxLength = dream ? 494 : 500;
    invalidate();
  };
  kind.addEventListener('change',renderKind);
  renderKind();

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
    const dream = isDream();
    const content = question.value.trim();
    if(!content || content.length > question.maxLength){question.setCustomValidity(dream ? '기억나는 꿈 장면을 494자 이내로 적어 주세요.' : '질문을 500자 이내로 적어 주세요.');question.reportValidity();return;}
    if(!form.reportValidity())return;
    const category = dream ? '기타' : topic.value;
    const subject = '무료운세 상담 신청 · ' + category;
    const lines = ['낫오픈드 무료운세 상담을 신청합니다.','', '주제: '+category,'질문: '+(dream ? '[꿈풀이] ' : '')+content];
    if(!dream && birth.value)lines.push('','생년월일: '+birth.value+' ('+calendar.value+')');
    if(!dream && $('birth-time').value)lines.push('태어난 시간: '+$('birth-time').value);
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
