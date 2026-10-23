// Espelho de `src/common/validation/limits.constants.ts` do backend: fonte
// única de maxLength, contadores e validação no cliente. Mudou lá, muda aqui.
// Regra geral: input comum de 30 a 50 caracteres; só textarea de escopo longo
// passa disso.
export const LIMITES = {
  // Pessoas e contato
  NOME_PESSOA: 50,
  EMAIL: 50,
  // Login/recuperação aceitam o máximo do padrão (RFC 5321) para não trancar
  // fora uma conta antiga; o cadastro novo é que fica em 50.
  EMAIL_LOGIN: 254,
  SENHA_MIN: 8,
  SENHA_MAX: 50,
  // O bcrypt só considera os primeiros 72 bytes; no login aceita até isso.
  SENHA_LOGIN_MAX: 72,
  TELEFONE: 15,

  // Títulos e rótulos curtos
  TITULO: 50,
  ROTULO_CURTO: 30,

  // Áreas de texto
  TEXTO_CURTO: 300,
  TEXTO_MEDIO: 1000,
  TEXTO_LONGO: 2000,

  // Códigos técnicos
  CODIGO_2FA: 20,

  // Numéricos e datas
  DURACAO_MIN_MINUTOS: 1,
  DURACAO_MAX_MINUTOS: 1440,
  NIVEL_DIFICULDADE_MIN: 1,
  NIVEL_DIFICULDADE_MAX: 5,
  IDADE_MAX_ANOS: 120,
  DATA_MIN: '2000-01-01',
  DATA_MAX: '2100-12-31',
  POR_PAGINA_TAREFAS: 20,
} as const;
