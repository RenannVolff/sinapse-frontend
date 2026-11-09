import { api } from './api';
import { ordenarPeiTemplates, type DirecaoOrdenacao } from '../utils/ordenacao';

export interface PeiTemplate {
  id: string;
  nome: string;
  dificuldades: string;
  objetivos: string;
  estrategias: string;
}

export type PeiTemplatePayload = Omit<PeiTemplate, 'id'>;

// Contrato de GET /pei-templates (ListarPeiTemplatesQueryDto no backend):
// `title` ordena pelo nome do modelo.
export interface ListarPeiTemplatesParams {
  order?: DirecaoOrdenacao;
}

export async function listarPeiTemplates(
  { order = 'asc' }: ListarPeiTemplatesParams = {},
): Promise<PeiTemplate[]> {
  const { data } = await api.get<PeiTemplate[]>('/pei-templates', { params: { sortBy: 'title', order } });
  return ordenarPeiTemplates(data, order);
}

export async function buscarPeiTemplate(id: string): Promise<PeiTemplate> {
  const { data } = await api.get<PeiTemplate>(`/pei-templates/${id}`);
  return data;
}

export async function criarPeiTemplate(payload: PeiTemplatePayload): Promise<PeiTemplate> {
  const { data } = await api.post<PeiTemplate>('/pei-templates', payload);
  return data;
}

export async function atualizarPeiTemplate(id: string, payload: Partial<PeiTemplatePayload>): Promise<PeiTemplate> {
  const { data } = await api.patch<PeiTemplate>(`/pei-templates/${id}`, payload);
  return data;
}

// Soft delete no backend (204 sem corpo).
export async function excluirPeiTemplate(id: string): Promise<void> {
  await api.delete(`/pei-templates/${id}`);
}
