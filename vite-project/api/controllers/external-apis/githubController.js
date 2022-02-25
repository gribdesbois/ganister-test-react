const github = require('../../middlewares/external-apis/github');

module.exports = {
  getIssues: async (req, res) => {
    await github.getIssues()
      .then((data) => {
        if (data.error) return res.status(500).send(data);
        return res.status(200).send(data);
      })
      .catch((error) => {
        return res.status(500).send(error.message);
      });
  },
  issuesListForRepo: async (req, res) => {
    const { owner, repo, options } = req.body;
    await github.issuesListForRepo(owner, repo, options)
      .then((data) => {
        if (data.error) return res.status(500).send(data);
        return res.status(200).send(data);
      })
      .catch((error) => {
        return res.status(500).send(error.message);
      });
  },
  listCommits: async (req, res) => {
    const { owner, repo } = req.body;
    await github.listCommits(owner, repo)
      .then((data) => {
        if (data.error) return res.status(500).send(data);
        return res.status(200).send(data);
      })
      .catch((error) => {
        return res.status(500).send(error.message);
      });
  },
};