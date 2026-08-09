(() => {
  let deferredInstallPrompt = null;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standaloneQuery = window.matchMedia('(display-mode: standalone)');
  const isInstalled = () => standaloneQuery.matches || window.navigator.standalone === true;
  const currentLanguage = () => StudyNovaI18n.normalize(document.documentElement.lang);
  const tr = key => StudyNovaI18n.get(currentLanguage(), key);

  let installButton = document.querySelector('[data-install-app]');
  if (!installButton) {
    installButton = document.createElement('button');
    installButton.className = 'icon-btn install-button';
    installButton.dataset.installApp = '';
    document.querySelector('.top-actions')?.prepend(installButton);
  }
  let modal = document.getElementById('installModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'installModal';
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = '<div class="modal-box install-dialog"><div class="section-head"><h2 data-install-title></h2><button class="icon-btn" data-install-close aria-label="Close">×</button></div><p class="lead" data-install-instructions></p><div class="actions"><button class="btn primary" data-install-close></button></div></div>';
    document.body.append(modal);
  }
  const updateCopy = () => {
    installButton.textContent = tr('common.installApp');
    installButton.setAttribute('aria-label', tr('common.installApp'));
    modal.querySelector('[data-install-title], #installTitle').textContent = tr('common.installTitle');
    const instructions = modal.querySelector('[data-install-instructions], [data-t="common.installInstructions"]');
    if (instructions) instructions.textContent = tr('common.installInstructions');
    modal.querySelectorAll('[data-install-close]').forEach(button => {
      button.setAttribute('aria-label', tr('common.close'));
      if (button.textContent !== '×') button.textContent = tr('common.close');
    });
  };
  const updateVisibility = () => {
    installButton.hidden = isInstalled() || (!deferredInstallPrompt && !isIos);
  };
  const closeModal = () => { modal.classList.remove('open'); installButton.focus(); };
  modal.querySelectorAll('[data-install-close]').forEach(button => button.addEventListener('click', closeModal));
  modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
  installButton.addEventListener('click', async () => {
    if (isIos) {
      modal.classList.add('open');
      modal.querySelector('[data-install-close]')?.focus();
      return;
    }
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    updateVisibility();
  });
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateVisibility();
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    updateVisibility();
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = tr('common.appInstalled');
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2200);
    }
  });
  standaloneQuery.addEventListener?.('change', updateVisibility);
  window.addEventListener('studynova:language', () => { updateCopy(); updateVisibility(); });
  updateCopy();
  updateVisibility();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js');
})();
