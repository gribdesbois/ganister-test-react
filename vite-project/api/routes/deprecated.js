// express load
const router = require('express-promise-router')();
const passport = require('passport');

require('../middlewares/passport');
const params = require('../middlewares/params');
const accesses = require('../middlewares/accesses');
const nodes = require('../middlewares/nodes');
const relationships = require('../middlewares/relationships');
const deprecated = require('../middlewares/deprecated');

const relationshipsController = require('../controllers/relationshipsController');
const deprecatedController = require('../controllers/deprecatedController');
const nodesController = require('../controllers/nodesController');

const passportJWT = passport.authenticate(['jwt', 'apikey'], { session: false });

// Check Unique Fields
router.post('/checkUniqueFields', passportJWT, deprecatedController.checkUniqueFields);

// PUT Node
router
  .route('/nodes/:nodetype/:nodeId')
  .put(
    passportJWT,
    deprecated.formatDeprecatedNodeRequest,
    params.checkNodetypes,
    nodes.getNode,
    accesses.getUserAccess,
    nodes.checkReleasedState,
    params.removeGeneratedProperties,
    nodesController.updateNode,
  );

// Nodetype Action
router.post(
  '/nodes/:nodetype/action/:actionId',
  passportJWT,
  params.checkNodetypes,
  accesses.getUserAccess,
  nodesController.runAction,
);

// Lock Node
router.post(
  '/nodes/:nodetype/:nodeId/lock',
  passportJWT,
  deprecated.formatDeprecatedNodeRequest,
  params.checkNodetypes,
  nodes.getNode,
  accesses.getUserAccess,
  nodes.checkLockState,
  nodesController.updateNode,
);

// Unlock Node
router.post(
  '/nodes/:nodetype/:nodeId/unlock',
  passportJWT,
  deprecated.formatDeprecatedNodeRequest,
  params.checkNodetypes,
  nodes.getNode,
  accesses.getUserAccess,
  nodes.checkLockState,
  nodesController.updateNode,
);

// Get Node's LockState
router.get(
  '/nodes/:nodetype/:nodeId/lockstate',
  passportJWT,
  params.checkNodetypes,
  deprecatedController.getLockState,
);


// Promote Node
router.post(
  '/nodes/:nodetype/:nodeId/promote/:actualStateId/:targetStateId',
  passportJWT,
  deprecated.formatDeprecatedNodeRequest,
  params.checkNodetypes,
  nodes.getNode,
  accesses.getUserAccess,
  nodesController.promoteNode,
);

// SerializeNode
router.post(
  '/nodes/:nodetype/:nodeId/serializeNode',
  passportJWT,
  params.checkNodetypes,
  nodes.getNode,
  deprecated.formatDeprecatedNodeRequest,
  accesses.getUserAccess,
  nodesController.updateNode,
);

// Node Action
router.post(
  '/nodes/:nodetype/:nodeId/action/:actionId',
  passportJWT,
  params.checkNodetypes,
  nodes.getNode,
  accesses.getUserAccess,
  nodesController.runAction,
);

// Add Relationship
router.post(
  '/nodes/:nodetype/:nodeId/relationship/:relationshipName/:targetNodeType/:targetnodeId',
  passportJWT,
  deprecated.formatDeprecatedRelationshipRequest,
  params.checkNodetypes,
  nodes.getNode,
  accesses.getUserAccess, // need to handle target nodetype access
  relationships.checkSourceLockState,
  relationships.checkExistingRelationship,
  relationshipsController.addRelationship,
);

// Get Relationships
router.get(
  '/nodes/:nodetype/:nodeId/relationship/:reltypeId',
  passportJWT,
  deprecated.formatDeprecatedRelationshipRequest,
  params.checkNodetypes,
  nodes.getNode,
  accesses.getUserAccess, // need to handle target nodetype access
  relationshipsController.getRelationships,
);

// Delete a Relationship between two nodes with the relationship _id
router.route('/nodes/:nodetype/:nodeId/relationship/:relationshipName/:relationshipId')
  .patch(
    passportJWT,
    deprecated.formatDeprecatedRelationshipRequest,
    params.checkNodetypes,
    nodes.getNode,
    accesses.getUserAccess,
    relationships.getRelationship,
    relationships.checkSourceLockState,
    relationshipsController.updateRelationship,
  )
  .delete(
    passportJWT,
    deprecated.formatDeprecatedRelationshipRequest,
    params.checkNodetypes,
    nodes.getNode,
    accesses.getUserAccess, // need to handle target nodetype access
    relationships.getRelationship,
    relationships.checkSourceLockState,
    relationshipsController.deleteRelationship,
  );

// Add Relationships
router.post('/nodes/:nodetype/relationships/:relationshipName', passportJWT, deprecatedController.addRelationships);

