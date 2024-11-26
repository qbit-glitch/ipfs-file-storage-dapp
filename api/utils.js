// api/utils.js
export const validateHash = (hash) => {
    const MAX_HASH_LENGTH = 255;
    if (!hash || typeof hash !== 'string') {
      return false;
    }
    if (hash.length > MAX_HASH_LENGTH || hash.length === 0) {
      return false;
    }
    return true;
  };