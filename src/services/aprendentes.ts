import { api } from './api';
import { ordenarAprendentes, type DirecaoOrdenacao, type OrdenacaoAprendente } from '../utils/ordenacao';

export interface Aprendente {
  id: string;
  nomeCompleto: string;
  responsavel: string;
  contato: string;
}

export type { OrdenacaoAprendente };

// Contrato de GET /aprendentes (ListarAprendentesQueryDto no backend).
export interface ListarAprendentesParams {
  sortBy?: OrdenacaoAprendente;
  order?: DirecaoOrdenacao;
}

// A API já devolve na ordem pedida; a ordenação no cliente é defensiva.
export async function listarAprendentes(
  { sortBy = 'name', order = 'asc' }: ListarAprendentesParams = {},
): Promise<Aprendente[]> {
  const { data } = await api.get<Aprendente[]>('/aprendentes', { params: { sortBy, order } });
  return ordenarAprendentes(data, sortBy, order);
}
