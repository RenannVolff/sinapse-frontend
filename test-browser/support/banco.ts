import pg from 'pg';
import { DOMINIO_EMAIL_SUITE, resolverBancoTeste } from './ambiente';

// Acesso direto ao Postgres de teste. Usado só para o que a API não permite
// (o token de verificação de e-mail só existe em hash no banco) e para a
// limpeza final. Cada conexão confere, no próprio Postgres, em qual banco
// está antes de escrever qualquer coisa.

async function conectar(): Promise<pg.Client> {
  const { url, nomeBanco } = resolverBancoTeste();

  // O "?schema=public" é sintaxe do Prisma; o pg não entende o parâmetro.
  const semSchema = new URL(url);
  semSchema.searchParams.delete('schema');

  const cliente = new pg.Client({ connectionString: semSchema.toString() });
  await cliente.connect();

  const { rows } = await cliente.query<{ current_database: string }>('SELECT current_database()');
  const conectado = rows[0].current_database;
  if (conectado !== nomeBanco || !conectado.endsWith('_test')) {
    await cliente.end();
    throw new Error(`[test:browser] ABORTADO: conectado em "${conectado}", não no banco de teste "${nomeBanco}".`);
  }

  return cliente;
}

// Se o UPDATE não achar o usuário recém-criado pela API, o backend que
// respondeu não está gravando no banco de teste: aborta a suíte.
export async function marcarEmailVerificado(email: string): Promise<void> {
  const cliente = await conectar();
  try {
    const { rowCount } = await cliente.query(
      'UPDATE usuarios SET "emailVerificado" = true, "tokenVerificacao" = NULL, "tokenVerificacaoExpiraEm" = NULL WHERE email = $1',
      [email],
    );
    if (rowCount !== 1) {
      throw new Error(
        `[test:browser] ABORTADO: o usuário ${email} não foi encontrado no banco de teste. ` +
          'O backend em http://localhost:3000 não está usando a DATABASE_URL_TEST.',
      );
    }
  } finally {
    await cliente.end();
  }
}

// Apaga fisicamente tudo o que pertence aos usuários da suíte (domínio
// próprio). Aprendente não tem cascade para usuário, então sai antes;
// atendimentos, atividades, checklist e PEIs caem por cascade do aprendente,
// e templates/tarefas pelo do usuário.
export async function limparDadosDaSuite(): Promise<number> {
  const cliente = await conectar();
  try {
    await cliente.query('BEGIN');
    const { rows } = await cliente.query<{ id: string }>(
      'SELECT id FROM usuarios WHERE email LIKE $1',
      [`%@${DOMINIO_EMAIL_SUITE}`],
    );
    const ids = rows.map((r) => r.id);
    if (ids.length > 0) {
      await cliente.query('DELETE FROM audit_logs WHERE "userId" = ANY($1)', [ids]);
      await cliente.query('DELETE FROM aprendentes WHERE "usuarioId" = ANY($1)', [ids]);
      await cliente.query('DELETE FROM usuarios WHERE id = ANY($1)', [ids]);
    }
    await cliente.query('COMMIT');
    return ids.length;
  } catch (erro) {
    await cliente.query('ROLLBACK');
    throw erro;
  } finally {
    await cliente.end();
  }
}
