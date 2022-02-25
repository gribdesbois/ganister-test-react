const superagent = require('superagent');
const _ = require('lodash');
const xmlbuilder = require('xmlbuilder');
const xmlParser = require('fast-xml-parser');

const config = require('../../../config/config');

const baseURL = 'https://4donline.ihs.com/websvc/action/websvcaction';
const parserOptions = {
  attributeNamePrefix: '',
  attrNodeName: 'attr', // default is 'false'
  textNodeName: '#text',
  ignoreAttributes: false,
  ignoreNameSpace: false,
  allowBooleanAttributes: false,
  parseNodeValue: true,
  parseAttributeValue: true,
  trimValues: true,
  cdataTagName: '__cdata', // default is 'false'
  cdataPositionChar: '\\c',
  parseTrueNumberOnly: false,
  arrayMode: false, // 'strict'
  stopNodes: ['parse-me-as-string'],
};
const { ihsUsername, ihsPassword } = config;

const formatPartDetails = (item) => {
  if (_.isEmpty(item)) return [];
  if (Array.isArray(item)) {
    return item.filter((i) => !_.isEmpty(i)).map((i) => {
      const alert = { ...i.attr };
      const doc = _.get(i, 'Doc.attr');
      if (doc) alert._doc = doc;
      return alert;
    });
  }
  const alert = { ...item.attr };
  const doc = _.get(item, 'Doc.attr');
  if (doc) alert._doc = doc;
  return [alert];
};

const formatPart = (part) => {
  const formattedPart = { ...part.attr };
  _.get(part, 'Partdetails', [])
    .filter((item) => !_.isEmpty(item) && _.get(item, 'attr.count'))
    .map((item) => {
      const itemName = _.get(item, 'attr.type');
      switch (itemName) {
        case 'ALERTS':
          formattedPart._alerts = formatPartDetails(item.Alerts);
          break;
        case 'ALT':
          formattedPart._alt = formatPartDetails(item.Alt);
          break;
        case 'ALT_COMBINED':
          formattedPart._altCombined = formatPartDetails(item.Alt);
          break;
        case 'DETAILS':
          formattedPart._details = formatPartDetails(item.Details);
          break;
        case 'DOC':
          formattedPart._docs = formatPartDetails(item.Doc);
          break;
        case 'HAZMAT':
          formattedPart._hazmat = formatPartDetails(item.Hazmat);
          break;
        case 'LATEST_DATASHEET':
          formattedPart._latestDatasheet = formatPartDetails(item.Doc);
          break;
        case 'LIFE_CYCLE':
          formattedPart._lifecycle = formatPartDetails(item.Lifecycle);
          break;
        case 'NSN':
          formattedPart._nsn = formatPartDetails(item.Nsn);
          break;
        case 'TRANSFERS':
          formattedPart._transfers = formatPartDetails(item.Transfers);
          break;
        default:
          break;
      }
    });
  return formattedPart;
};

const searchParts = async (filters) => {
  if (!ihsUsername || !ihsPassword) {
    return { error: true, message: 'Username or Password for IHS API not found!' };
  }

  const partDetails = [
    'ALERTS',
    'ALT',
    'ALT_COMBINED',
    'DETAILS',
    'DOC',
    'HAZMAT',
    'LATEST_DATASHEET',
    'LIFE_CYCLE',
    'NSN',
    'TRANSFERS',
  ];

  const { fetchPartDetails, limit } = filters;

  const xmlObj = {
    XMLQuery: {
      '@version': '0.1',
      Login: {
        '@user-name': ihsUsername,
        '@password': ihsPassword,
      },
      Criteria: {
        '@search-type': 'PART',
        '@limit': limit || 50,
        '@alt-type': 'FFF',
        Criterion: {
          '@id': 'test',
          Parameter: [],
        },
      },
    },
  };

  if (fetchPartDetails) {
    xmlObj.XMLQuery.Criteria['@part-details'] = partDetails.join(',');
  }

  const parametersArray = xmlObj.XMLQuery.Criteria.Criterion.Parameter;
  Object.keys(filters).filter((key) => key !== 'limit' && key !== 'fetchPartDetails').map((key) => {
    let matchType = 'EXACT';
    const text = filters[key];
    switch (key) {
      case 'object-id':
        key = 'obj-id';
        break;
      case 'part-number':
      case 'manufacturer-part-number':
        key = 'part-number';
        matchType = 'WILDCARD';
        break;
      case 'mfr-name':
        key = 'mfg';
        break;
      case 'mfr-objectid':
        key = 'mfr-obj-id';
        break;
      case 'category':
        key = 'category-name';
        break;
      default:
        break;
    }
    parametersArray.push({
      '@name': key,
      '@match-type': matchType,
      '#text': text,
    });
  });

  const xml = xmlbuilder.create(xmlObj, { encoding: 'utf-8', standalone: 'yes' }).end({ pretty: true });

  try {
    const res = await superagent
      .post(baseURL)
      .type('xml')
      .send(xml);
    const validateXML = xmlParser.validate(res.text);
    if (validateXML) {
      const response = xmlParser.parse(res.text, parserOptions);
      const parts = _.get(response, 'XMLResult.Result.Part');
      //  If no parts found, return empty array
      if (_.isEmpty(parts)) {
        return { error: true, message: 'Part not found in database' };
      }
      let formattedParts = [];
      if (Array.isArray(parts)) {
        formattedParts = parts.filter((part) => !_.isEmpty(part)).map(formatPart);
        return { data: formattedParts };
      }
      return { data: [formatPart(parts)] };
    }

    const { err } = validateXML;
    return { error: true, message: err.msg };
  } catch (err) {
    return { error: true, message: err.message };
  }
};

module.exports = {
  searchParts,
};