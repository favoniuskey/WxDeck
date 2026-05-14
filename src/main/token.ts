declare const __AVWX_TOKEN_ENC__: string;
declare const __XOR_KEY__: string;

let cached: string | null = null;

export function getAvwxToken(): string {
  if (cached !== null) return cached;
  const encoded = __AVWX_TOKEN_ENC__;
  const key = __XOR_KEY__;
  if (!encoded) {
    cached = '';
    return cached;
  }
  const buf = Buffer.from(encoded, 'base64');
  const out = new Array<string>(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = String.fromCharCode(buf[i] ^ key.charCodeAt(i % key.length));
  }
  cached = out.join('');
  return cached;
}
