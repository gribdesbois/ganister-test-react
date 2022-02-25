require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const NODEU = require('uuid');
const fs = require('fs');
const _ = require('lodash');
const ora = require('ora');

const app = require('../');
const config = require('../config/config');

const { mockNodetype } = require('../spec/helpers');

chai.use(chaiHttp);
const driver = config.db;
const { expect } = chai;

//  Read Datamodel
const data = fs.readFileSync('./build/datamodel.json', 'utf8');
const datamodel = JSON.parse(data);

// Paths declarations
const DMPath = 'api/models/dm/';

//  Find Permission Sets from Datamodel
let partDM = datamodel.nodetypeDefinitions.find((n) => n.name === 'part');
const documentDM = datamodel.nodetypeDefinitions.find((n) => n.name === 'document');
const fileDM = datamodel.nodetypeDefinitions.find((n) => n.name === 'file');
const fieldedPartDM = datamodel.nodetypeDefinitions.find((n) => n.name === 'fieldedPart');
const ecoDM = datamodel.nodetypeDefinitions.find((n) => n.name === 'eco');

//  Find Relationships
const fieldPartBOMRel = datamodel.nodetypeDefinitions.find((n) => {
  if (!n.directions) return;
  return n.directions.find((d) => d.source === fieldedPartDM.id && d.target === fieldedPartDM.id)
})
const partDocumentRel = datamodel.nodetypeDefinitions.find((n) => {
  if (!n.directions) return;
  return n.directions.find((d) => d.source === partDM.id && d.target === documentDM.id)
})
const documentFileRel = datamodel.nodetypeDefinitions.find((n) => {
  if (!n.directions) return;
  return n.directions.find((d) => d.source === documentDM.id && d.target === fileDM.id)
})

//  Find part Lifecycle states Ids
const partStartState = partDM.lifecycle.states.find((s) => s.start);
const partReleasedState = partDM.lifecycle.states.find((s) => s.released);
const partIntermediateState = partDM.lifecycle.states.find((s) => {
  const afterStartState = partDM.lifecycle.transitions.find((t) => t.from === partStartState.id && t.to === s.id);
  const beforeReleasedState = partDM.lifecycle.transitions.find((t) => t.from === s.id && t.to === partReleasedState.id);
  return afterStartState && beforeReleasedState;
});


//  Find eco Lifecycle States Ids
const ecoDraftState = ecoDM.lifecycle.states.find((n) => n.name === 'draft');
const ecoReviewingRequestState = ecoDM.lifecycle.states.find((n) => n.name === 'reviewingRequest');
const ecoInWorkState = ecoDM.lifecycle.states.find((n) => n.name === 'inWork');

//  Temporary Store created nodes and rels ids
let createdPart;
let createdDocument;
let createdCadDocument;
let createdFile;
let file;
let createdDocumentFileRel;
let createdEco;
let createdFieldedPart;
let createdFieldedPart2;
let createdFieldedPart3;
let revisedPart;
const revisedParts = {};
let testNodetype;
let propertyId;
let columnId;
let lifecycleRoleId;
let lifecycleStateId;
let lifecycleStateId2;
let lifecycleTransitionId;
let methodId;
let methodName;
let method2Id;
let method2Name;
let lovObj;
let packageId;
let group;
let adminGroupId;
let accessNode;
let error;
let partMethod;
let partAction;
let partTab;

const properties = [
  { name: "name", type: "string" },
  { name: "description", type: "richText" },
];

const gridColumns = [
  { name: "_id", type: "string", property: "testNodetype2._id" },
  { name: "_ref", type: "string", property: "testNodetype2._ref" },
  { name: "_version", type: "version", property: "testNodetype2._version", cellRendered: true },
  { name: "name", type: "string", property: "testNodetype2.name" },
  { name: "description", type: "text", property: "testNodetype2.description" },
];

//  Generate required properties
const partFields = {
  mandatoryFields: mockNodetype('part').properties,
  lock: true,
};
const documentFields = {
  mandatoryFields: mockNodetype('document').properties,
};
const cadDocumentFields = {
  mandatoryFields: mockNodetype('cadDocument').properties,
};
const fileFields = {
  mandatoryFields: mockNodetype('file').properties,
};
const ecoFields = {
  mandatoryFields: mockNodetype('eco').properties,
  lock: true,
};
const fieldedPartFields = {
  mandatoryFields: mockNodetype('fieldedPart').properties,
  lock: true,
};

const user1 = {
  _id: NODEU.v1(),
  email: "test1@ganister.eu",
  token: undefined,
};

const user2 = {
  _id: NODEU.v1(),
  email: 'test2@ganister.eu',
  token: undefined,
};

const user3 = {
  _id: NODEU.v1(),
  email: 'test3@ganister.eu',
  token: undefined,
}

