import { LIMITES } from '../../constants/limits';
import { coletarErros, validarDataDia, validarTexto, type ErrosCampo } from '../../utils/validacao';

export interface ValoresPei {
  dificuldades: string;
  objetivos: string;
  estrategias: string;
  dataInicio: string;
  dataFim: string;
}

export const CAMPOS_PEI = ['dificuldades', 'objetivos', 'estrategias', 'dataInicio', 'dataFim'];

export const SECOES_PEI: { campo: 'dificuldades' | 'objetivos' | 'estrategias'; rotulo: string; placeholder: string }[] = [
  { campo: 'dificuldades', rotulo: 'Dificuldades', placeholder: 'Descreva as dificuldades específicas do aprendente...' },
  { campo: 'objetivos', rotulo: 'Objetivos', placeholder: 'Descreva os objetivos do plano...' },
  { campo: 'estrategias', rotulo: 'Estratégias', placeholder: 'Descreva as estratégias de suporte que serão adotadas...' },
];

// Mesmas regras do CreatePeiDto/PeiService: três seções obrigatórias de até
// 2000 caracteres, datas na faixa permitida e fim ≥ início. Também barra
// seção repetida (texto idêntico ao de outra seção), erro comum ao colar.
export function validarPei(valores: ValoresPei): ErrosCampo {
  const erros = coletarErros({
    dificuldades: validarTexto('Dificuldades', valores.dificuldades, LIMITES.TEXTO_LONGO),
    objetivos: validarTexto('Objetivos', valores.objetivos, LIMITES.TEXTO_LONGO),
    estrategias: validarTexto('Estratégias', valores.estrategias, LIMITES.TEXTO_LONGO),
    dataInicio: validarDataDia('Data de início', valores.dataInicio, {
      minimo: LIMITES.DATA_MIN,
      maximo: LIMITES.DATA_MAX,
    }),
    dataFim: validarDataDia('Data de fim', valores.dataFim, {
      obrigatorio: false,
      minimo: LIMITES.DATA_MIN,
      maximo: LIMITES.DATA_MAX,
    }),
  });

  if (!erros.dataInicio && !erros.dataFim && valores.dataFim && valores.dataFim < valores.dataInicio) {
    erros.dataFim = 'Data de fim: deve ser igual ou posterior à data de início.';
  }

  SECOES_PEI.forEach(({ campo, rotulo }, indice) => {
    if (erros[campo]) return;
    const texto = valores[campo].trim().toLowerCase();
    const anterior = SECOES_PEI.slice(0, indice).find((s) => valores[s.campo].trim().toLowerCase() === texto);
    if (anterior) erros[campo] = `${rotulo}: está igual à seção ${anterior.rotulo}. Descreva cada seção separadamente.`;
  });

  return erros;
}
