const plmStandards = require('../middlewares/plmStandardsCypher');


module.exports = {
  // DEPRECATED SINCE 2.0.0
  checkUniqueFields: async (req, res, next) => {
    const { nodetypeName, nodeId, fields } = req.body;

    try {
      const result = await plmStandards.checkUniqueFields(nodetypeName, nodeId, fields);
      const { data, code } = result;

      return res.status(code).send(data);
    } catch (error) {
      error.title = 'Cannot Check Unique Fields';
      next(error);
    }
  },

  // DEPRECATED SINCE 2.0.0
  addRelationships: async (req, res, next) => {
    const { user } = req;
    const { nodetype, targetNodeType, relname } = req.params;
    const { relationships } = req.body;

    try {
      const result = await plmStandards.addRelationships(user, nodetype, targetNodeType, relname, relationships);
      const { data, code } = result;

      return res.status(code).send(data);
    } catch (error) {
      error.title = 'Cannot Add Relationships';
      next(error);
    }
  },

  // DEPRECATED SINCE 2.0.0
  getIsLifecycleStateOwner: async (req, res, next) => {
    const { nodetype, nodeId } = req.params;
    const { user } = req;

    try {
      const result = await plmStandards.checkLifecycleStateOwner(user._id, nodetype, nodeId);
      const { data, code } = result;

      return res.status(code).send(data);
    } catch (error) {
      error.title = 'Cannot Get Lifecycle State Owner';
      next(error);
    }
  },

  getLockState: async (req, res, next) => {
    const { nodetype, nodeId } = req.params;

    await plmStandards.getNodeLockState(nodetype, nodeId)
      .then(({ data, code }) => {
        return res.status(code).send(data);
      })
      .catch((error) => {
        error.title = 'Cannot Get Node Lock State';
        next(error);
      });
  },
};
