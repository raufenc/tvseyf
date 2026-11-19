/* Tema eki: ortak oynatıcı aynı düğümde kalır; iframe/API yeniden kurulmaz. */
(() => {
  'use strict';
  // Dil bağlantıları aynı düğümde kalır; ortak dil değiştirme davranışı korunur.
  const header = document.querySelector('.site-header');
  const nav = header?.querySelector('#main-nav');
  const languages = header?.querySelector('.languages');
  if (nav && languages) {
    const mobile = window.matchMedia('(max-width: 900px)');
    const placeLanguages = () => (mobile.matches ? nav : header).append(languages);
    placeLanguages();
    mobile.addEventListener('change', placeLanguages);
  }
  const transcript = document.querySelector('#transcript');
  if (transcript) {
    const updateDropCap = () => {
      const first = transcript.querySelector('.transcript-row p');
      const eligible = first && /^\p{L}/u.test(first.textContent.trimStart());
      transcript.querySelectorAll('p.drop-cap').forEach(p => {
        if (p !== first || !eligible) p.classList.remove('drop-cap');
      });
      first?.classList.toggle('drop-cap', Boolean(eligible));
    };
    updateDropCap();
    new MutationObserver(updateDropCap).observe(transcript, {childList: true, subtree: true, characterData: true});
  }
  const shell = document.querySelector('[data-mini-shell]');
  const player = shell?.querySelector('[data-player]');
  if (!shell || !player || !('IntersectionObserver' in window)) return;
  const controls = shell.querySelector('.mini-controls');
  const back = shell.querySelector('[data-mini-return]');
  let above = false;
  const update = () => {
    // Kapak resmi aşağı kaydırıldığında mini oynatıcıya dönüşmez.
    const mini = above && Boolean(player.querySelector('iframe'));
    shell.classList.toggle('is-mini', mini);
    controls.hidden = !mini;
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      above = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0;
      update();
    }
  }, {threshold: 0});
  observer.observe(shell);
  const mutation = new MutationObserver(update);
  mutation.observe(player, {childList: true});
  back.addEventListener('click', () => {
    above = false;
    update();
    shell.scrollIntoView({block: 'center', behavior: 'instant'});
    const target = player.querySelector('iframe, [data-play]');
    target?.focus({preventScroll: true});
  });
})();
