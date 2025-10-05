// /src/utils/aesUtils.js

export async function decryptAES(encryptedBuffer, keyHex, ivHex) {
  const key = hexToBuffer(keyHex);
  const iv = hexToBuffer(ivHex);

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    key,
    { name: "AES-CBC" },
    false,
    ["decrypt"]
  );

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-CBC", iv },
    cryptoKey,
    encryptedBuffer
  );

  return new Uint8Array(decrypted);
}

function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  return bytes.buffer;
}
