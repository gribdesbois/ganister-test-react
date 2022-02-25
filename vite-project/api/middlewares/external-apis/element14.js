const superagent = require('superagent');
const _ = require('lodash');

const config = require('../../../config/config');

const { element14ApiKey } = config;

const searchTerm = async ({
  numberOfResults,
  offset,
  storeInfoId,
  term,
}) => {
  if (!element14ApiKey) {
    return { error: 'No API KEY found for element14' };
  }
  if (!term) {
    return { error: 'No term found' };
  }
  term = 'any:'+term;
  try {
    const res = await superagent
      .get('https://api.element14.com/catalog/products')
      .query({ term })
      .query({ 'storeInfo.id': storeInfoId })
      .query({ 'resultsSettings.offset': offset || 0 })
      .query({ 'resultsSettings.numberOfResults': numberOfResults || 100 })
      .query({ 'callInfo.responseDataFormat': 'json' })
      .query({ 'callinfo.apiKey': element14ApiKey })
      // .query({ 'callInfo.callback': '' })
      .query({ 'resultsSettings.responseGroup': 'Inventory' })
      .query({ 'resultsSettings.refinements.filters': '' })
    return {
      data: _.get(res, 'body.keywordSearchReturn.products', []),
      numberOfResults: _.get(res, 'body.keywordSearchReturn.numberOfResults', 0),
    };
  } catch (err) {
    return { error: err.message };
  }
};

module.exports = {
  searchTerm,
};