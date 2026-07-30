(() => {
  "use strict";
  window.AJITO_DATA = {config:null, faq:[], manual:null, videos:[], diagnostics:[], gotaTips:[]};

  async function loadJSON(path) {
    const separator = path.includes('?') ? '&' : '?';
    const response = await fetch(`${path}${separator}v=3.0.0`, {cache:'no-store'});
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  async function boot() {
    try {
      const config = await loadJSON('./data/config.json');
      const base = config.data_base_url || './data/';
      const [faq, manual, videos, diagnostics, gotaTips] = await Promise.all([
        loadJSON(base + 'faq.json'),
        loadJSON(base + 'manual.json'),
        loadJSON(base + 'videos.json'),
        loadJSON(base + 'diagnostics.json'),
        loadJSON(base + 'gota_tips.json')
      ]);
      Object.assign(window.AJITO_DATA, {config, faq, manual, videos, diagnostics, gotaTips});
      document.documentElement.dataset.ajitoDataReady = 'true';
      window.dispatchEvent(new CustomEvent('ajito-data-ready', {detail:window.AJITO_DATA}));
    } catch (error) {
      console.error('AJITO Assist could not load its data files.', error);
      document.documentElement.dataset.ajitoDataReady = 'error';
      const chat = document.getElementById('chat');
      if (chat) chat.innerHTML = '<div class="msg bot">データを読み込めませんでした。GitHub PagesまたはローカルWebサーバーで開いてください。<span class="meta">AJITO Assist data loader</span></div>';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
