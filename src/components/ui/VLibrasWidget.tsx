import { useEffect } from 'react';

declare global {
  interface Window {
    VLibras?: {
      Widget: new (options: { rootPath: string; position?: string }) => unknown;
    };
  }
}

const VLIBRAS_SCRIPT_URL = 'https://vlibras.gov.br/app/vlibras-plugin.js';
const VLIBRAS_WRAPPER_ID = 'vlibras-access-wrapper';

export function VLibrasWidget() {
  useEffect(() => {
    function initWidget() {
      if (!window.VLibras) return;
      new window.VLibras.Widget({
        rootPath: 'https://vlibras.gov.br/app',
        position: 'l',
      });
    }

    if (document.getElementById(VLIBRAS_WRAPPER_ID)) return;

    const existingScript = document.querySelector(
      `script[src="${VLIBRAS_SCRIPT_URL}"]`,
    );
    if (existingScript) {
      initWidget();
      return;
    }

    const script = document.createElement('script');
    script.src = VLIBRAS_SCRIPT_URL;
    script.async = true;
    script.onload = initWidget;
    document.body.appendChild(script);
  }, []);

  return null;
}
