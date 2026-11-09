// Ordenação no cliente com as mesmas regras do backend (ordenacao.ts lá):
// texto em pt-BR sem diferenciar maiúsculas/acentos, telefone só pelos
// dígitos e valor vazio sempre no fim, nas duas direções. A listagem já vem
// ordenada da API; isto é a garantia defensiva (e serve a telas que ordenam
// listas já carregadas).

export type DirecaoOrdenacao = 'asc' | 'desc';

export function compararTexto(a: string, b: string): number {
  return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
}

export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

// Compara a sequência de dígitos como texto, como o banco faz: a máscara
// ("(11) 9...") não interfere.
export function compararDigitos(a: string, b: string): number {
  const da = somenteDigitos(a);
  const db = somenteDigitos(b);
  return da < db ? -1 : da > db ? 1 : 0;
}

export type Comparador = (a: string, b: string) => number;

interface CriterioOrdenacao<T> {
  valor: (item: T) => string;
  comparar?: Comparador;
  // Desempate fixo em ordem crescente (ex.: nome do aprendente).
  desempate?: (item: T) => string;
  // Como o valor vira "vazio" para ir ao fim (padrão: trim do texto).
  normalizarVazio?: (valor: string) => string;
}

// Devolve uma cópia ordenada; não altera o array recebido.
export function ordenarLista<T>(
  itens: readonly T[],
  direcao: DirecaoOrdenacao,
  { valor, comparar = compararTexto, desempate, normalizarVazio = (v) => v.trim() }: CriterioOrdenacao<T>,
): T[] {
  const sinal = direcao === 'desc' ? -1 : 1;
  return [...itens].sort((x, y) => {
    const vx = valor(x) ?? '';
    const vy = valor(y) ?? '';
    const vazioX = normalizarVazio(vx) === '';
    const vazioY = normalizarVazio(vy) === '';
    if (vazioX !== vazioY) return vazioX ? 1 : -1;

    const resultado = vazioX ? 0 : comparar(vx, vy) * sinal;
    if (resultado !== 0 || !desempate) return resultado;
    return compararTexto(desempate(x) ?? '', desempate(y) ?? '');
  });
}

// Critérios das listagens, com os mesmos nomes de `sortBy` da API.
export type OrdenacaoAprendente = 'name' | 'guardianName' | 'contact';

interface AprendenteOrdenavel {
  nomeCompleto: string;
  responsavel: string;
  contato: string;
}

const CAMPO_APRENDENTE: Record<OrdenacaoAprendente, (a: AprendenteOrdenavel) => string> = {
  name: (a) => a.nomeCompleto,
  guardianName: (a) => a.responsavel,
  contact: (a) => a.contato,
};

// Empate (ou valor vazio) desempata pelo nome do aprendente, como no banco.
export function ordenarAprendentes<T extends AprendenteOrdenavel>(
  lista: readonly T[],
  sortBy: OrdenacaoAprendente = 'name',
  order: DirecaoOrdenacao = 'asc',
): T[] {
  const porContato = sortBy === 'contact';
  return ordenarLista(lista, order, {
    valor: CAMPO_APRENDENTE[sortBy],
    comparar: porContato ? compararDigitos : compararTexto,
    normalizarVazio: porContato ? somenteDigitos : undefined,
    desempate: (a) => a.nomeCompleto,
  });
}

export function ordenarPeiTemplates<T extends { nome: string }>(lista: readonly T[], order: DirecaoOrdenacao = 'asc'): T[] {
  return ordenarLista(lista, order, { valor: (t) => t.nome });
}