describe('api.test.js', () => {
//  Start Testing
  before(async () => {
    const session = driver.session();
    const txc = session.beginTransaction();

    const spinner = ora('Start creating admin user').start();

    const result = await txc.run(`
    MATCH (adminGroup:Group { name: "Administrator" }), (p:PermissionSet { name:  'user' })
    CREATE (u:user{
      firstName: "FirstName 1",
      lastName : "LastName 1",
      password : "3dc3f2949d90fbb803a99177a338b53f",
      _isAdmin : true,
      active : true,
      language : "en",
      _id: "${user1._id}",
      _createdOn: ${Date.now()},
      pict: "images/userLogo.png",
      _lockState: false,
      email: "${user1.email}"
    }),
    (u2:user{
      firstName: "FirstName 2",
      lastName : "LastName 2",
      password : "3dc3f2949d90fbb803a99177a338b53f",
      _isAdmin : false,
      active : true,
      language : "en",
      _id: "${user2._id}",
      _createdOn: ${Date.now()},
      pict: "images/userLogo.png",
      _lockState: false,
      email: "${user2.email}"
    }),
    (u3:user{
      firstName: "FirstName 3",
      lastName : "LastName 3",
      password : "3dc3f2949d90fbb803a99177a338b53f",
      _isAdmin : true,
      active : true,
      language : "en",
      _id: "${user3._id}",
      _createdOn: ${Date.now()},
      pict: "images/userLogo.png",
      _lockState: false,
      email: "${user3.email}"
    }),
    (u)-[:isMemberOf {_id: "${NODEU.v1()}"}]->(adminGroup),
    (p)-[:accessRole { _id: "${NODEU.v1()}", role: 'permissionSet' }]->(u),
    (p)-[:accessRole { _id: "${NODEU.v1()}", role: 'permissionSet' }]->(u2)
    RETURN adminGroup._id as adminGroupId
    `);

    const [record] = result.records;
    adminGroupId = record.get('adminGroupId');

    spinner.succeed('Start creating admin user');

    await txc.commit();
  });

  context('Server', () => {
    it('Testing server running', (done) => {
      chai
        .request(app)
        .get('/')
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });
  });

  context('Users Routes', () => {
    it('POST /users/signin (User Signin: Log in with a non existant user)', (done) => {
      chai
        .request(app)
        .post('/api/v0/users/signin')
        .send({ email: 'wronguser@ganister.eu', password: 'wrongpassword' })
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
      });
  });

  it('POST /users/signin (User Signin: Log in as an admin user with wrong password)', done => {
    chai
      .request(app)
      .post('/api/v0/users/signin')
        .send({ email: 'test@ganister.eu', password: 'xganisterx' })
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
      });
  });

  it('POST /users/signin (User Signin: Log in as an admin user)', done => {
    chai
      .request(app)
      .post('/api/v0/users/signin')
        .send({ email: 'test1@ganister.eu', password: 'ganister' })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body)
            .to.be.an.instanceof(Object)
            .and.to.have.property('_id');
          expect(res.body.properties)
            .to.be.an.instanceof(Object)
            .and.to.have.property('token');
          user1.token = res.body.properties.token;
          done();
      });
  });

  it('POST /users/signin (User Signin: Log in as the second user)', done => {
    chai
      .request(app)
      .post('/api/v0/users/signin')
        .send({ email: 'test2@ganister.eu', password: 'ganister' })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body)
            .to.be.an.instanceof(Object)
            .and.to.have.property('_id');
          expect(res.body.properties)
            .to.be.an.instanceof(Object)
            .and.to.have.property('token');
          user2.token = res.body.properties.token;
          done();
      });
  });

  it('GET /users (Get Users)', done => {
    chai
      .request(app)
      .get('/api/v0/users')
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('GET /users/test (Test if user is logged in)', done => {
    chai
      .request(app)
      .get('/api/v0/users/test')
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('GET /users/{id} (Get User (empty answer, 200 even if ID is false)', done => {
    chai
      .request(app)
      .get(`/api/v0/users/${user1._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('PUT /users/{id} (Update Whole User)', done => {
    chai
      .request(app)
      .put(`/api/v0/users/${user2._id}`)
      .send({ firstName: "Updated FirstName", lastName: "updated LastName" })
      .set('Authorization', user1.token)
      .end((err, res) => {
        expect(res).to.have.status(200);
          done();
      });
  });

  it('PATCH /users/{id} (Update User Property)', done => {
    chai
      .request(app)
      .patch(`/api/v0/users/${user2._id}`)
        .send({ property: 'firstName', value: 'New Updated FirstName' })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('DELETE /users/{id} (Delete User)', done => {
    chai
      .request(app)
      .delete(`/api/v0/users/${user3._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
  });

  //  TODO: Check why is failing
  it('/users/signup (Sign up a new user)', done => {
    chai
      .request(app)
      .post('/api/v0/users/signup')
      .send({ email: 'test4@ganister.eu', firstName: "First Name", lastName: "Last Name" })
      .set('Authorization', user1.token)
      .end((err, res) => {
        expect(res).to.have.status(200);
          done();
        });
    });
  });

  context('Datamodel', () => {
    it('GET /nodetypes/datamodel (Get Datamodel)', (done) => {
      chai
        .request(app)
        .get('/api/v0/nodetypes/datamodel')
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('GET /nodetypes/datamodel/dmPackages (Get dm Packages)', done => {
    chai
      .request(app)
      .get('/api/v0/nodetypes/datamodel/dmPackages')
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
  });



  //  TODO: POST /nodetypes/datamodel/patch
  it('POST /nodetypes/datamodel/generateGanisterDM (Generate Ganister DM)', done => {
    chai
      .request(app)
      .post('/api/v0/nodetypes/datamodel/generateGanisterDM')
      .send({ packages: ['cmii', 'core', 'mpp', 'mro', 'pe', 'pm', 'purchasing', 'syseng'] })
      .set('Authorization', user1.token)
      .end((err, res) => {
        expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodetypes/{nodetype} (Create a Nodetype)', done => {
    chai
      .request(app)
      .post('/api/v0/nodetypes/testNodetype2')
      .send({ typeDefinition: { package: "pe", elementType: "node" } })
      .set('Authorization', user1.token)
      .end((err, res) => {
        expect(res).to.have.status(200);
          testNodetype = res.body.nodetype;
          const createdFile = fs.existsSync(`${DMPath}nodetypes/${testNodetype.name}.json`);
          expect(createdFile).to.equal(true);
          done();
      });
  });

  it('POST /nodetypes/{nodetype} (Try creating a duplicate nodetype)', done => {
    chai
      .request(app)
      .post('/api/v0/nodetypes/testNodetype2')
      .send({ typeDefinition: { package: "pe", elementType: "node" } })
      .set('Authorization', user1.token)
      .end((err, res) => {
        expect(res).to.have.status(403);
          done();
      });
  });

  it('PATCH /nodetypes/{nodetype} (Patch Nodetype Meta Data)', done => {
    chai
      .request(app)
      .patch(`/api/v0/nodetypes/${testNodetype.id}`)
        .send({ property: 'versionnable', value: true })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodetypes/{nodetype}/properties (Add Nodetype Property)', done => {
    chai
      .request(app)
      .post('/api/v0/nodetypes/testNodetype2/properties')
        .send({ property: properties[0] })
        .set('Authorization', user1.token)
        .end((err, res) => {
          propertyId = res.body.newItem.id;
          expect(res).to.have.status(200);
          done();
      });
  });

  it('PUT /nodetypes/{nodetype}/properties/{id} (Update Nodetype Property)', done => {
    chai
      .request(app)
      .put(`/api/v0/nodetypes/testNodetype2/properties/${propertyId}`)
        .send({ property: { attribute: 'name', newValue: 'hello world' } })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodetypes/{nodetype}/columns/{gridName} (Add a new UI column for a nodetype)', done => {
    chai
      .request(app)
      .post('/api/v0/nodetypes/testNodetype2/columns/gridColumns')
        .send({ gridColumn: gridColumns[0] })
        .set('Authorization', user1.token)
        .end((err, res) => {
          columnId = res.body.newItem.id;
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodetypes/{nodetype}/columns/{gridName} (Add a new UI column for a nodetype)', done => {
    chai
      .request(app)
      .post('/api/v0/nodetypes/testNodetype2/columns/gridColumns')
        .send({ gridColumn: gridColumns[1] })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodetypes/{nodetype}/columns/{gridName} (Add a new UI column for a nodetype)', done => {
    chai
      .request(app)
      .post('/api/v0/nodetypes/testNodetype2/columns/gridColumns')
        .send({ gridColumn: gridColumns[2] })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('PATCH /nodetypes/{nodetype}/columns/{gridName}/move (Move a UI columns for a specific nodetype)', done => {
    chai
      .request(app)
      .patch('/api/v0/nodetypes/testNodetype2/columns/gridColumns/move')
        .send({ columnIndex: 0, direction: 'down' })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('PATCH /nodetypes/{nodetype}/columns/{gridName}/move (Move a UI columns for a specific nodetype)', done => {
    chai
      .request(app)
      .patch('/api/v0/nodetypes/testNodetype2/columns/gridColumns/move')
        .send({ columnIndex: 0, direction: 'up' })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('PATCH /nodetypes/{nodetype}/columns/{gridName}/{id} (Update UI Column for a specific nodetype)', done => {
    chai
      .request(app)
      .patch(`/api/v0/nodetypes/testNodetype2/columns/gridColumns/${columnId}`)
        .send({ gridColumn: { attribute: 'width', newValue: 100 } })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('DELETE /nodetypes/{nodetype}/columns/{gridName}/{columnId} (Delete Nodetype UI Column)', done => {
    chai
      .request(app)
      .delete(`/api/v0/nodetypes/testNodetype2/columns/gridColumns/${columnId}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('DELETE /nodetypes/{nodetype}/properties/{id} (Delete Nodetype Property)', done => {
    chai
      .request(app)
      .delete(`/api/v0/nodetypes/testNodetype2/properties/${propertyId}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodetypes/{nodetype}/methods (Add Nodetype Method)', done => {
    chai
      .request(app)
      .post('/api/v0/nodetypes/part/methods')
      .send({
        method: {
          method: "Name",
          description: 'Simple Method',
        }
      })
      .set('Authorization', user1.token)
      .end((err, res) => {
          partMethod = res.body.newItem;
          expect(res).to.have.status(200);
          done();
      });
  });

  it('PUT /nodetypes/part/methods/{id} (Update Nodetype Method)', done => {
    chai
      .request(app)
      .put(`/api/v0/nodetypes/part/methods/${partMethod.id}`)
      .send({
        method: {
          attribute: "trigger",
          newValue: "afterCreation",
          oldValue: ""
        }
      })
      .set('Authorization', user1.token)
      .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('DELETE /nodetypes/part/methods/{id} (Delete Nodetype Method)', done => {
    chai
      .request(app)
      .delete(`/api/v0/nodetypes/part/methods/${partMethod.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodetypes/{nodetype}/methods (Add a Second Nodetype Method)', done => {
    chai
      .request(app)
      .post('/api/v0/nodetypes/part/methods')
      .send({
        method: {
          method: "customMethodUpdated",
          description: 'Simple Method2',
          trigger: "afterUpdate",
          params: {
            test: 'Hello, world!'
          }
        }
      })
      .set('Authorization', user1.token)
      .end((err, res) => {
          partMethod2 = res.body.newItem;
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodetypes/{nodetype}/actions (Add Nodetype Action)', done => {
    chai
      .request(app)
      .post('/api/v0/nodetypes/part/actions')
      .send({ action: { name: "action" } })
      .set('Authorization', user1.token)
      .end((err, res) => {
        partAction = _.get(res.body, 'newItem');
          expect(res).to.have.status(200);
          done();
      });
  });

  it('PUT /nodetypes/{nodetype}/actions/{id} (Update Nodetype Action)', done => {
    chai
      .request(app)
      .put(`/api/v0/nodetypes/part/actions/${partAction.id}`)
      .send({
        action: {
          attribute: "serverMethod",
          value: {
            name: "methodName"
          }
        }
      })
      .set('Authorization', user1.token)
      .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('DELETE /nodetypes/{nodetype}/actions/{id} (Delete Nodetype Action)', done => {
    chai
      .request(app)
      .delete(`/api/v0/nodetypes/part/actions/${partAction.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodetypes/{nodetype}/tabs (Add Nodetype Tab)', done => {
    chai
      .request(app)
      .post('/api/v0/nodetypes/part/tabs')
      .send({
        tab: {
          label: "newtab",
          name: "newtab",
          tabContentType: "relatedObject",
        }
      })
      .set('Authorization', user1.token)
      .end((err, res) => {
          partTab = _.get(res.body, 'tab');
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodetypes/{nodetype}/tabs (Add second Nodetype Tab)', done => {
    chai
      .request(app)
      .post('/api/v0/nodetypes/part/tabs')
      .send({
        tab: {
          label: "secondtab",
          name: "secondtab",
          tabContentType: "relatedObject",
        }
      })
      .set('Authorization', user1.token)
      .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('PATCH /nodetypes/{nodetype}/tabs/move (Move Nodetype Tab)', done => {
    chai
      .request(app)
      .patch('/api/v0/nodetypes/part/tabs/move')
        .send({ tabIndex: 0, direction: 'down' })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('PUT /nodetypes/{nodetype}/tabs/{id} (Update Nodetype Tab)', done => {
    chai
      .request(app)
      .put(`/api/v0/nodetypes/part/tabs/${partTab.id}`)
      .send({
        tab: {
          attribute: "name",
          newValue: "firstTab",
        }
      })
      .set('Authorization', user1.token)
      .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('DELETE /nodetypes/{nodetype}/tabs/{id} (Delete Nodetype Tab)', done => {
    chai
      .request(app)
      .delete(`/api/v0/nodetypes/part/tabs/${partTab.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
  });




  //  TODO: PUT /nodetypes/{nodetype}/form/definition (Update Nodetype Form Definition)

  it('POST /nodetypes/{nodetype}/lifecycle​/roles (Add Nodetype Lifecycle Role)', done => {
    chai
      .request(app)
      .post('/api/v0/nodetypes/testNodetype2/lifecycle/roles')
      .send({ name: "name" })
      .set('Authorization', user1.token)
      .end((err, res) => {
        lifecycleRoleId = res.body.id;
          expect(res).to.have.status(200);
          done();
      });
  });

  it('PUT /nodetypes/{nodetype}/lifecycle​/roles/{id} (Update Nodetype Lifecycle Role)', done => {
    chai
      .request(app)
      .put(`/api/v0/nodetypes/testNodetype2/lifecycle/roles/${lifecycleRoleId}`)
      .send({ role: { attribute: 'name', newValue: "newRoleName" } })
      .set('Authorization', user1.token)
      .end((err, res) => {
        expect(res).to.have.status(200);
          done();
      });
  });

  it('DELETE /nodetypes/{nodetype}/lifecycle​/roles/{id} (Delete Nodetype Lifecycle Role)', done => {
    chai
      .request(app)
      .delete(`/api/v0/nodetypes/testNodetype2/lifecycle/roles/${lifecycleRoleId}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodetypes/{nodetype}/lifecycle​/states (Add Nodetype Lifecycle State)', done => {
    chai
      .request(app)
      .post('/api/v0/nodetypes/testNodetype2/lifecycle/states')
      .send({ state: { name: "name", label: "label" } })
      .set('Authorization', user1.token)
      .end((err, res) => {
        lifecycleStateId = res.body.id;
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodetypes/{nodetype}/lifecycle​/states (Add Nodetype Lifecycle State)', done => {
    chai
      .request(app)
      .post('/api/v0/nodetypes/testNodetype2/lifecycle/states')
      .send({ state: { name: "name2", label: "label2" } })
      .set('Authorization', user1.token)
      .end((err, res) => {
        lifecycleStateId2 = res.body.id;
          expect(res).to.have.status(200);
          done();
      });
  });

  it('PUT /nodetypes/{nodetype}/lifecycle​/states/{id} (Update Nodetype Lifecycle State)', done => {
    chai
      .request(app)
      .put(`/api/v0/nodetypes/testNodetype2/lifecycle/states/${lifecycleStateId}`)
      .send({ state: { attribute: 'name', newValue: "newStateName" } })
      .set('Authorization', user1.token)
      .end((err, res) => {
        expect(res).to.have.status(200);
          done();
      });
  });

  it('DELETE /nodetypes/{nodetype}/lifecycle​/states/{id} (Delete Nodetype Lifecycle State)', done => {
    chai
      .request(app)
      .delete(`/api/v0/nodetypes/testNodetype2/lifecycle/states/${lifecycleStateId}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodetypes/{nodetype}/lifecycle​/transitions (Add Nodetype Lifecycle Transition)', done => {
    chai
      .request(app)
      .post('/api/v0/nodetypes/testNodetype2/lifecycle/transitions')
        .send({ transition: { from: lifecycleStateId, to: lifecycleStateId2 } })
        .set('Authorization', user1.token)
        .end((err, res) => {
          lifecycleTransitionId = res.body.id;
          expect(res).to.have.status(200);
          done();
      });
  });

  it('PUT /nodetypes/{nodetype}/lifecycle​/transitions/{id} (Update Nodetype Lifecycle Transition)', done => {
    chai
      .request(app)
      .put(`/api/v0/nodetypes/testNodetype2/lifecycle/transitions/${lifecycleTransitionId}`)
      .send({ transition: { attribute: 'from', newValue: "newStateId" } })
      .set('Authorization', user1.token)
      .end((err, res) => {
        expect(res).to.have.status(200);
          done();
      });
  });

  it('DELETE /nodetypes/{nodetype}/lifecycle​/states/{id} (Delete Nodetype Lifecycle Transition)', done => {
    chai
      .request(app)
      .delete(`/api/v0/nodetypes/testNodetype2/lifecycle/transitions/${lifecycleTransitionId}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodetypes/methods (Add Method)', done => {
    chai
      .request(app)
      .post('/api/v0/nodetypes/methods')
      .send({ name: "Name" })
      .set('Authorization', user1.token)
      .end((err, res) => {
        expect(res).to.have.status(200);
          methodId = res.body.id;
          methodName = res.body.newMethod.name;
          const existingFile = fs.existsSync(`${DMPath}methods/${methodName}.js`);
          expect(existingFile).to.equal(true);
          done();
      });
  });

  it('PUT /nodetypes/methods/{id} (Update Method)', done => {
    chai
      .request(app)
      .put(`/api/v0/nodetypes/methods/${methodId}`)
      .send({ method: { package: 'core', code: 'console.log("test")', name: "CustomMethod2" } })
      .set('Authorization', user1.token)
      .end((err, res) => {
        methodName = res.body.updatedMethod.name;
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodetypes/methods (Add a second Method)', done => {
    chai
      .request(app)
      .post('/api/v0/nodetypes/methods')
      .send({ name: "Name2" })
      .set('Authorization', user1.token)
      .end((err, res) => {
        expect(res).to.have.status(200);
          method2Id = res.body.id;
          method2Name = res.body.newMethod.name;
          const existingFile = fs.existsSync(`${DMPath}methods/${method2Name}.js`);
          expect(existingFile).to.equal(true);
          done();
      });
  });

  it('PUT /nodetypes/methods/{id} (Update the second Method: use params in code)', done => {
    chai
      .request(app)
      .put(`/api/v0/nodetypes/methods/${method2Id}`)
        .send({
        method: {
          package: 'core',
          code: 'try {\n console.log(params.test);\n  data.properties.description = params.test;\n  return data;\n} catch (error) {\n throw error;\n}\n',
          name: "customMethodUpdated",
        }
      })
      .set('Authorization', user1.token)
      .end((err, res) => {
          method2Name = res.body.updatedMethod.name;
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodetypes/lovs (Add List of Values)', done => {
    chai
      .request(app)
      .post('/api/v0/nodetypes/lovs')
      .send({ name: "Name", packageId: 'core', items: [{ label: 'item', value: 'item' }] })
      .set('Authorization', user1.token)
      .end((err, res) => {
        lovObj = res.body.newLovs;
          expect(res).to.have.status(200);
          done();
      });
  });

  it('PUT /nodetypes/lovs/{id} (Update List of Values)', done => {
    chai
      .request(app)
      .put(`/api/v0/nodetypes/lovs/${lovObj.id}`)
        .send({ lov: { ...lovObj, items: [...lovObj.items, { label: 'x', value: 'z' }] } })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('DELETE /nodetypes/lovs/{id} (Delete List of Values)', done => {
    chai
      .request(app)
      .delete(`/api/v0/nodetypes/lovs/${lovObj.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodetypes/_packages (Add Package)', done => {
    chai
      .request(app)
      .post('/api/v0/nodetypes/_packages')
        .send({ packname: 'newPackage' })
        .set('Authorization', user1.token)
        .end((err, res) => {
          packageId = res.body.package.id;
          expect(res).to.have.status(200);
          done();
      });
  });

  it('DELETE /nodetypes/_packages/{id} (Delete Package)', done => {
    chai
      .request(app)
      .delete(`/api/v0/nodetypes/_packages/${packageId}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('PUT /nodetypes/:nodetype/updateobject (Update Nodetype Element)', done => {
    chai
      .request(app)
      .put('/api/v0/nodetypes/testNodetype2/updateobject')
        .send({ oPath: 'versionnable', oContent: false })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('PUT /nodetypes/:nodetype/form/definition (Update Nodetyper Form Definition)', done => {
    chai
      .request(app)
      .put('/api/v0/nodetypes/part/form/definition')
        .send({ definition: {}, labelCase: 'capitalize' })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('GET /nodetypes/:nodetype/form/infodataform (Get InfoData Form Definition)', done => {
    chai
      .request(app)
      .get('/api/v0/nodetypes/part/form/infodataform')
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodetypes/:nodetype/instanciations (Add Nodetype instanciations)', done => {
    const instanciation = {
      name: 'instanciationName',
      sourceBOM: 'nt_4d556eaa2a76d6d1a48576ad0f00cf3a',
        targetRel: 'nt_78bf4fb0-3b69-11ea-b4a2-a7d01ab59409',
        targetBOM: 'nt_816a176e608dba4053a3601f5e92c545',
      };

      chai
        .request(app)
        .post('/api/v0/nodetypes/part/instanciations')
        .send({ instanciation })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });
})

  context('App Config', () => {
    it('Attemp retrieving the App Config without credentials', (done) => {
      chai
        .request(app)
        .get('/api/v0/config/settings')
        .end((err, res) => {
          expect(res).to.have.status(401);
        done();
      });
  });
  it('Retrieve the App Config', done => {
    chai
      .request(app)
      .get('/api/v0/config/settings')
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
        done();
      });
  });
  it('Retrieve the App UX Config', done => {
    chai
      .request(app)
      .get('/api/v0/config/ux')
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
        done();
      });
  });
  it('Update one App UX Config Setting', done => {
    chai
      .request(app)
      .put('/api/v0/config/ux/logo')
        .set('Authorization', user1.token)
        .send({ value: 'corporate.png' })
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });
  });

  context('Translations', () => {
    it('GET /translations/languages (Get Languages)', (done) => {
      chai
        .request(app)
        .get('/api/v0/translations/languages')
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /translations/add/{lang} (Add Language)', done => {
    chai
      .request(app)
      .post('/api/v0/translations/add/aa')
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /translations/updateConfig (Add or remove a language)', done => {
    chai
      .request(app)
      .post('/api/v0/translations/updateConfig')
      .send({ data: { language: { name: "Deutsche2", key: "aa", fallbackLanguage: false, preferredLanguage: false, active: true }, remove: false } })
      .set('Authorization', user1.token)
      .end((err, res) => {
        expect(res).to.have.status(200);
          done();
      });
  });

  it('PUT /translations/{lang} (Update Language - Updates properties in the language file)', done => {
    chai
      .request(app)
      .put('/api/v0/translations/en')
        .send({ data: [{ path: 'nodetype.testNodetype2._ref', value: 'Test Nodetype Ref' }] })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /translations/removeProps (Remove properties from all translation files)', done => {
    chai
      .request(app)
      .post('/api/v0/translations/removeProps')
        .send({ data: ['nodetype.testNodetype2._ref'] })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /translations/{lang} (Update Whole Language)', done => {
    chai
      .request(app)
      .post('/api/v0/translations/en')
        .send({ data: { value: {} } })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });
  });

  context('Health Report', () => {
  it('POST /nodetypesRegenerateUIForms (Regenerate Nodetype Forms)', done => {
    chai
      .request(app)
      .post('/api/v0/healthReport/nodetypesRegenerateUIForms')
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });

  it('POST /nodetypesMissingTranslation (Fix Nodetypes Missing Translation - Check for missing translation for each nodetype)', done => {
    chai
      .request(app)
      .post('/api/v0/healthReport/nodetypesMissingTranslation')
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodesBooleanPropertiesAsString (Fix Boolean Properties stored as String - Check for several boolean properties that are stored as String)', done => {
    chai
      .request(app)
      .post('/api/v0/healthReport/nodesBooleanPropertiesAsString')
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodesMissingLockedByName (Fix Nodes Missing LockedByName - Check for missing _lockedByName property in each node)', done => {
    chai
      .request(app)
      .post('/api/v0/healthReport/nodesMissingLockedByName')
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodetypeFixMissingCoreItems (Fix Nodetypes Missing Core Items - Check for missing nodetype core items)', done => {
    chai
      .request(app)
      .post('/api/v0/healthReport/nodetypeFixMissingCoreItems')
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('GET /ressources (Get Resources State)', done => {
    chai
      .request(app)
      .get('/api/v0/healthReport/ressources')
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
  });

  //  TODO: POST /mapLifecycleState/:nodetype/:fromState/:toState (Maps Lifecycle State)

});


  context('ECO advanced testing', () => {


  //#region BUILD BOM
  const ECOTESTPARTS = {};
  // create 7 a part 
  it('POST Create PART A', done => {
    const { mandatoryFields } = partFields;

    chai
      .request(app)
      .post('/api/v0/nodes/part')
      .send({
        mandatoryFields,
        lock: true,
      })
      .set('Authorization', user1.token)
      .end((err, res) => {
        ECOTESTPARTS['A'] = res.body.data;
        expect(res).to.have.status(200);
        expect(res.body.data)
          .to.be.instanceOf(Object)
            .and.to.have.property('_id');
          expect(res.body.data.properties)
            .to.be.instanceOf(Object);
          expect(res.body.data.properties._ref)
            .to.be.equal(mandatoryFields._ref);
          expect(res.body.data.properties._lockState)
            .to.be.equal(true);
        done();
      });
  });
  it('POST Create PART B', done => {
    const { mandatoryFields } = partFields;

    chai
      .request(app)
      .post('/api/v0/nodes/part')
      .send({
        mandatoryFields,
        lock: true,
      })
      .set('Authorization', user1.token)
      .end((err, res) => {
        ECOTESTPARTS['B'] = res.body.data;
        expect(res).to.have.status(200);
        expect(res.body.data)
          .to.be.instanceOf(Object)
            .and.to.have.property('_id');
          expect(res.body.data.properties)
            .to.be.instanceOf(Object);
          expect(res.body.data.properties._ref)
            .to.be.equal(mandatoryFields._ref);
          expect(res.body.data.properties._lockState)
            .to.be.equal(true);
        done();
      });
  });
  it('POST Create PART C', done => {
    const { mandatoryFields } = partFields;

    chai
      .request(app)
      .post('/api/v0/nodes/part')
      .send({
        mandatoryFields,
        lock: true,
      })
      .set('Authorization', user1.token)
      .end((err, res) => {
        ECOTESTPARTS['C'] = res.body.data;
        expect(res).to.have.status(200);
        expect(res.body.data)
          .to.be.instanceOf(Object)
            .and.to.have.property('_id');
          expect(res.body.data.properties)
            .to.be.instanceOf(Object);
          expect(res.body.data.properties._ref)
            .to.be.equal(mandatoryFields._ref);
          expect(res.body.data.properties._lockState)
            .to.be.equal(true);
        done();
      });
  });
  it('POST Create PART D', done => {
    const { mandatoryFields } = partFields;

    chai
      .request(app)
      .post('/api/v0/nodes/part')
      .send({
        mandatoryFields,
        lock: true,
      })
      .set('Authorization', user1.token)
      .end((err, res) => {
        ECOTESTPARTS['D'] = res.body.data;
        expect(res).to.have.status(200);
        expect(res.body.data)
          .to.be.instanceOf(Object)
            .and.to.have.property('_id');
          expect(res.body.data.properties)
            .to.be.instanceOf(Object);
          expect(res.body.data.properties._ref)
            .to.be.equal(mandatoryFields._ref);
          expect(res.body.data.properties._lockState)
            .to.be.equal(true);
        done();
      });
  });
  it('POST Create PART E', done => {
    const { mandatoryFields } = partFields;

    chai
      .request(app)
      .post('/api/v0/nodes/part')
      .send({
        mandatoryFields,
        lock: true,
      })
      .set('Authorization', user1.token)
      .end((err, res) => {
        ECOTESTPARTS['E'] = res.body.data;
        expect(res).to.have.status(200);
        expect(res.body.data)
          .to.be.instanceOf(Object)
            .and.to.have.property('_id');
          expect(res.body.data.properties)
            .to.be.instanceOf(Object);
          expect(res.body.data.properties._ref)
            .to.be.equal(mandatoryFields._ref);
          expect(res.body.data.properties._lockState)
            .to.be.equal(true);
        done();
      });
  });
  it('POST Create PART F', done => {
    const { mandatoryFields } = partFields;

    chai
      .request(app)
      .post('/api/v0/nodes/part')
      .send({
        mandatoryFields,
        lock: true,
      })
      .set('Authorization', user1.token)
      .end((err, res) => {
        ECOTESTPARTS['F'] = res.body.data;
        expect(res).to.have.status(200);
        expect(res.body.data)
          .to.be.instanceOf(Object)
            .and.to.have.property('_id');
          expect(res.body.data.properties)
            .to.be.instanceOf(Object);
          expect(res.body.data.properties._ref)
            .to.be.equal(mandatoryFields._ref);
          expect(res.body.data.properties._lockState)
            .to.be.equal(true);
        done();
      });
  });
  it('POST Create PART G', done => {
    const { mandatoryFields } = partFields;

    chai
      .request(app)
      .post('/api/v0/nodes/part')
      .send({
        mandatoryFields,
        lock: true,
      })
      .set('Authorization', user1.token)
      .end((err, res) => {
        ECOTESTPARTS['G'] = res.body.data;
        expect(res).to.have.status(200);
        expect(res.body.data)
          .to.be.instanceOf(Object)
            .and.to.have.property('_id');
          expect(res.body.data.properties)
            .to.be.instanceOf(Object);
          expect(res.body.data.properties._ref)
            .to.be.equal(mandatoryFields._ref);
          expect(res.body.data.properties._lockState)
            .to.be.equal(true);
          done();
        });
  });
  // create relationships 

  it('CONNECTS C TO A', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${ECOTESTPARTS.A._id}/relationship/partBom/part/${ECOTESTPARTS.C._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data)
            .to.be.instanceOf(Object)
            .to.have.property('_id');
          expect(res.body.data.source)
            .to.be.instanceOf(Object)
            .to.have.property('_id')
            .to.be.eql(ECOTESTPARTS.A._id);
          expect(res.body.data.target)
            .to.be.instanceOf(Object)
            .to.have.property('_id')
            .to.be.eql(ECOTESTPARTS.C._id);
        done();
      });
  });
  it('CONNECTS D TO A', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${ECOTESTPARTS.A._id}/relationship/partBom/part/${ECOTESTPARTS.D._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data)
            .to.be.instanceOf(Object)
            .to.have.property('_id');
          expect(res.body.data.source)
            .to.be.instanceOf(Object)
            .to.have.property('_id')
            .to.be.eql(ECOTESTPARTS.A._id);
          expect(res.body.data.target)
            .to.be.instanceOf(Object)
            .to.have.property('_id')
            .to.be.eql(ECOTESTPARTS.D._id);
        done();
      });
  });
  it('CONNECTS D TO B', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${ECOTESTPARTS.B._id}/relationship/partBom/part/${ECOTESTPARTS.D._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data)
            .to.be.instanceOf(Object)
            .to.have.property('_id');
          expect(res.body.data.source)
            .to.be.instanceOf(Object)
            .to.have.property('_id')
            .to.be.eql(ECOTESTPARTS.B._id);
          expect(res.body.data.target)
            .to.be.instanceOf(Object)
            .to.have.property('_id')
            .to.be.eql(ECOTESTPARTS.D._id);
        done();
      });
  });
  it('CONNECTS E TO B', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${ECOTESTPARTS.B._id}/relationship/partBom/part/${ECOTESTPARTS.E._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data)
            .to.be.instanceOf(Object)
            .to.have.property('_id');
          expect(res.body.data.source)
            .to.be.instanceOf(Object)
            .to.have.property('_id')
            .to.be.eql(ECOTESTPARTS.B._id);
          expect(res.body.data.target)
            .to.be.instanceOf(Object)
            .to.have.property('_id')
            .to.be.eql(ECOTESTPARTS.E._id);
        done();
      });
  });
  it('CONNECTS F TO C', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${ECOTESTPARTS.C._id}/relationship/partBom/part/${ECOTESTPARTS.F._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data)
            .to.be.instanceOf(Object)
            .to.have.property('_id');
          expect(res.body.data.source)
            .to.be.instanceOf(Object)
            .to.have.property('_id')
            .to.be.eql(ECOTESTPARTS.C._id);
          expect(res.body.data.target)
            .to.be.instanceOf(Object)
            .to.have.property('_id')
            .to.be.eql(ECOTESTPARTS.F._id);
        done();
      });
  });
  it('CONNECTS F TO D', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${ECOTESTPARTS.D._id}/relationship/partBom/part/${ECOTESTPARTS.F._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data)
            .to.be.instanceOf(Object)
            .to.have.property('_id');
          expect(res.body.data.source)
            .to.be.instanceOf(Object)
            .to.have.property('_id')
            .to.be.eql(ECOTESTPARTS.D._id);
          expect(res.body.data.target)
            .to.be.instanceOf(Object)
            .to.have.property('_id')
            .to.be.eql(ECOTESTPARTS.F._id);
        done();
      });
  });
  it('CONNECTS G TO E', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${ECOTESTPARTS.E._id}/relationship/partBom/part/${ECOTESTPARTS.G._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data)
            .to.be.instanceOf(Object)
            .to.have.property('_id');
          expect(res.body.data.source)
            .to.be.instanceOf(Object)
            .to.have.property('_id')
            .to.be.eql(ECOTESTPARTS.E._id);
          expect(res.body.data.target)
            .to.be.instanceOf(Object)
            .to.have.property('_id')
            .to.be.eql(ECOTESTPARTS.G._id);
          done();
      });
  });

  it('Promote PART A to In Review', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${ECOTESTPARTS.A._id}/promote/${partStartState.id}/${partIntermediateState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('Promote PART A to Released', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${ECOTESTPARTS.A._id}/promote/${partIntermediateState.id}/${partReleasedState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
  });


  it('Promote PART B to In Review', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${ECOTESTPARTS.B._id}/promote/${partStartState.id}/${partIntermediateState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('Promote PART B to Released', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${ECOTESTPARTS.B._id}/promote/${partIntermediateState.id}/${partReleasedState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
  });


  it('Promote PART C to In Review', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${ECOTESTPARTS.C._id}/promote/${partStartState.id}/${partIntermediateState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('Promote PART C to Released', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${ECOTESTPARTS.C._id}/promote/${partIntermediateState.id}/${partReleasedState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
  });


  it('Promote PART D to In Review', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${ECOTESTPARTS.D._id}/promote/${partStartState.id}/${partIntermediateState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('Promote PART D to Released', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${ECOTESTPARTS.D._id}/promote/${partIntermediateState.id}/${partReleasedState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
  });


  it('Promote PART E to In Review', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${ECOTESTPARTS.E._id}/promote/${partStartState.id}/${partIntermediateState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('Promote PART E to Released', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${ECOTESTPARTS.E._id}/promote/${partIntermediateState.id}/${partReleasedState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
  });


  it('Promote PART F to In Review', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${ECOTESTPARTS.F._id}/promote/${partStartState.id}/${partIntermediateState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('Promote PART F to Released', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${ECOTESTPARTS.F._id}/promote/${partIntermediateState.id}/${partReleasedState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
  });


  it('Promote PART G to In Review', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${ECOTESTPARTS.G._id}/promote/${partStartState.id}/${partIntermediateState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('Promote PART G to Released', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${ECOTESTPARTS.G._id}/promote/${partIntermediateState.id}/${partReleasedState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  //#endregion BUILD BOM


  // CREATE AN ECO


  it('Create eco', done => {
    chai
      .request(app)
      .post('/api/v0/nodes/eco')
        .send(ecoFields)
        .set('Authorization', user1.token)
        .end((err, res) => {
          createdEco = res.body.data;
          expect(res).to.have.status(200);
          done();
        });
  });

  // add 'creator' lifecycle role to ECO to promote it later
  it(`POST /nodes/{nodetype}/{nodeId}/nodeLifecycleRole/{rolename}/{userId} (Set ECO Lifecycle 'creator' Role (User))`, done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/eco/${createdEco._id}/nodeLifecycleRole/creator/${user1._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
  });

  // add 'changeReviewer' lifecycle role to ECO to promote it later
  it(`POST /nodes/{nodetype}/{nodeId}/nodeLifecycleRole/{rolename}/{userId} (Set ECO Lifecycle 'changeReviewer' Role (User))`, done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/eco/${createdEco._id}/nodeLifecycleRole/changeReviewer/${user1._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
  });


  it('POST /eco/:ecoId/controlledItem/:nodeId Add node A to eco', done => {
    chai
      .request(app)
      .post(`/api/v0/plm/eco/${createdEco._id}/controlledItem/${ECOTESTPARTS.A._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
        done();
      });
  });
  it('PUT /eco/:ecoId/controlledItem/:nodeId Update ECO controlled item', done => {
    chai
      .request(app)
      .put(`/api/v0/plm/eco/${createdEco._id}/controlledItem/${ECOTESTPARTS.A._id}`)
        .send({ singleValue: true, param: 'action', value: 'minor' })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
  });



  it('POST /eco/:ecoId/controlledItem/:nodeId Add node F to eco', done => {
    chai
      .request(app)
      .post(`/api/v0/plm/eco/${createdEco._id}/controlledItem/${ECOTESTPARTS.F._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
        done();
      });
  });
  it('PUT /eco/:ecoId/controlledItem/:nodeId Update ECO controlled item', done => {
    chai
      .request(app)
      .put(`/api/v0/plm/eco/${createdEco._id}/controlledItem/${ECOTESTPARTS.F._id}`)
        .send({ singleValue: true, param: 'action', value: 'major' })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
  });


  it('POST /eco/:ecoId/controlledItem/:nodeId Add node D to eco', done => {
    chai
      .request(app)
      .post(`/api/v0/plm/eco/${createdEco._id}/controlledItem/${ECOTESTPARTS.D._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
        done();
      });
  });
  it('PUT /eco/:ecoId/controlledItem/:nodeId Update ECO controlled item', done => {
    chai
      .request(app)
      .put(`/api/v0/plm/eco/${createdEco._id}/controlledItem/${ECOTESTPARTS.D._id}`)
        .send({ singleValue: false, action: 'minor' })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
        done();
      });
  });
  it('POST /eco/:ecoId/controlledItem/:nodeId Add node B to eco', done => {
    chai
      .request(app)
      .post(`/api/v0/plm/eco/${createdEco._id}/controlledItem/${ECOTESTPARTS.B._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
        done();
      });
  });
  it('PUT /eco/:ecoId/controlledItem/:nodeId Update ECO controlled item', done => {
    chai
      .request(app)
      .put(`/api/v0/plm/eco/${createdEco._id}/controlledItem/${ECOTESTPARTS.B._id}`)
        .send({ singleValue: false, action: 'minor' })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
        done();
      });
  });
  it('POST /:nodetype/:nodeId/promote/:actualStateId/:targetState Promote Node (Promote ECO to Reviewing Request)', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/eco/${createdEco._id}/promote/${ecoDraftState.id}/${ecoReviewingRequestState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /:nodetype/:nodeId/promote/:targetState Promote Node (Promote ECO to In Work)', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/eco/${createdEco._id}/promote/${ecoReviewingRequestState.id}/${ecoInWorkState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
        done();
      });
  });
  it('POST /eco/:ecoId/controlledItem/:nodeId Add node B to eco while it was already revised', done => {
    chai
      .request(app)
      .post(`/api/v0/plm/eco/${createdEco._id}/controlledItem/${ECOTESTPARTS.B._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(500);
          done();
        });
  });

  it('POST /:nodetype/:nodeId/promote/:targetState Promote Node (Get ECO back to Draft)', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/eco/${createdEco._id}/promote/${ecoInWorkState.id}/${ecoDraftState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
        done();
      });
  });

  // may be removed later, for debug
  it('POST plm/processECONode/:nodetype/:nodeId - Revise PART A', done => {
    chai
      .request(app)
      .post(`/api/v0/plm/processECONode/part/${ECOTESTPARTS.A._id}`)
        .set('Authorization', user1.token)
        .send({ action: 'patch' })
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('Find revised node', done => {
    chai
      .request(app)
      .get(`/api/v0/nodes/part/${ECOTESTPARTS.A._id}/allRelationships`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
        expect(res.body.data).to.be.an('array');
        const revisedRel = res.body.data.find((r) => r._type === 'revision');
        if (revisedRel) {
          revisedParts['A'] = revisedRel.source;
        }
        done();
      });
  });

  it('Promote revised PART to In Review', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${revisedParts.A._id}/promote/${partStartState.id}/${partIntermediateState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('Promote revised PART to Released', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${revisedParts.A._id}/promote/${partIntermediateState.id}/${partReleasedState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
  });

  // may be removed later, for debug
  it('POST plm/processECONode/:nodetype/:nodeId - Revise PART D', done => {
    chai
      .request(app)
      .post(`/api/v0/plm/processECONode/part/${ECOTESTPARTS.D._id}`)
        .set('Authorization', user1.token)
        .send({ action: 'patch' })
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('Find revised node', done => {
    chai
      .request(app)
      .get(`/api/v0/nodes/part/${ECOTESTPARTS.D._id}/allRelationships`)
      .set('Authorization', user1.token)
      .end((err, res) => {
        const revisedRel = res.body.data.find((r) => r._type === 'revision');
        revisedParts['D'] = revisedRel.source;
        expect(res).to.have.status(200);
        done();
      });
  });

  it('Add User as manager of D', done => { 
    chai 
      .request(app) 
      .post(`/api/v0/nodes/part/${revisedParts.D._id}/nodeAccessRole/manager/${user1._id}`) 
        .set('Authorization', user1.token) 
        .end((err, res) => { 
          expect(res).to.have.status(200); 
          done(); 
      }); 
  });

  it('Remove Organic Access on D', done => {
    chai
      .request(app)
      .delete(`/api/v0/nodes/part/${revisedParts.D._id}/nodeAccessRole/PermissionSet/part`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('Remove User as manager on D and leave node without manager or PermissionSet Access Role', done => {
    chai
      .request(app)
      .delete(`/api/v0/nodes/part/${revisedParts.D._id}/nodeAccessRole/manager/${user1._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(500);
          done();
      });
  });

  it('Promote revised PART to In Review', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${revisedParts.D._id}/promote/${partStartState.id}/${partIntermediateState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('Promote revised PART to Released', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${revisedParts.D._id}/promote/${partIntermediateState.id}/${partReleasedState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
  });

  // may be removed later, for debug
  it('POST plm/processECONode/:nodetype/:nodeId - Revise PART F', done => {
    chai
      .request(app)
      .post(`/api/v0/plm/processECONode/part/${ECOTESTPARTS.F._id}`)
        .set('Authorization', user1.token)
        .send({ action: 'patch' })
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('Find revised node', done => {
    chai
      .request(app)
      .get(`/api/v0/nodes/part/${ECOTESTPARTS.F._id}/allRelationships`)
      .set('Authorization', user1.token)
      .end((err, res) => {
        const revisedRel = res.body.data.find((n) => n._type === 'revision');
        revisedParts['F'] = revisedRel.source;
        expect(res).to.have.status(200);
        done();
      });
  });

  it('Promote revised PART to In Review', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${revisedParts.F._id}/promote/${partStartState.id}/${partIntermediateState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('Promote revised PART to Released', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${revisedParts.F._id}/promote/${partIntermediateState.id}/${partReleasedState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
  });


  it('Create eco', done => {
    chai
      .request(app)
      .post('/api/v0/nodes/eco')
        .send(ecoFields)
        .set('Authorization', user1.token)
        .end((err, res) => {
          createdEco = res.body.data;
          expect(res).to.have.status(200);
        done();
      });
  });
  it('POST /eco/:ecoId/controlledItem/:nodeId Add node D to eco', done => {
    chai
      .request(app)
      .post(`/api/v0/plm/eco/${createdEco._id}/controlledItem/${revisedParts.D._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
        done();
      });
  });
  it('PUT /eco/:ecoId/controlledItem/:nodeId Update ECO controlled item', done => {
    chai
      .request(app)
      .put(`/api/v0/plm/eco/${createdEco._id}/controlledItem/${revisedParts.D._id}`)
        .send({ singleValue: true, param: 'action', value: 'minor' })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
        done();
      });
  });
  it('POST /eco/:ecoId/controlledItem/:nodeId Add node F to eco', done => {
    chai
      .request(app)
      .post(`/api/v0/plm/eco/${createdEco._id}/controlledItem/${revisedParts.F._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
        done();
      });
  });
  it('PUT /eco/:ecoId/controlledItem/:nodeId Update ECO controlled item', done => {
    chai
      .request(app)
      .put(`/api/v0/plm/eco/${createdEco._id}/controlledItem/${revisedParts.F._id}`)
        .send({ singleValue: true, param: 'action', value: 'minor' })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
        done();
      });
  });
  it('POST /:nodetype/:nodeId/promote/:targetState Promote Node (Promote ECO to Reviewing Request)', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/eco/${createdEco._id}/promote/${ecoDraftState.id}/${ecoReviewingRequestState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /:nodetype/:nodeId/promote/:targetState Promote Node (Promote ECO to In Work)', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/eco/${createdEco._id}/promote/${ecoReviewingRequestState.id}/${ecoInWorkState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });
  });


  // #region Nodes Routes
  context('Nodes Routes', () => {
    it('POST /nodes/{nodetype} Create a CAD document', (done) => {
      chai
        .request(app)
        .post('/api/v0/nodes/cadDocument')
        .set('Authorization', user1.token)
        .send(cadDocumentFields)
        .end((err, res) => {
          expect(res).to.have.status(200);
          createdCadDocument = res.body.data;
          done();
        });
  });


  it('POST /nodes/{nodetype} Get CAD Flat list', done => {
    chai
      .request(app)
      .get('/api/v0/plm/CAD/CADDocument/flatlist/' + createdCadDocument._id)
      .set('Authorization', user1.token)
      .end((err, res) => {
        expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodes/{nodetype} Create a document', done => {
    chai
      .request(app)
      .post('/api/v0/nodes/document')
        .send(documentFields)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          createdDocument = res.body.data;
          done();
      });
  });

  it('POST /uploads Upload a file', done => {
    chai
      .request(app)
      .post('/api/v0/uploads')
        .set('Authorization', user1.token)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .attach('file', fs.readFileSync('./test/assets/test.txt'), 'test.txt')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('url');
          file = res.body;
          done();
      });
  });

  it('POST /uploads Upload a file (local)', done => {
    chai
      .request(app)
      .post('/api/v0/uploads/local')
        .set('Authorization', user1.token)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .attach('file', fs.readFileSync('./test/assets/test.txt'), 'test.txt')
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /localImages Upload a local image', done => {
    chai
      .request(app)
      .post('/api/v0/uploads/localImages')
        .set('Authorization', user1.token)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .attach('file', fs.readFileSync('./test/assets/test.png'), 'test.png')
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
  });


  it('POST /nodes/{nodetype} Create a file', done => {
    chai
      .request(app)
      .post('/api/v0/nodes/file')
        .send({ ...fileFields, file })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          createdFile = res.body.data;
          done();
      });
  });

  it('GET /generatePublicURL/:nodeId Generate Public URL', done => {
    chai
      .request(app)
      .get(`/api/v0/uploads/generatePublicURL/${createdFile._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('GET /files/fileContent/:fileId Get File Content', done => {
    chai
      .request(app)
      .get(`/api/v0/files/fileContent/${createdFile._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('PUT /files/fileContent/:fileId Update File Content', done => {
    chai
      .request(app)
      .put(`/api/v0/files/fileContent/${createdFile._id}`)
        .send({ data: 'Hello World' })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodes/{nodetype} Create a part', done => {
    chai
      .request(app)
      .post('/api/v0/nodes/part')
        .send(partFields)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          createdPart = res.body.data;
          done();
      });
  });

  it('POST /nodes/{nodetype} Create a fieldedPart', done => {
    chai
      .request(app)
      .post('/api/v0/nodes/fieldedPart')
        .send(fieldedPartFields)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          createdFieldedPart = res.body.data;
        });

      // create a second fieldedPart to attach one to the other
      chai
        .request(app)
        .post('/api/v0/nodes/fieldedPart')
        .send(fieldedPartFields)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          createdFieldedPart2 = res.body.data;
        });

      // create a third fieldedPart to attach one to the other
      chai
        .request(app)
        .post('/api/v0/nodes/fieldedPart')
        .send(fieldedPartFields)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          createdFieldedPart3 = res.body.data;
          done();
      });
  });

  it('GET /nodes/{nodetype} (Get Parts)', done => {
    chai
      .request(app)
      .get('/api/v0/nodes/part')
      .set('Authorization', user1.token)
      .end((err, res) => {
        if (err) console.log(err)
        expect(res).to.have.status(200);
        done();
      });
  });

  it('POST /nodes/{nodetype}/search (Search Parts)', done => {
    chai
      .request(app)
      .post('/api/v0/nodes/part/search')
        .send({ maxResults: 1 })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data).to.be.an.instanceOf(Array);
          // expect(res.body.data).to.have.lengthOf(1);
          done();
      });
  });

  it('GET /nodes/{nodetype}/checkNodeCreationRight (Check if user has access to create nodes for a particular nodetype)', done => {
    chai
      .request(app)
      .get('/api/v0/nodes/part/checkNodeCreationRight')
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodes/{nodetype}/{nodeId}/relationship/{relname}/{targetNodeType}/{targetnodeId} (Create a relationship (part)-[:containsDoc]->(document))', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${createdPart._id}/relationship/${partDocumentRel.name}/document/${createdDocument._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data)
            .to.be.instanceOf(Object)
            .to.have.property('_id');
          expect(res.body.data.source)
            .to.be.instanceOf(Object)
            .to.have.property('_id')
            .to.be.eql(createdPart._id);
          expect(res.body.data.target)
            .to.be.instanceOf(Object)
            .to.have.property('_id')
            .to.be.eql(createdDocument._id);
          createdPartDocumentRel = res.body.data;
          done();
      });
  });

  it('POST /nodes/{nodetype}/{nodeId}/relationship/{relname}/{targetNodeType}/{targetnodeId} (Create a relationship (document)-[:containsFiles]->(file))', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/document/${createdDocument._id}/relationship/${documentFileRel.name}/file/${createdFile._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          createdDocumentFileRel = res.body.data;
          done();
      });
  });

  it('POST /nodes/{nodetype}/{nodeId}/relationship/{relname}/{targetNodeType}/{targetnodeId} (Create a relationship (fieldedPart)-[:composedOf]->(fieldedPart))', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/fieldedPart/${createdFieldedPart._id}/relationship/${fieldPartBOMRel.name}/fieldedPart/${createdFieldedPart2._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          createdFieldPartBOMRel = res.body.data;
        });

      // same operation between fieldpart2 and fieldedPart3 to create a multilevel structure
      chai
        .request(app)
        .post(`/api/v0/nodes/fieldedPart/${createdFieldedPart2._id}/relationship/${fieldPartBOMRel.name}/fieldedPart/${createdFieldedPart3._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          createdFieldPartBOMRel = res.body.data;
          done();
      });
  });

  it('PATCH /nodes/{nodetype}/{nodeId}/relationship/{relname}/{relId} (Update Relationship (document)-[:contains]->(file))', done => {
    chai
      .request(app)
      .patch(`/api/v0/nodes/document/${createdDocument._id}/relationship/${documentFileRel.name}/${createdDocumentFileRel._id}`)
      .send({ prop: '_sequence', value: "1" })
      .set('Authorization', user1.token)
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  })

  it('DELETE /nodes/{nodetype}/{nodeId}/relationship/{relname}/{relId} (Delete the relationship (document)-[:contains]->(file))', done => {
    chai
      .request(app)
      .delete(`/api/v0/nodes/document/${createdDocument._id}/relationship/${documentFileRel.name}/${createdDocumentFileRel._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          createdDocumentFileRel = {};
          expect(res).to.have.status(200);
          done();
      });
  });

  it('PUT /nodes/{nodetype}/{nodeId} (Update Node)', done => {
    chai
      .request(app)
      .put(`/api/v0/nodes/part/${createdPart._id}`)
        .send({ newValue: { _ref: 'testPart' } })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);

          // check execution of the triggered method 'customMethodUpdated'
          expect(res.body.data).to.have.property('_id');
          expect(res.body.data.properties).to.have.property('description');
          expect(res.body.data.properties.description).to.be.eql('Hello, world!');
          done();
      });
  });

  it('PATCH /nodes/{nodetype}/{nodeId} (Update Node Value)', done => {
    chai
      .request(app)
      .patch(`/api/v0/nodes/part/${createdPart._id}`)
        .send({ prop: '_ref', value: 'testPart2' })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('GET /nodes/{nodetype}/{nodeId} (GET Node)', done => {
    chai
      .request(app)
      .get(`/api/v0/nodes/part/${createdPart._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('GET /nodes/{nodetype} (GET Nodes)', done => {
    chai
      .request(app)
      .get(`/api/v0/nodes/part`)
      .set('Authorization', user1.token)
      .end((err, res) => {
        expect(res).to.have.status(200);
          expect(res.body.data).to.be.an.instanceOf(Array);
          done();
      });
  });

  it('POST /nodes/{nodetype}/{nodeId}/relationship/{relname}/{targetNodeType}/{targetnodeId} (Re-Create a relationship (document)-[:contains]->(file))', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/document/${createdDocument._id}/relationship/${documentFileRel.name}/file/${createdFile._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          createdDocumentFileRel = res.body.data;
          done();
      });
  });

  it('GET /nodes/{nodetype}/{nodeId}/nodeAccessRoles (Get Node Access Roles of part)', done => {
    chai
      .request(app)
      .get(`/api/v0/nodes/part/${createdPart._id}/nodeAccessRoles`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodes/{nodetype}/{nodeId}/nodeAccessRole/{rolename}/{identity} (Set Node Access Roles on Part)', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${createdPart._id}/nodeAccessRole/reader/${user1._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('DELETE /nodes/{nodetype}/{nodeId}/nodeAccessRole/{rolename}/{identity} (Delete Node Access Roles of part)', done => {
    chai
      .request(app)
      .delete(`/api/v0/nodes/part/${createdPart._id}/nodeAccessRole/reader/${user1._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodes/{nodetype}/{nodeId}/nodeAccessRole/{rolename}/{identity} (Set Node Access Roles on part)', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${createdPart._id}/nodeAccessRole/manager/${user1._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodes/{nodetype}/{nodeId}/nodeLifecycleRole/{rolename}/{userId} (Set Node Lifecycle Role (User))', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/document/${createdDocument._id}/nodeLifecycleRole/user/${user1._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('DELETE /nodes/{nodetype}/{nodeId}/nodeLifecycleRole/{rolename}/{userId} (Remove Node Lifecycle Role (User))', done => {
    chai
      .request(app)
      .delete(`/api/v0/nodes/document/${createdDocument._id}/nodeLifecycleRole/user/${user1._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodes/{nodetype}/{nodeId}/nodeLifecycleRole/{rolename}/{userId} (Set Node Lifecycle Role (Manager))', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/document/${createdDocument._id}/nodeLifecycleRole/manager/${user1._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('PUT /nodes/{nodetype}/{nodeId}/subscription/{active} (Subscribe to Node)', done => {
    chai
      .request(app)
      .put(`/api/v0/nodes/part/${createdPart._id}/subscription/true`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodes​/{nodetype}​/{nodeId}​/unlock (Unlock Node)', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${createdPart._id}/unlock`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodes​/{nodetype}​/{nodeId}​/lock​ (Lock Node)', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${createdPart._id}/lock`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('GET /nodes/{nodetype}/{nodeId}/lockstate (Get Node\'s Lockstate)', done => {
    chai
      .request(app)
      .get(`/api/v0/nodes/part/${createdPart._id}/lockstate`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodes​/{nodetype}​/{nodeId}​/recursive (Get Node Multilevel BOM)', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${createdPart._id}/recursive`)
        .send({ relationships: [partDocumentRel.id] })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('GET /nodes/{nodetype}/{nodeId}/allRelationships (Get Relationships)', done => {
    chai
      .request(app)
      .get(`/api/v0/nodes/part/${createdPart._id}/allRelationships`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('GET /nodes/{nodetype}/{nodeId}/isLifecycleStateOwner (Check if user is Lifecycle Owner of a node)', done => {
    chai
      .request(app)
      .get(`/api/v0/nodes/part/${createdPart._id}/isLifecycleStateOwner`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('GET /nodes/{nodetype}/{nodeId}/history (Get Node\'s History)', done => {
    chai
      .request(app)
      .get(`/api/v0/nodes/part/${createdPart._id}/history`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('GET /nodes/{nodetype}/{nodeId}/permissions (Get Node\'s Permissions)', done => {
    chai
      .request(app)
      .get(`/api/v0/nodes/part/${createdPart._id}/permissions`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('GET /nodes/{nodetype}/{nodeId}/versions/{nodeVersion}/parents (Get Node Parents)', done => {
    chai
      .request(app)
      .get(`/api/v0/nodes/part/${createdPart._id}/versions/1.0.0/parents`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('GET /nodes/{nodetype}/{nodeId}/getReverseEcos (Get Reverse Related Nodes)', done => {
    const reverseRelationshipsTab = _.find(partDM.ui.tabs, { tabContentType: 'reverseRelationships' })
    chai
      .request(app)
      .get(`/api/v0/nodes/part/${createdPart._id}/getReverseEcos`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an.instanceOf(Array);
          done();
      });
  });

  it('POST /nodes/checkUniqueFields (Check Unique Fields)', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/checkUniqueFields`)
      .send({ nodetypeName: 'part', nodeId: createdPart._id, fields: [{ name: '_ref', value: 'Tzio' }] })
      .set('Authorization', user1.token)
      .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodes/{nodetype}/{nodeId}/serializeNode (Serialize Node)', done => {
    partDM = global.datamodel.nodetypeDefinitions.find((nodetype) => {
      return nodetype.name === 'part';
    });
      const instanciation = partDM.instanciations.find((i) => {
        return i.name === 'instanciationName';
      });

      chai
        .request(app)
        .post(`/api/v0/nodes/part/${createdPart._id}/serializeNode`)
      .send({ instanciationId: instanciation.id })
      .set('Authorization', user1.token)
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  it('Try to update the locked part with correct user', done => {
    chai
      .request(app)
      .patch(`/api/v0/nodes/part/${createdPart._id}`)
        .send({ prop: '_ref', value: 'Ref' })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('Try to update the locked part with a different user', done => {
    chai
      .request(app)
      .patch(`/api/v0/nodes/part/${createdPart._id}`)
        .send({ prop: '_ref', value: 'New Ref' })
        .set('Authorization', user2.token)
        .end((err, res) => {
          expect(res).to.have.status(403);
          done();
      });
  });

  it('Promote PART to In Review', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${createdPart._id}/promote/${partStartState.id}/${partIntermediateState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('Promote PART to Released', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${createdPart._id}/promote/${partIntermediateState.id}/${partReleasedState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('Create eco', done => {
    chai
      .request(app)
      .post('/api/v0/nodes/eco')
        .send(ecoFields)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          createdEco = res.body.data;
          done();
      });
  });

  it('POST /eco/:ecoId/controlledItem/:nodeId Add node to eco', done => {
    chai
      .request(app)
      .post(`/api/v0/plm/eco/${createdEco._id}/controlledItem/${createdPart._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('GET /eco/:ecoId/controlledItems Get ECO controlled items', done => {
    chai
      .request(app)
      .get(`/api/v0/plm/eco/${createdEco._id}/controlledItems`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('GET /eco/:ecoId/controlledItems Get ECO controlled items extended', done => {
    chai
      .request(app)
      .get(`/api/v0/plm/eco/${createdEco._id}/controlledItems/extended`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('GET /eco/:ecoId/controlledItem/:nodeId Get ECO controlled item', done => {
    chai
      .request(app)
      .get(`/api/v0/plm/eco/${createdEco._id}/controlledItem/${createdPart._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('PUT /eco/:ecoId/controlledItem/:nodeId Update ECO controlled item', done => {
    chai
      .request(app)
      .put(`/api/v0/plm/eco/${createdEco._id}/controlledItem/${createdPart._id}`)
        .send({ singleValue: true, param: 'action', value: 'minor' })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
  });


  it('POST /:nodetype/:nodeId/promote/:actualStateId/:targetState Promote Node (Promote ECO to Reviewing Request)', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/eco/${createdEco._id}/promote/${ecoDraftState.id}/${ecoReviewingRequestState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /:nodetype/:nodeId/promote/:targetState Promote Node (Promote ECO to In Work)', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/eco/${createdEco._id}/promote/${ecoReviewingRequestState.id}/${ecoInWorkState.id}`)
      .set('Authorization', user1.token)
      .end((err, res) => {
        if (err) console.log(err)
        expect(res).to.have.status(200);
        done();
      });
  });

  it('GET /eco/{ecoId}/processedItems/extended Get ECO Processed Nodes', done => {
    chai
      .request(app)
      .get(`/api/v0/plm/eco/${createdEco._id}/processedItems/extended`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
  });


  it('Find revised node', done => {
    chai
      .request(app)
      .get(`/api/v0/nodes/part/${createdPart._id}/allRelationships`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          const revisedRel = res.body.data.find((r) => r._type === 'revision');
          if (revisedRel) revisedPart = revisedRel.source;
          expect(revisedPart.properties._version).to.equal('1.1.0');
          done();
      });
  });

  it('Promote revised PART to In Review', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${revisedPart._id}/promote/${partStartState.id}/${partIntermediateState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('Promote revised PART to Released', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/part/${revisedPart._id}/promote/${partIntermediateState.id}/${partReleasedState.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('Check Initial Part validity', done => {
    chai
      .request(app)
      .get(`/api/v0/nodes/part/${createdPart._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data.properties._state).to.equal('superseded');
          expect(res.body.data.properties._releasedUntil).to.be.gt(res.body.data.properties._createdOn);
          expect(res.body.data.properties._releasedUntil).to.be.lt(Date.now() + 10000);
          done();
      });
  });

  it('DELETE /eco/:ecoId/controlledItem/:nodeId Delete ECO controlled item', done => {
    chai
      .request(app)
      .delete(`/api/v0/plm/eco/${createdEco._id}/controlledItem/${createdPart._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('DELETE /nodes/{nodetype}/{nodeId} (Delete eco)', done => {
    chai
      .request(app)
      .delete(`/api/v0/nodes/eco/${createdEco._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
  });

  if (!_.isEmpty(partDM.instanciations)) {
    it('POST /instanciateNode/:nodetype/:nodeId (Instanciate Node (Instanciate Part))', done => {
      const instanciation = partDM.instanciations.find((i) => i.name === 'instanciationName');

      chai
          .request(app)
          .post(`/api/v0/plm/instanciateNode/part/${createdPart._id}`)
          .send({ instanciationId: instanciation.id })
          .set('Authorization', user1.token)
          .end((err, res) => {
            expect(res).to.have.status(200);
            done();
          });
    });
  }

  it('DELETE /nodes/{nodetype}/{nodeId} Delete the parent fieldedPart', done => {
    chai
      .request(app)
      .delete(`/api/v0/nodes/fieldedPart/${createdFieldedPart._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('GET /nodes/{nodetype}/{nodeId} Check if children fieldedParts are also deleted', done => {
    chai
      .request(app)
      .get(`/api/v0/nodes/fieldedPart/${createdFieldedPart2._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(404);
        });

      chai
        .request(app)
        .get(`/api/v0/nodes/fieldedPart/${createdFieldedPart3._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
      });
  });

  it('DELETE /nodes/{nodetype}/{nodeId} Delete the document', done => {
    chai
      .request(app)
      .delete(`/api/v0/nodes/document/${createdDocument._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(409);
          done();
      });
  });

  it('DELETE /nodes/{nodetype}/{nodeId} Delete revised part', done => {
    chai
      .request(app)
      .delete(`/api/v0/nodes/part/${revisedPart._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('DELETE /nodes/{nodetype}/{nodeId} Delete the part', done => {
    chai
      .request(app)
      .delete(`/api/v0/nodes/part/${createdPart._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(409);
          done();
        });
  });





  it('GET /nodes/groups (Get Groups)', done => {
    chai
      .request(app)
      .get('/api/v0/nodes/groups')
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodes/groups (Add Group)', done => {
    chai
      .request(app)
      .post('/api/v0/nodes/groups')
        .send({ group: 'TestGroup', groupType: 'group' })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          group = res.body.data;
          done();
        });
  });


  it('POST /groups/:groupId/GroupMember/:childGroupId (Add Group Member (group))', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/groups/${adminGroupId}/GroupMember/${group._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('DELETE /groups/:groupId/GroupMember/:childGroupId (Delete Group Member (group))', done => {
    chai
      .request(app)
      .delete(`/api/v0/nodes/groups/${adminGroupId}/GroupMember/${group._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /groups/:groupId/UserMember/:userId (Add Group Member (user))', done => {
    chai
      .request(app)
      .post(`/api/v0/nodes/groups/${adminGroupId}/UserMember/${user2._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('DELETE /groups/:groupId/UserMember/:userId (Delete Group Member (user))', done => {
    chai
      .request(app)
      .delete(`/api/v0/nodes/groups/${adminGroupId}/UserMember/${user2._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('GET /nodes/accessNodes (Get Access Nodes)', done => {
    chai
      .request(app)
      .get('/api/v0/nodes/accessNodes')
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /nodes/accessNodes (Add Access Nodes)', done => {
    chai
      .request(app)
      .post('/api/v0/nodes/accessNodes')
        .send({ permission: 'testPermission' })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          accessNode = res.body.data;
          done();
      });
  });

  it('GET /nodes/accessNodes/:permissionSetName (Get Access Node)', done => {
    chai
      .request(app)
      .get(`/api/v0/nodes/accessNodes/${accessNode.properties.name}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('PUT /nodes/accessNodes/:permissionSetName (Update Access Node (Add Group))', done => {
    chai
      .request(app)
      .put(`/api/v0/nodes/accessNodes/${accessNode.properties.name}`)
        .send({ members: { type: 'Group', name: 'Administrator', action: 'add' } })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('PUT /nodes/accessNodes/:permissionSetName (Update Access Node (Remove Group))', done => {
    chai
      .request(app)
      .put(`/api/v0/nodes/accessNodes/${accessNode.properties.name}`)
        .send({ members: { type: 'Group', name: 'Administrator', action: 'remove' } })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('PUT /nodes/accessNodes/:permissionSetName (Update Access Node (Add User))', done => {
    chai
      .request(app)
      .put(`/api/v0/nodes/accessNodes/${accessNode.properties.name}`)
        .send({ members: { type: 'user', _id: user1._id, action: 'add' } })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('PUT /nodes/accessNodes/:permissionSetName (Update Access Node (Remove User))', done => {
    chai
      .request(app)
      .put(`/api/v0/nodes/accessNodes/${accessNode.properties.name}`)
        .send({ members: { type: 'user', _id: user1._id, action: 'remove' } })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('DELETE /nodes/accessNodes/:permissionSetName (Delete Access Node)', done => {
    chai
      .request(app)
      .delete(`/api/v0/nodes/accessNodes/${accessNode.properties.name}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });

    //  TODO: POST /accessNodes/:accessNodeId/GroupMember/:groupId (Add Access Node Member (group))
    //  TODO: PATCH /accessNodes/:accessNodeId/GroupMember/:groupId (Update Access Node Member (group))
    //  TODO: DELETE /accessNodes/:accessNodeId/GroupMember/:groupId (Delete Access Node Member (group))

    //  TODO: POST /accessNodes/:accessNodeId/GroupMember/:userId (Add Access Node Member (user))
  //  TODO: PATCH /accessNodes/:accessNodeId/GroupMember/:userId (Update Access Node Member (user))
  //  TODO: DELETE /accessNodes/:accessNodeId/GroupMember/:userId (Delete Access Node Member (user))

  it('GET /nodes/groups/{groupName} (Get Group)', done => {
    chai
      .request(app)
      .get(`/api/v0/nodes/groups/${group._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('PUT /nodes/groups/{groupName} (Update Group)', done => {
    chai
      .request(app)
      .put(`/api/v0/nodes/groups/${group._id}`)
        .send({ properties: { name: 'newTestGroup' } })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('DELETE /nodes/groups/{groupName} (Delete Group)', done => {
    chai
      .request(app)
      .delete(`/api/v0/nodes/groups/${group._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });
  });
//#endregion Nodes Routes


  // #region More Datamodel
  context('More Datamodel', () => {
    it('DELETE /nodetypes/methods/{id} (Delete Method)', (done) => {
      chai
        .request(app)
        .delete(`/api/v0/nodetypes/methods/${methodId}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          const existingFile = fs.existsSync(`${DMPath}methods/${methodName}.js`);
          expect(existingFile).to.equal(false);
          expect(res).to.have.status(200);
          done();
        });
  });


  it('PUT /nodetypes/categories (Update Categories)', done => {
    chai
      .request(app)
      .put('/api/v0/nodetypes/categories')
        .send({ categories: datamodel.leftPanelCategories })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });

})
//#endregion More Datamodel

  context('Delete/Clean created items', () => {
    it('DELETE /nodetypes/{nodetype} (Delete a Nodetype)', (done) => {
      chai
        .request(app)
        .delete(`/api/v0/nodetypes/${testNodetype.id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          const existingFile = fs.existsSync(`${DMPath}nodetypes/${testNodetype.name}.json`);
          expect(existingFile).to.equal(false);
          done();
      });
  });

  it('GET /translations/resetTranslationForCoreProperties (Reset Translation for Core Properties)', done => {
    chai
      .request(app)
      .get('/api/v0/translations/resetTranslationForCoreProperties')
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /translations/resetDefaultLangNodetypeTranslation/:nodetypeName (Reset Default Language Nodetype Translation)', done => {
    chai
      .request(app)
      .post('/api/v0/translations/resetDefaultLangNodetypeTranslation/part')
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });

  it('POST /translations/updateConfig (Add or remove a language)', done => {
      chai
        .request(app)
        .post('/api/v0/translations/updateConfig')
      .send({ data: { language: { key: "aa" }, remove: true } })
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });
  });

  context('Logs', () => {
    it('GET /log/errors (Get Errors)', (done) => {
      chai
        .request(app)
        .get('/api/v0/log/errors')
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
      });
  });

  it('POST /log/errors (Create Error)', done => {
    chai
      .request(app)
      .post('/api/v0/log/errors')
        .send({ title: 'New Error', message: 'Error Message', statusCode: 400 })
        .set('Authorization', user1.token)
        .end((err, res) => {
          error = res.body;
          expect(res).to.have.status(200);
          done();
      });
  });

  it('DELETE /log/errors/{id} (Delete Error)', done => {
    chai
      .request(app)
      .delete(`/api/v0/log/errors/${error._id}`)
        .set('Authorization', user1.token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });
  });
});
