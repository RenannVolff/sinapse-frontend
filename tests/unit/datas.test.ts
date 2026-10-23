// Datas "só dia" em navegador no fuso de Brasília. Roda com
// `npm run test:unit` (test runner nativo do Node, sem dependência nova).
// O fuso é fixado antes de qualquer Date ser criado.
process.env.TZ = 'America/Sao_Paulo';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularIdade, extrairDia, formatarDiaBr, ordenarPeriodo } from '../../src/utils/datas.ts';

const MEIA_NOITE_UTC = '2026-03-10T00:00:00.000Z'; // registros antigos
const MEIO_DIA_UTC = '2026-03-10T12:00:00.000Z'; // registros novos

test('o fuso simulado é o de Brasília (controle)', () => {
  // Sem tratamento, a meia-noite UTC cairia no dia anterior.
  assert.equal(new Date(MEIA_NOITE_UTC).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }), '09/03/2026');
  assert.equal(new Date(MEIA_NOITE_UTC).getDate(), 9);
});

test('os dois formatos gravados mostram 10/03/2026', () => {
  assert.equal(formatarDiaBr(MEIA_NOITE_UTC), '10/03/2026');
  assert.equal(formatarDiaBr(MEIO_DIA_UTC), '10/03/2026');
  assert.equal(formatarDiaBr('2026-03-10'), '10/03/2026');
});

test('preenchimento de campo date usa o mesmo dia', () => {
  assert.equal(extrairDia(MEIA_NOITE_UTC), '2026-03-10');
  assert.equal(extrairDia(MEIO_DIA_UTC), '2026-03-10');
});

test('datas inválidas não viram outro dia', () => {
  assert.equal(extrairDia('2026-02-30'), null);
  assert.equal(extrairDia('202601-01-01'), null);
  assert.equal(extrairDia(''), null);
  assert.equal(formatarDiaBr(null), '');
});

test('idade usa o dia gravado, não o anterior', () => {
  const hoje = new Date();
  const ano = hoje.getFullYear() - 10;
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  // Aniversário hoje: 10 anos completos nos dois formatos.
  assert.equal(calcularIdade(`${ano}-${mes}-${dia}T00:00:00.000Z`), 10);
  assert.equal(calcularIdade(`${ano}-${mes}-${dia}T12:00:00.000Z`), 10);
});

test('período invertido é trocado', () => {
  assert.deepEqual(ordenarPeriodo('2026-09-30', '2026-03-01'), { inicio: '2026-03-01', fim: '2026-09-30', invertido: true });
  assert.deepEqual(ordenarPeriodo('2026-03-01', '2026-09-30'), { inicio: '2026-03-01', fim: '2026-09-30', invertido: false });
});
