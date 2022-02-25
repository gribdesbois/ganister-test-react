module.exports = {
  /**
   * Returns if data is an object or not.
   * @param   {any}     data data to check
   * @returns {Boolean} true if data is an object, otherwise false
   */
  isObject: (data) => {
    return data && typeof data === 'object' && !Array.isArray(data);
  },

  /**
   * Replace all empty strings by 'null'
   * @param {any} data data to modify
   * @returns Modified data
   */
  nullifyEmptyStrings: (data) => {
    const stringData = typeof data === 'string';
    const arrayData = Array.isArray(data);
    const objectData = typeof data === 'object' && !arrayData;

    if (!data && !stringData) return data;

    if (objectData) {
      Object.entries(data).forEach(([key, value]) => {
        data[key] = module.exports.nullifyEmptyStrings(value);
      });
    }

    if (arrayData) {
      data = data.map((v) => module.exports.nullifyEmptyStrings(v));
    }

    if (stringData) {
      const trimmedData = data.trim();
      if (!trimmedData.length) data = null;
    }

    return data;
  },

  /**
   * Remove keys from data
   * @param {Object}   data data to modify
   * @param {String[]} keys keys to remove from data
   * @returns {Object} Modified data
   */
  removeKeys: (data, keys) => {
    if (!data) return;

    Object.entries(data).forEach(([key, value]) => {
      const objectValue = typeof value === 'object' && !Array.isArray(value);
      const keyToRemove = keys.includes(key);

      if (keyToRemove) {
        delete data[key];
      } else if (objectValue) {
        module.exports.removeKeys(value, keys);
      }
    });
    return data;
  },
};
