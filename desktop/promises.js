
/**
 * Get a promise that rejects
 * @param {string} reason - Any reason 
 * @returns {Promise<any>} Promise that rejects
 */
const rejectPromise = (reason) => {
  return new Promise((_, reject) => {
    reject(new Error(reason));
  });
};

module.exports = { rejectPromise };
