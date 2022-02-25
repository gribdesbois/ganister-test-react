const element14 = require('../../middlewares/external-apis/element14');

module.exports = {
  searchTerm: async (req, res) => {
    await element14.searchTerm(req.body)
      .then((data) => {
        if (data.error) return res.status(500).send(data);
        return res.status(200).send(data);
      })
      .catch((error) => {
        return res.status(500).send(error.message);
      });
  },
};