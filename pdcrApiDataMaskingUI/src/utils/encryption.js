import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY;
const ENCRYPTION_ENABLED = process.env.REACT_APP_ENCRYPTION_ENABLED === 'true';

/**
 * Check if encryption is enabled
 * @returns {boolean} - Whether encryption is enabled
 */
export const isEncryptionEnabled = () => ENCRYPTION_ENABLED && !!ENCRYPTION_KEY;

/**
 * Encrypt data using AES-256 encryption
 * @param {object} data - The data object to encrypt
 * @returns {string} - The encrypted string
 */
export const encrypt = (data) => {
  if (!ENCRYPTION_KEY) {
    console.warn('Encryption key not found. Data will not be encrypted.');
    return data;
  }

  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return data;
  }
};

/**
 * Decrypt data using AES-256 decryption
 * @param {string} encryptedData - The encrypted string to decrypt
 * @returns {object} - The decrypted data object
 */
export const decrypt = (encryptedData) => {
  if (!ENCRYPTION_KEY) {
    console.warn('Encryption key not found. Data will not be decrypted.');
    return encryptedData;
  }

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData;
  }
};
