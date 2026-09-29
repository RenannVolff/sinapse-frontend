// Mesma regra do backend (SenhaForte(), aplicada em cadastro e redefinição
// de senha): mínimo 8 caracteres, 1 maiúscula, 1 minúscula e (1 número ou
// 1 caractere especial).
const SENHA_FORTE_REGEX = /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;

export const MENSAGEM_SENHA_FRACA =
  'A senha deve ter no mínimo 8 caracteres, com 1 letra maiúscula, 1 minúscula e 1 número ou símbolo.';

export const DICA_SENHA_FORTE =
  'Mínimo 8 caracteres, com 1 letra maiúscula, 1 minúscula e 1 número ou símbolo.';

export function senhaEhForte(senha: string): boolean {
  return senha.length >= 8 && SENHA_FORTE_REGEX.test(senha);
}
