const fs = require('fs-extra');

const configFilePath = './api/models/dm/uxConfig.json';

const uxConfig = fs.readFileSync(configFilePath);
const revisionsLabels = JSON.parse(uxConfig).versioningLabels || [];

const revisionsLabelsConstants = {
  FORK: {
    name: 'fork',
    value: 'fork',
  },
  SUPFORK: {
    name: 'supFork',
    value: 'supFork',
  },
  PATCH: {
    name: 'patch',
    value: 'patch',
  },
  MINOR: {
    name: 'minor',
    value: 'minor',
  },
  MAJOR: {
    name: 'major',
    value: 'major',
  },
};
if (revisionsLabels) {
  Object.entries(revisionsLabelsConstants).forEach(([key, value]) => {
    const revisionsLabel = revisionsLabels.find((l) => l.value === value.value);
    revisionsLabelsConstants[key] = revisionsLabel;
  });
}

module.exports = {
  ...revisionsLabelsConstants,
  INTERCHANGEABLE: 'interchangeable',
  NONINTERCHANGEABLE: 'nonInterchangeable',
};
