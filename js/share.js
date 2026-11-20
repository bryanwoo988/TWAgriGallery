/* The share block: a QR code drawn on the phone (js/qrcode.js, no outside
   service), the system share sheet where there is one, and copy-link. */

import { toSVG } from './qrcode.js';

export function renderShare(host, { url, tr, appName }) {
  const qr = document.createElement('div');
  qr.className = 'qr';
  qr.setAttribute('aria-label', url);
  qr.append(toSVG(url, { quiet: 4, dark: '#111111', light: '#ffffff' }));

  const status = document.createElement('span');
  status.className = 'share-status';
  status.setAttribute('role', 'status');

  const button = (label, cls, fn) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = cls; b.textContent = label;
    b.addEventListener('click', fn);
    return b;
  };

  const native = button(tr('shareButton'), 'button primary', () => {
    navigator.share({ title: appName, url }).catch(() => {});
  });
  const copy = button(tr('copyLink'), 'button', async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // No clipboard permission (older browsers, http): select the visible URL instead.
      const node = host.parentElement?.querySelector('.share-url');
      if (node) { const r = document.createRange(); r.selectNodeContents(node); getSelection().removeAllRanges(); getSelection().addRange(r); }
    }
    status.textContent = tr('copied');
    setTimeout(() => { status.textContent = ''; }, 2000);
  });
  // "Share" falls back to copying where the phone has no share sheet.
  if (!navigator.share) native.hidden = true;

  const actions = document.createElement('div');
  actions.className = 'share-actions';
  actions.append(native, copy, status);
  host.replaceChildren(qr, actions);
}
