import { createHmac } from 'node:crypto';

// TOTP (RFC 6238) com os padrões do otplib usado no backend: SHA-1,
// 6 dígitos, passo de 30 s, segredo em base32. É o que o app autenticador
// faria a partir do QR code.

function base32ParaBuffer(segredo: string): Buffer {
  const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const limpo = segredo.replace(/=+$/, '').replace(/\s+/g, '').toUpperCase();
  let bits = '';
  for (const caractere of limpo) {
    const valor = alfabeto.indexOf(caractere);
    if (valor < 0) throw new Error(`Caractere base32 inválido: ${caractere}`);
    bits += valor.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export function gerarCodigoTotp(segredo: string, instante = Date.now()): string {
  const contador = Math.floor(instante / 1000 / 30);
  const mensagem = Buffer.alloc(8);
  mensagem.writeBigUInt64BE(BigInt(contador));

  const hmac = createHmac('sha1', base32ParaBuffer(segredo)).update(mensagem).digest();
  const deslocamento = hmac[hmac.length - 1] & 0x0f;
  const binario = (hmac.readUInt32BE(deslocamento) & 0x7fffffff) % 1_000_000;
  return String(binario).padStart(6, '0');
}
