/* Tema sunumu: ortak davranışlara dokunmadan etkin menü öğesini belirtir. */
(() => {
  const config = document.getElementById('site-config');
  if (!config) return;
  const {home} = JSON.parse(config.textContent);
  const base = new URL(home, location.href);
  const path = location.pathname.slice(base.pathname.length).split('/')[0];
  const section = ({program: 'programlar', izle: 'programlar', hoca: 'hocalar', konu: 'konular'})[path] || path;
  document.querySelectorAll('#main-nav a').forEach(link => {
    const target = new URL(link.href).pathname.slice(base.pathname.length).split('/')[0];
    if (target === section) link.setAttribute('aria-current', target === path ? 'page' : 'true');
  });
})();
