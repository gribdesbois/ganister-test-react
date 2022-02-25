const ihs = require('../../middlewares/external-apis/ihs');

module.exports = {
  searchParts: async (req, res) => {
    await ihs.searchParts(req.body)
      .then((data) => {
        if (data.error) return res.status(500).send(data);
        return res.status(200).send(data);
      })
      .catch((error) => {
        return res.status(500).send(error.message);
      });
  },
};