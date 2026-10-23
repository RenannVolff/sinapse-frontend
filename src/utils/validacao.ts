import { LIMITES } from '../constants/limits';
import { anosAtrasIso, extrairDia, formatarDiaBr, hojeIso } from './datas';

// Validação no cliente com as mesmas regras e o mesmo formato de mensagem
// ("Rótulo: regra") dos DTOs do backend. Cada função devolve a mensagem do
// erro ou null. O back continua validando: isto só poupa a ida ao servidor.

export type ErrosCampo = Record<string, string>;

// Mesma regra de REGEX_NOME_PESSOA do back (campos.decorators.ts): letras
// (com acento), espaço, ponto, hífen e apóstrofo; começa em letra e termina
// em letra ou ponto ("Dr. João", "João Silva Jr.").
const REGEX_NOME_PESSOA = /^\p{L}+(?:[\p{L} .'’-]*[\p{L}.])?$/u;
// Caracteres que nunca entram num nome: somem já na digitação/colagem.
const REGEX_FORA_DO_NOME = /[^\p{L} .'’-]/gu;

export function filtrarNomePessoa(valor: string): string {
  return valor.replace(REGEX_FORA_DO_NOME, '');
}
const REGEX_TELEFONE = /^\+?[\d\s()-]{8,}$/;
// Formato básico local@dominio.tld, sem espaço. O back faz a checagem
// completa (domínio existente, e-mail temporário, sugestão de digitação).
const REGEX_EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

interface OpcoesTexto {
  obrigatorio?: boolean;
}

export function validarTexto(rotulo: string, valor: string, maximo: number, opcoes: OpcoesTexto = {}): string | null {
  const texto = valor.trim();
  if (!texto) return opcoes.obrigatorio === false ? null : `${rotulo}: campo obrigatório.`;
  if (texto.length > maximo) return `${rotulo}: máximo de ${maximo} caracteres.`;
  return null;
}

export function validarNomePessoa(rotulo: string, valor: string, opcoes: OpcoesTexto = {}): string | null {
  const erro = validarTexto(rotulo, valor, LIMITES.NOME_PESSOA, opcoes);
  if (erro || !valor.trim()) return erro;
  if (!REGEX_NOME_PESSOA.test(valor.trim())) return `${rotulo}: use apenas letras, espaço, ponto, hífen ou apóstrofo.`;
  return null;
}

export function validarTelefone(rotulo: string, valor: string): string | null {
  const erro = validarTexto(rotulo, valor, LIMITES.TELEFONE);
  if (erro) return erro;
  const digitos = valor.replace(/\D/g, '');
  if (!REGEX_TELEFONE.test(valor.trim()) || digitos.length < 10) {
    return `${rotulo}: informe um telefone válido com DDD, ex.: (47) 99999-0000.`;
  }
  return null;
}

// Máscara de telefone brasileiro enquanto digita/cola: só dígitos (letras,
// "e", "+", "-" e sinais colados somem), até 11, no formato (47) 99999-0000.
export function formatarTelefone(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  const ddd = `(${d.slice(0, 2)}) `;
  const resto = d.slice(2);
  const corte = resto.length > 8 ? 5 : 4;
  return resto.length > corte ? `${ddd}${resto.slice(0, corte)}-${resto.slice(corte)}` : `${ddd}${resto}`;
}

// E-mail como o back recebe: aparado e em minúsculas.
export function normalizarEmail(valor: string): string {
  return valor.trim().toLowerCase();
}

// O back sugere a correção de domínios digitados errado
// ("... Você quis dizer nome@gmail.com?"). Devolve o e-mail sugerido.
export function extrairSugestaoEmail(mensagem: string | undefined): string | null {
  const match = mensagem ? /Você quis dizer (\S+@\S+?)\?/.exec(mensagem) : null;
  return match ? match[1] : null;
}

export function validarEmail(rotulo: string, valor: string, maximo: number = LIMITES.EMAIL): string | null {
  const email = normalizarEmail(valor);
  if (!email) return `${rotulo}: campo obrigatório.`;
  if (email.length > maximo) return `${rotulo}: máximo de ${maximo} caracteres.`;
  if (!REGEX_EMAIL.test(email)) return `${rotulo}: informe um e-mail válido, ex.: nome@dominio.com.`;
  return null;
}

interface OpcoesData {
  obrigatorio?: boolean;
  naoFutura?: boolean;
  anosAtrasMax?: number;
  minimo?: string;
  maximo?: string;
}

export function validarDataDia(rotulo: string, valor: string, opcoes: OpcoesData = {}): string | null {
  if (!valor) return opcoes.obrigatorio === false ? null : `${rotulo}: campo obrigatório.`;
  const dia = extrairDia(valor);
  if (!dia) return `${rotulo}: informe uma data válida (dd/mm/aaaa).`;
  if (opcoes.naoFutura && dia > hojeIso()) return `${rotulo}: não pode ser uma data futura.`;
  if (opcoes.anosAtrasMax && dia < anosAtrasIso(opcoes.anosAtrasMax)) {
    return `${rotulo}: não pode ser anterior a ${opcoes.anosAtrasMax} anos atrás.`;
  }
  const { minimo, maximo } = opcoes;
  if ((minimo && dia < minimo) || (maximo && dia > maximo)) {
    if (minimo && maximo) return `${rotulo}: deve estar entre ${formatarDiaBr(minimo)} e ${formatarDiaBr(maximo)}.`;
    return minimo
      ? `${rotulo}: não pode ser anterior a ${formatarDiaBr(minimo)}.`
      : `${rotulo}: não pode ser posterior a ${formatarDiaBr(maximo)}.`;
  }
  return null;
}

// Junta só os campos com erro.
export function coletarErros(regras: Record<string, string | null>): ErrosCampo {
  const erros: ErrosCampo = {};
  for (const [campo, mensagem] of Object.entries(regras)) {
    if (mensagem) erros[campo] = mensagem;
  }
  return erros;
}
