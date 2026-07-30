/* AJITO Assist v3.0 — fullscreen original PDF viewer */

(() => {
  const overlay = document.getElementById('fullscreenPdfOverlay');
  const frame = document.getElementById('fullscreenPdfFrame');
  const backBtn = document.getElementById('pdfBackBtn');
  const closeBtn = document.getElementById('pdfCloseBtn');
  const zoomInBtn = document.getElementById('pdfZoomIn');
  const zoomOutBtn = document.getElementById('pdfZoomOut');
  const resetBtn = document.getElementById('pdfZoomReset');
  const fitBtn = document.getElementById('pdfFitWidth');
  const openTab = document.getElementById('pdfOpenTab');
  const title = document.getElementById('pdfViewerTitle');
  const pageLabel = document.getElementById('pdfViewerPage');

  let currentPdf = '';
  let currentPage = 1;
  let currentZoom = 'page-width';

  function buildUrl(){
    return `${currentPdf}#page=${currentPage}&zoom=${currentZoom}&toolbar=0&navpanes=0&pagemode=none`;
  }

  function loadPdf(){
    const url = buildUrl();
    frame.src = url;
    openTab.href = url;
    resetBtn.textContent = currentZoom === 'page-width' ? '幅' : `${currentZoom}%`;
  }

  function openPdfViewer(code, page, chapter){
    currentPdf = (window.AJITO_DATA.config.manual_pdf || {})[code];
    currentPage = Number(page) || 1;
    currentZoom = 'page-width';

    title.textContent = code === 'ja' ? 'Groove Activator 日本語公式マニュアル' : 'Groove Activator Official English Manual';
    pageLabel.textContent = code === 'ja'
      ? `第${chapter}章・${currentPage}ページ`
      : `Chapter ${chapter} · Page ${currentPage}`;

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    loadPdf();
  }

  function closePdfViewer(){
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden','true');
    frame.removeAttribute('src');
    document.body.style.overflow = '';
  }

  function numericZoom(){
    return currentZoom === 'page-width' ? 100 : Number(currentZoom) || 100;
  }

  document.addEventListener('click', e => {
    const trigger = e.target.closest('.open-fullscreen-pdf');
    if(!trigger) return;
    e.preventDefault();
    openPdfViewer(trigger.dataset.lang, trigger.dataset.page, trigger.dataset.chapter);
  });

  zoomInBtn.addEventListener('click', () => {
    currentZoom = Math.min(300, numericZoom() + 25);
    loadPdf();
  });

  zoomOutBtn.addEventListener('click', () => {
    currentZoom = Math.max(50, numericZoom() - 25);
    loadPdf();
  });

  resetBtn.addEventListener('click', () => {
    currentZoom = 100;
    loadPdf();
  });

  fitBtn.addEventListener('click', () => {
    currentZoom = 'page-width';
    loadPdf();
  });

  backBtn.addEventListener('click', closePdfViewer);
  closeBtn.addEventListener('click', closePdfViewer);

  document.addEventListener('keydown', e => {
    if(!overlay.classList.contains('open')) return;
    if(e.key === 'Escape') closePdfViewer();
    if(e.key === '+' || e.key === '=') zoomInBtn.click();
    if(e.key === '-') zoomOutBtn.click();
    if(e.key === '0') resetBtn.click();
  });
})();
