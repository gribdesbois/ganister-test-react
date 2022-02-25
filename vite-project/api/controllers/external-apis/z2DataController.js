const z2Data = require('../../middlewares/external-apis/z2Data');

module.exports = {
  searchParts: async (req, res) => {
    await z2Data.searchParts(req.body)
      .then((data) => {
        if (data.error) return res.status(500).send(data);
        return res.status(200).send(data);
      })
      .catch((error) => {
        return res.status(500).send(error.message);
      });
  },
  getPartDetail: async (req, res) => {
    await z2Data.getPartDetail(req.body)
      .then((data) => {
        if (data.error) return res.status(500).send(data);
        return res.status(200).send(data);
      })
      .catch((error) => {
        return res.status(500).send(error.message);
      });
  },
};