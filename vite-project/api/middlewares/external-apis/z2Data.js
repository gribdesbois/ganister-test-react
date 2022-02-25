const superagent = require('superagent');
const _ = require('lodash');

const config = require('../../../config/config');

const { z2DataApiKey } = config;

const baseURL = 'https://api.z2data.com/api/PartDataSearch';

const searchParts = async (params) => {
  if (!z2DataApiKey) {
    return { error: true, message: 'Api key not found for z2Data' };
  }
  try {
    const res = await superagent.get(`${baseURL}/GetPartDataByKeySearch?keySearch=${params.partNumber}&Apikey=${z2DataApiKey}`);
    const data = _.get(res, 'body.results');
    const numberOfResults = _.get(res, 'body.numFound');
    return { data, numberOfResults };
  } catch (err) {
    return { error: true, message: err.message };
  }
};

const getPartDetail = async (params) => {
  if (!z2DataApiKey) {
    return { error: true, message: 'Api key not found for z2Data' };
  }
  try {
    const res = await superagent.get(`${baseURL}/GetPartDataByPartId?PartId=${params.partNumber}&Apikey=${z2DataApiKey}`);
    const data = _.get(res, 'body.results');
    const numberOfResults = _.get(res, 'body.numFound');
    return { data, numberOfResults };
  } catch (err) {
    return { error: true, message: err.message };
  }
};

module.exports = {
  searchParts,
  getPartDetail,
};