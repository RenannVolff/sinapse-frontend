// Datas "só dia" (AAAA-MM-DD): nascimento, vigência do PEI, período de
// relatório, emissão. O back grava esses dias à meia-noite UTC, então
// `new Date('2026-10-22').toLocaleDateString()` mostraria 21/10 no Brasil.
// Aqui o dia é sempre lido da própria string, nunca convertido de fuso.

const REGEX_DIA = /^(\d{4})-(\d{2})-(\d{2})/;

function doisDigitos(n: number): string {
  return String(n).padStart(2, '0');
}

// AAAA-MM-DD de um Date no fuso local (ex.: "hoje" do usuário).
export function diaLocal(data: Date = new Date()): string {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

export function hojeIso(): string {
  return diaLocal();
}

// Mesmo dia/mês de hoje, N anos atrás.
export function anosAtrasIso(anos: number): string {
  const hoje = hojeIso();
  return `${Number(hoje.slice(0, 4)) - anos}${hoje.slice(4)}`;
}

// Parte AAAA-MM-DD de "AAAA-MM-DD" ou de um ISO completo, se for um dia real
// do calendário (rejeita 2026-02-30 e ano com mais de 4 dígitos).
export function extrairDia(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const match = REGEX_DIA.exec(valor);
  if (!match) return null;

  // ISO com horário: o dia vem dos componentes UTC. Registros antigos estão
  // à meia-noite UTC e os novos ao meio-dia UTC; os dois são o mesmo dia
  // em UTC, enquanto o fuso local (UTC-3) mostraria o anterior.
  if (valor.length > 10 && valor[10] === 'T') {
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return null;
    return `${data.getUTCFullYear()}-${doisDigitos(data.getUTCMonth() + 1)}-${doisDigitos(data.getUTCDate())}`;
  }

  const [, ano, mes, dia] = match.map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  const valido =
    data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
  return valido ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

// dd/mm/aaaa a partir de um dia "só data" (ou ISO gravado à meia-noite UTC).
export function formatarDiaBr(valor: string | null | undefined): string {
  const dia = extrairDia(valor);
  if (!dia) return '';
  const [ano, mes, d] = dia.split('-');
  return `${d}/${mes}/${ano}`;
}

// Idade em anos completos a partir de um dia "só data".
export function calcularIdade(valor: string): number | null {
  const dia = extrairDia(valor);
  if (!dia) return null;
  const [ano, mes, d] = dia.split('-').map(Number);
  const hoje = new Date();
  let idade = hoje.getFullYear() - ano;
  const mesAtual = hoje.getMonth() + 1;
  if (mesAtual < mes || (mesAtual === mes && hoje.getDate() < d)) idade--;
  return idade;
}

// Devolve o período em ordem; `invertido` diz se foi preciso trocar.
export function ordenarPeriodo(inicio: string, fim: string): { inicio: string; fim: string; invertido: boolean } {
  if (inicio && fim && inicio > fim) return { inicio: fim, fim: inicio, invertido: true };
  return { inicio, fim, invertido: false };
}
