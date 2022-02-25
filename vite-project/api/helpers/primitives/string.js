module.exports = {
  /**
   * Returns whether a string is valid JSON or not.
   * @param {String} string string to check
   * @returns {Boolean} true if valid JSON, otherwise false
   */
  isJSON: (string) => {
    try {
      if (!string) return false;

      JSON.parse(string);
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Capitalize a string
   * @param {String} string string to capitalize
   * @returns {String} Capitalized string
   */
  capitalize: (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  },
};
