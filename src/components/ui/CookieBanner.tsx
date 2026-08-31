import { useEffect } from 'react';
import * as CookieConsent from 'vanilla-cookieconsent';
import 'vanilla-cookieconsent/dist/cookieconsent.css';

export function CookieBanner() {
  useEffect(() => {
    // O StrictMode do React (main.tsx) dispara efeitos duas vezes em dev;
    // chamar run() de novo no meio da animação de entrada corrompe o estado
    // inicial do modal. #cc-main so existe depois da primeira chamada.
    if (document.getElementById('cc-main')) return;

    CookieConsent.run({
      guiOptions: {
        consentModal: {
          layout: 'bar inline',
          position: 'bottom',
        },
        preferencesModal: {
          layout: 'box',
        },
      },
      categories: {
        necessary: {
          readOnly: true,
          enabled: true,
        },
        functional: {
          readOnly: false,
          enabled: false,
        },
      },
      language: {
        default: 'pt',
        translations: {
          pt: {
            consentModal: {
              title: 'Nós usamos cookies',
              description:
                'Utilizamos cookies e armazenamento local do navegador para o funcionamento do sistema (como manter você autenticado) e, opcionalmente, para lembrar suas preferências de uso. Isso não afeta o tratamento dos dados clínicos dos aprendentes, que segue sua própria base legal e proteções específicas do sistema.',
              acceptAllBtn: 'Aceitar todos',
              acceptNecessaryBtn: 'Rejeitar não essenciais',
              showPreferencesBtn: 'Gerenciar preferências',
            },
            preferencesModal: {
              title: 'Preferências de cookies',
              acceptAllBtn: 'Aceitar todos',
              acceptNecessaryBtn: 'Rejeitar não essenciais',
              savePreferencesBtn: 'Salvar preferências',
              closeIconLabel: 'Fechar',
              sections: [
                {
                  title: 'Uso de cookies e armazenamento local',
                  description:
                    'Esta escolha se refere apenas a cookies e armazenamento local do navegador. Dados clínicos de aprendentes (evoluções, PEI, atendimentos) não são armazenados no navegador e não são afetados por essas preferências.',
                },
                {
                  title: 'Estritamente necessários',
                  description:
                    'Essenciais para o funcionamento do sistema, como manter sua sessão autenticada. Não podem ser desativados.',
                  linkedCategory: 'necessary',
                },
                {
                  title: 'Funcionais',
                  description:
                    'Usados para lembrar preferências não essenciais, como tema ou configurações salvas do dashboard, em armazenamento local do navegador.',
                  linkedCategory: 'functional',
                },
              ],
            },
          },
        },
      },
    });
  }, []);

  return null;
}
