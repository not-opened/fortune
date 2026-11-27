'use strict';
const input = document.getElementById('theme-search');
const tools = document.getElementById('search-tools');
const status = document.getElementById('search-result');
const empty = document.getElementById('empty');
const sections = [...document.querySelectorAll('.theme')];
const normalize = value => value.normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/[^\p{L}\p{N}]+/gu, '');
const index = sections.map(el => ({el, searchable: normalize(el.dataset.keywords + ' ' + el.textContent)}));

function filter() {
  const q = normalize(input.value.trim());
  let num = 0;
  for (const {el, searchable} of index) {
    el.hidden = Boolean(q) && !searchable.includes(q);
    if (!el.hidden) num++;
  }
  empty.hidden = num !== 0;
  status.textContent = q ? num + '개 상황' : '';
}

input.addEventListener('input', filter);
document.getElementById('clear-search').addEventListener('click', () => {
  input.value = '';
  filter();
  input.focus();
});
for (const a of document.querySelectorAll('[data-theme-jump]')) {
  a.addEventListener('click', () => {
    input.value = '';
    filter();
  });
}
window.addEventListener('hashchange', () => {
  if (sections.some(el => '#' + el.id === location.hash && el.hidden)) {
    input.value = '';
    filter();
    const target = sections.find(el => '#' + el.id === location.hash);
    if (target) target.scrollIntoView();
  }
});
tools.hidden = false;
filter();
