// A Agenda só lista o mês corrente e o backend recusa horário no passado,
// então os testes que passam pela agenda precisam de horários futuros
// DENTRO do mês atual, alinhados à grade de 30 min da tela Nova Sessão.

export interface Horario {
  data: string; // YYYY-MM-DD (fuso local, igual ao <input type="date">)
  hora: string; // HH:MM, rótulo do botão na grade
  inicio: Date;
}

function doisDigitos(n: number): string {
  return String(n).padStart(2, '0');
}

// Blocos de 30 min a partir de agora + 2 h (folga para a suíte rodar),
// limitados ao mês corrente. Lista vazia só nas últimas horas do último dia
// do mês.
export function horariosFuturosNoMes(): Horario[] {
  const agora = new Date();
  const inicio = new Date(agora.getTime() + 2 * 60 * 60 * 1000);
  inicio.setMinutes(inicio.getMinutes() < 30 ? 30 : 60, 0, 0);

  const horarios: Horario[] = [];
  for (let t = new Date(inicio); t.getMonth() === agora.getMonth(); t = new Date(t.getTime() + 30 * 60 * 1000)) {
    // A sessão de 60 min precisa terminar no mesmo dia da grade.
    if (t.getHours() === 23) continue;
    horarios.push({
      data: `${t.getFullYear()}-${doisDigitos(t.getMonth() + 1)}-${doisDigitos(t.getDate())}`,
      hora: `${doisDigitos(t.getHours())}:${doisDigitos(t.getMinutes())}`,
      inicio: new Date(t),
    });
  }
  return horarios;
}
