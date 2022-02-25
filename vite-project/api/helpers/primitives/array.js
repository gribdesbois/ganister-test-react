module.exports = {
  /**
   * Remove duplicate items from array
   * @param   {Array} array array to filter
   * @returns {Array} Array with unique items
   */
  unique: (array) => {
    const filteredArray = array.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
    return filteredArray;
  },

  /**
   * Remove dyplicate items from array by property
   * @param   {Object[]} array    array to filter
   * @param   {String}   property property to filter objects by
   * @returns {Object[]} Array with unique items
   */
  uniqueBy: (array, property) => {
    const uniqueItems = [];
    array.forEach((item) => {
      const existingItem = uniqueItems.find((r) => r[property] === item[property]);
      if (!existingItem) uniqueItems.push(item);
    });
    return uniqueItems;
  },

  /**
   * Get the last item of array
   * @param {Array} array array to get the last item from
   * @returns {any} Last array's item
   */
  lastOf: (array) => {
    const lastIndex = array.length - 1;
    const value = array[lastIndex];
    return value;
  },
};
