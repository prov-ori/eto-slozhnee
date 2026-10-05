(() => {
  'use strict';

  const factIdFromLocation = () => {
    const staticMatch = location.pathname.match(/\/facts\/([^/]+)\.html$/);
    if (staticMatch) return decodeURIComponent(staticMatch[1]);
    const queryId = new URLSearchParams(location.search).get('id');
    if (queryId) return queryId;
    if (location.hash.length > 1) {
      try { return decodeURIComponent(location.hash.slice(1)); } catch {}
    }
    return '';
  };

  const staticFactUrl = id => {
    const basePath = location.pathname.includes('/facts/')
      ? location.pathname.replace(/facts\/[^/]+\.html$/, '')
      : location.pathname.replace(/[^/]*$/, '');
    return `${location.origin}${basePath}facts/${encodeURIComponent(id)}.html`;
  };

  const copyText = async text => {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  };

  const showCopied = () => {
    const toast = document.querySelector('#toast');
    if (!toast) return;
    toast.textContent = 'Ссылка скопирована';
    toast.hidden = false;
    setTimeout(() => { toast.hidden = true; }, 1800);
  };

  document.addEventListener('click', async event => {
    const button = event.target.closest('.share-button, #factShare');
    if (!button) return;

    const card = button.closest('.fact-card');
    const id = card?.id || factIdFromLocation();
    if (!id) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const title = card?.querySelector('h3')?.textContent?.trim()
      || document.querySelector('#factTitle')?.textContent?.trim()
      || document.title;
    const url = staticFactUrl(id);

    try {
      if (navigator.share) await navigator.share({ title: 'Это сложнее', text: title, url });
      else { await copyText(url); showCopied(); }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        try { await copyText(url); showCopied(); } catch {}
      }
    }
  }, true);
})();