// This routes are replaced in relationshipsRoutes
// Get Node's Access Roles
router.get(
  '/nodes/:nodetype/:nodeId/nodeAccessRoles',
  passportJWT,
  relationships.setRelationshipName,
  params.checkNodetypes,
  nodes.getNode,
  accesses.getUserAccess,
  relationshipsController.getRelationships,
);

router.route('/nodes/:nodetype/:nodeId/nodeAccessRole/:rolename/:identity')
  .post(
    passportJWT,
    relationships.setRelationshipName,
    deprecated.formatDeprecatedRelationshipRequest,
    params.checkNodetypes,
    accesses.getUserAccess,
    relationships.checkExistingRelationship,
    relationshipsController.addRelationship,
  )
  .put(
    passportJWT,
    relationships.setRelationshipName,
    deprecated.formatDeprecatedRelationshipRequest,
    params.checkNodetypes,
    accesses.getUserAccess,
    relationships.getRelationship,
    relationships.checkMinimumAccess,
    relationshipsController.updateRelationship,
  )
  .delete(
    passportJWT,
    relationships.setRelationshipName,
    deprecated.formatDeprecatedRelationshipRequest,
    params.checkNodetypes,
    accesses.getUserAccess,
    relationships.getRelationship,
    relationships.checkMinimumAccess,
    relationshipsController.deleteRelationship,
  );

// Set Node Lifecycle Role
router.route('/nodes/:nodetype/:nodeId/nodeLifecycleRole/:rolename/:identity')
  .post(
    passportJWT,
    relationships.setRelationshipName,
    deprecated.formatDeprecatedRelationshipRequest,
    params.checkNodetypes,
    accesses.getUserAccess,
    relationships.checkExistingRelationship,
    deprecated.deleteFormerLifecycleRole,
    relationshipsController.addRelationship,
  )

  .delete(
    passportJWT,
    relationships.setRelationshipName,
    deprecated.formatDeprecatedRelationshipRequest,
    params.checkNodetypes,
    accesses.getUserAccess,
    relationships.getRelationship,
    relationshipsController.deleteRelationship,
  );

// Get All Visible Relationships
router.get(
  '/nodes/:nodetype/:nodeId/allRelationships',
  passportJWT,
  params.checkNodetypes,
  nodes.getNode,
  accesses.getUserAccess,
  relationshipsController.getAllRelationships,
);

// Get Reverse Related Nodes
router.post(
  '/:nodetype/:nodeId/getReverseRelatedNodes',
  passportJWT,
  params.checkNodetypes,
  nodes.getNode,
  accesses.getUserAccess,
  deprecated.formatDeprecatedRelationshipRequest,
  relationshipsController.getRelationships,
);

// Attach And Detach organic permissions
router.route('/nodes/:nodetype/:nodeId/OrganicPermissions')
  .post(
    passportJWT,
    relationships.setRelationshipName,
    params.checkNodetypes,
    nodes.getNode,
    accesses.getUserAccess,
    relationships.checkExistingRelationship,
    relationshipsController.addRelationship,
  )
  .delete(
    passportJWT,
    relationships.setRelationshipName,
    params.checkNodetypes,
    nodes.getNode,
    accesses.getUserAccess,
    relationships.getRelationship,
    relationships.checkMinimumAccess,
    relationshipsController.deleteRelationship,
  );

router.get(
  '/nodes/:nodetype/:nodeId/permissions',
  passportJWT,
  relationships.setRelationshipName,
  params.checkNodetypes,
  nodes.getNode,
  accesses.getUserAccess,
  relationshipsController.getRelationships,
);

// Check if user is Lifecycle Owner of a node
router.get(
  '/nodes/:nodetype/:nodeId/isLifecycleStateOwner',
  passportJWT,
  params.checkNodetypes,
  nodes.getNode,
  accesses.getUserAccess,
  deprecatedController.getIsLifecycleStateOwner,
);

// Get Node's Multilevel
router.post(
  '/nodes/:nodetype/:nodeId/recursive',
  passportJWT,
  params.checkNodetypes,
  accesses.getUserAccess,
  nodesController.getNode,
  relationshipsController.getRelationships,
);

//  INCOMPLETE
router.get('/nodes/:nodetype/:nodeId/lifecycle/isProcessOwner', passportJWT);

router.get('/nodes/:nodetype/:nodeId/comments', passportJWT);

router.post('/nodes/:nodetype/:nodeId/comments', passportJWT);

router.put('/nodes/:nodetype/:nodeId/comments/:commentId', passportJWT);

router.delete('/nodes/:nodetype/:nodeId/comments/:commentId', passportJWT);

router.post('/nodes/:nodetype/:nodeId/MRO/instanciate', passportJWT);

router.post('/nodes/:nodetype/:nodeId/versions', passportJWT);

module.exports = router;
