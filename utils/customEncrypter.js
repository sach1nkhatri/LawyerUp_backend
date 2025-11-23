// Yeah, I know there are like 101 crypto libraries out there —
// but I brought back this simple custom text cipher I built in Python during my first semester. (now its java)
// It’s basic, nostalgic, and perfect for showing beginners how encryption works at a low level.

const encryptionMap = {
    A: 'F', B: 'V', C: 'H', D: 'N', E: 'G', F: 'D', G: 'U', H: 'L',
    I: 'T', J: 'A', K: 'M', L: 'O', M: 'K', N: 'P', O: 'B', P: 'R',
    Q: 'S', R: 'C', S: 'E', T: 'W', U: 'Y', V: 'Z', W: 'X', X: 'J',
    Y: 'Q', Z: 'I'
  };
  
  const decryptionMap = Object.fromEntries(
    Object.entries(encryptionMap).map(([k, v]) => [v, k])
  );
  
  /**
   * Encrypts a message using the custom character mapping, preserving case
   * @param {string} text - Plain input text
   * @returns {string} Encrypted message
   */
  function encrypt(text) {
    return text.split('').map(char => {
      const upper = char.toUpperCase();
      const mapped = encryptionMap[upper];
      if (!mapped) return char;
      return char === upper ? mapped : mapped.toLowerCase();
    }).join('');
  }
  
  /**
   * Decrypts a message using the custom character mapping, preserving case
   * @param {string} text - Encrypted input text
   * @returns {string} Decrypted (original) message
   */
  function decrypt(text) {
    return text.split('').map(char => {
      const upper = char.toUpperCase();
      const mapped = decryptionMap[upper];
      if (!mapped) return char;
      return char === upper ? mapped : mapped.toLowerCase();
    }).join('');
  }
  
  module.exports = { encrypt, decrypt };
  