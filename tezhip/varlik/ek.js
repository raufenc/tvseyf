/* Ortak oynatıcı aria-current durumunu yönetir; tema yalnız listeyi kaydırır. */
(() => {
 const list = document.querySelector('.chapters');
 if (!list) return;
 const frame = list.closest('.chapter-frame');
 const motion = matchMedia('(prefers-reduced-motion: reduce)');
 let previous = null;
 function edges() {
  frame.classList.toggle('has-overflow', list.scrollHeight > list.clientHeight + 1);
  frame.classList.toggle('at-end', list.scrollTop + list.clientHeight >= list.scrollHeight - 2);
 }
 function follow() {
  const active = list.querySelector('[data-chapter][aria-current="true"]');
  if (active && active !== previous) {
   const box = list.getBoundingClientRect(), item = active.getBoundingClientRect();
   if (item.top < box.top + 12 || item.bottom > box.bottom - 36) {
    // scrollIntoView üst sayfayı da oynatır; yalnız listeyi hareket ettir.
    list.scrollTo({top: list.scrollTop + item.top - box.top - (list.clientHeight - item.height) / 2,
     behavior: motion.matches ? 'instant' : 'smooth'});
   }
  }
  previous = active;
  edges();
 }
 new MutationObserver(follow).observe(list, {subtree: true, attributes: true, attributeFilter: ['aria-current']});
 new ResizeObserver(edges).observe(list);
 list.addEventListener('scroll', edges, {passive: true});
 follow();
})();

/* Metin yüklenince ve kaydırılınca alt solmayı gerçek taşmaya göre göster. */
(() => {
 const text = document.querySelector('#transcript');
 if (!text) return;
 const frame = text.closest('.transcript-frame');
 function edges() {
  frame.classList.toggle('has-overflow', text.scrollHeight > text.clientHeight + 1);
  frame.classList.toggle('at-end', text.scrollTop + text.clientHeight >= text.scrollHeight - 2);
 }
 new MutationObserver(edges).observe(text, {subtree: true, childList: true});
 new ResizeObserver(edges).observe(text);
 text.addEventListener('scroll', edges, {passive: true});
 edges();
})();
