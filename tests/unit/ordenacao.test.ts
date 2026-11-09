// Ordenação no cliente (aprendentes, relatórios e modelos de PEI). Roda com
// `npm run test:unit`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ordenarAprendentes, ordenarPeiTemplates } from '../../src/utils/ordenacao.ts';

const aprendente = (id: string, nomeCompleto: string, responsavel = '', contato = '') => ({
  id,
  nomeCompleto,
  responsavel,
  contato,
});

const nomes = (lista: { nomeCompleto: string }[]) => lista.map((a) => a.nomeCompleto);

const LISTA = [
  aprendente('1', 'bruno', 'Zé', '(11) 99999-0000'),
  aprendente('2', 'Álvaro', 'ana', '(21) 98888-1111'),
  aprendente('3', 'Zoe', 'Érica', '(11) 91111-2222'),
  aprendente('4', 'alice', '', ''),
];

test('nome em ordem pt-BR sem diferenciar acento e caixa', () => {
  assert.deepEqual(nomes(ordenarAprendentes(LISTA, 'name', 'asc')), ['alice', 'Álvaro', 'bruno', 'Zoe']);
  assert.deepEqual(nomes(ordenarAprendentes(LISTA, 'name', 'desc')), ['Zoe', 'bruno', 'Álvaro', 'alice']);
});

test('responsável vazio fica no fim nas duas direções', () => {
  assert.deepEqual(nomes(ordenarAprendentes(LISTA, 'guardianName', 'asc')), ['Álvaro', 'Zoe', 'bruno', 'alice']);
  assert.deepEqual(nomes(ordenarAprendentes(LISTA, 'guardianName', 'desc')), ['bruno', 'Zoe', 'Álvaro', 'alice']);
});

test('contato ordena pelos dígitos, ignorando a máscara', () => {
  assert.deepEqual(nomes(ordenarAprendentes(LISTA, 'contact', 'asc')), ['Zoe', 'bruno', 'Álvaro', 'alice']);
  assert.deepEqual(nomes(ordenarAprendentes(LISTA, 'contact', 'desc')), ['Álvaro', 'bruno', 'Zoe', 'alice']);
});

test('não altera o array original', () => {
  const copia = [...LISTA];
  ordenarAprendentes(LISTA, 'name', 'desc');
  assert.deepEqual(LISTA, copia);
});

test('modelos de PEI por título', () => {
  const modelos = ['Écrita', 'atenção', 'Leitura'].map((nome, i) => ({
    id: String(i),
    nome,
    dificuldades: '',
    objetivos: '',
    estrategias: '',
  }));
  assert.deepEqual(ordenarPeiTemplates(modelos, 'asc').map((m) => m.nome), ['atenção', 'Écrita', 'Leitura']);
  assert.deepEqual(ordenarPeiTemplates(modelos, 'desc').map((m) => m.nome), ['Leitura', 'Écrita', 'atenção']);
});
