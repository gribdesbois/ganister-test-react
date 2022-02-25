angular.module('app.ganister.config.models.datamodel', [
  'ui.select',
  'ngSanitize',
  'app.ganister.languages.config'
])
  .controller('nodetypeCreation', function (data, $scope, datamodelModel, Notification, $http) {


    $scope.isrelationship = false;
    $scope.undirectedRelationship = false;
    $scope.newpackage = false;
    $scope.newpackagename = "";
    $scope.tabAttachmentMode = 'both';
    $scope.cancel = function () {
      $scope.isrelationship = false;
      $scope.undirectedRelationship = false;
      $scope.newpackage = false;
      $scope.newpackagename = "";
      $scope.tabAttachmentMode = 'both';
      $scope.nodetypeName = "";
    }


    // Retrieve App Settings
    const APIVersion = "v0";
    let settings = {};
    $http.get(`/api/${APIVersion}/config/settings`).then((result) => {
      if (result.status === 200) {
        settings = result.data;
        localStorage.setItem('ganisterUrl', settings.url);
        localStorage.setItem('ganisterPort', settings.port);
      } else {
        Notification.error('Error reading settings');
      }
    });


    $scope.$on("startCreatingNodetype", async (events, params) => {
      $scope.relAndRelated = params.relAndRelated;
      if (params.isrelationship) {
        $scope.isrelationship = true;
        $scope.cardinality = 'free';
        $scope.sourcenodetype = _.find($scope.$parent.datamodel.nodetypes, { "id": params.sourceId });
        params.hasPackage = true;
        $scope.selectedPackage = _.find($scope.$parent.datamodel.packages, { "name": $scope.sourcenodetype.package });
      }
      if (!params.hasPackage) {
        $scope.newpackage = true;
      }
      $scope.link = "";
      $scope.tabName = "";
      $scope.relatedNodetypeName = "";
      $scope.$apply();
    });

    // auto rules based on codification
    $scope.$watch('cardinality', function (newValue, oldValue) {
      switch (newValue) {
        case 'free':
          break;
        case 'NtoN':
          break;
        case '1toN':
          break;
        case 'Nto1':
          $scope.createTab = false;
          delete $scope.tabName;
          delete $scope.tabAttachmentMode;
          break;
        case '1to1':
          $scope.createTab = false;
          delete $scope.tabName;
          delete $scope.tabAttachmentMode;
          break;
        default:
          break;
      }
    });

    const updateTranslationFile = async (nodetypeName) => {
      const result = await datamodelModel.translations.update('default', {
        path: `default.nodetype.${nodetypeName}`,
        value: nodetypeName,
      });
      if (result.status === 200) {
        Notification.success('Nodetype created in translation file');
      } else {
        Notification.error('Nodetype not created in translation file');
      }
      const updateDefaultTranslation = await datamodelModel.translations.resetDefaultLangNodetypeTranslation(nodetypeName);
      if (updateDefaultTranslation.status === 200) {
        Notification.success('Nodetype properties translated');
      } else {
        Notification.error('Nodetype properties did not translated');
      }
      return result;
    }

    $scope.creationInProcess = false;
    $scope.createNewNodetype = async () => {
      $scope.creationInProcess = true;
      if (!$scope.nodetypeName || (!$scope.newpackagename && !$scope.selectedPackage)) {
        $scope.creationInProcess = false;
        return Notification.error({
          title: `Missing fields`,
          message: 'Nodetype Name and Package are required',
        });
      }
      const nodetypeName = $scope.nodetypeName;
      const relatedNodetypeName = $scope.relatedNodetypeName;
      let dmPackage = "";
      if ($scope.newpackage && $scope.newpackagename) {
        const result = await datamodelModel.packages.add($scope.newpackagename);
        dmPackage = result.data.package.id;
        dmPackage = result.data.package.name;
      } else {
        dmPackage = $scope.selectedPackage.name;
      }
      let type = {
        isrelationship: $scope.isrelationship,
        package: dmPackage,
      }
      if (type.isrelationship) type.undirectedRelationship = $scope.undirectedRelationship;

      if ($scope.relAndRelated) {
        if (!$scope.relatedNodetypeName || !$scope.link) {
          $scope.creationInProcess = false;
          return Notification.error({
            title: `Missing fields`,
            message: 'Related Nodetype name and Semantic link name are required',
          });
        }
        type.elementType = "node"
        const addRelatedNodetypeResult = await datamodelModel.nodetypes.add(relatedNodetypeName, type);
        //  Update Translation File
        let translationResult = await updateTranslationFile(relatedNodetypeName);
        // reload full schema
        type.elementType = "relationship";
        type.rel = {
          source: $scope.sourcenodetype.id,
          target: addRelatedNodetypeResult.nodetype.id,
          linkname: $scope.link,
          cardinality: $scope.cardinality,
        };
        const addNodetypeResult = await datamodelModel.nodetypes.add(nodetypeName, type);
        Notification.success('Nodetype created');
        //  Update Translation File
        translationResult = await updateTranslationFile(nodetypeName);
        const relationshipId = addNodetypeResult.nodetype.id;
        if ($scope.createTab) {
          await $scope.addTab($scope.sourcenodetype.name, relationshipId, $scope.tabName, $scope.tabAttachmentMode);
        }
        await datamodelModel.getDatamodel()
          .catch(function (e) {
            $scope.creationInProcess = false;
            console.error(e);
          })
          .then(function (datamodelResult) {
            $scope.$parent.datamodel.nodetypes = datamodelResult.nodetypes;
            $scope.$parent.datamodel.categories = datamodelResult.categories;
            $scope.$parent.datamodel.packages = datamodelResult.packages;
            $scope.$parent.datamodel.methods = datamodelResult.methods;
            $scope.$parent.datamodel.listOfValues = datamodelResult.listOfValues;
            $scope.$parent.datamodel.reports = datamodelResult.reports;
            $scope.$parent.setNodetypesStyles();
            $scope.$parent.makeGraph(datamodelResult.packages, datamodelResult.nodetypes);
            $scope.$emit("reloadDatamodel");
            $scope.$emit('nodetypeUpdate', _.find($scope.$parent.datamodel.nodetypes, { "name": $scope.sourcenodetype.name }), 'tabs');
          })
        // close & reset modal
        $scope.creationInProcess = false;
        $("#nodetypeCreationModal").modal("hide");
        $scope.cancel();
      } else {
        if ($scope.isrelationship) {
          // prevent linkname with spaces 
          $scope.link = $scope.link.replace(/\s/g, '');
          type.elementType = "relationship";
          type.rel = {};
          type.rel.source = $scope.sourcenodetype.id;
          type.rel.target = $scope.targetnodetype.id;
          type.rel.linkname = $scope.link;
          type.rel.cardinality = $scope.cardinality;
        } else {
          type.elementType = "node";
        }
        const addNodetypeResult = await datamodelModel.nodetypes.add(nodetypeName, type);
        if (addNodetypeResult.message) {
          $scope.creationInProcess = false;
          return Notification.error({
            title: `Error`, message: addNodetypeResult.message,
          });
        }
        //  Update Translation File
        await updateTranslationFile(nodetypeName);
        if ($scope.isrelationship && $scope.createTab) {
          const relationshipId = addNodetypeResult.nodetype.id;
          await $scope.addTab($scope.sourcenodetype.name, relationshipId, $scope.tabName, $scope.tabAttachmentMode);
        }
        // reload full schema
        await datamodelModel.getDatamodel()
          .catch(function (e) {
            $scope.creationInProcess = false;
            console.error(e);
          })
          .then(function (datamodelResult) {
            $scope.$parent.datamodel.nodetypes = datamodelResult.nodetypes;
            $scope.$parent.datamodel.categories = datamodelResult.categories;
            $scope.$parent.datamodel.packages = datamodelResult.packages;
            $scope.$parent.datamodel.methods = datamodelResult.methods;
            $scope.$parent.datamodel.listOfValues = datamodelResult.listOfValues;
            $scope.$parent.datamodel.reports = datamodelResult.reports;
            $scope.$parent.setNodetypesStyles();
            $scope.$parent.makeGraph(datamodelResult.packages, datamodelResult.nodetypes);
            $scope.$emit("reloadDatamodel");
            if (_.get($scope, 'sourcenodetype.name')) {
              $scope.$emit('nodetypeUpdate', _.find($scope.$parent.datamodel.nodetypes, { "name": $scope.sourcenodetype.name }), 'tabs');
            }
          })
        // close & reset modal
        $scope.creationInProcess = false;
        $("#nodetypeCreationModal").modal("hide");
        $scope.cancel();
      }

    }

    $scope.addTab = (nodetypeName, relationshipId, name, attachMode) => {
      tabName = name.replace(/\s/g, '');
      const newTab = {
        name: tabName,
        label: name,
        tabContentType: $scope.undirectedRelationship ? "undirectedRelationship" : "relatedObject",
        relationships: relationshipId,
        attachMode,
      };
      return datamodelModel.nodetypes.ui.tabs.add(
        nodetypeName,
        newTab,
      ).catch(function (e) {
        console.error(e);
        Notification.error('New tab not created');
        return e;
      }).then(function (result) {
        Notification.success('Nodetype tab created');
        return result;
      })
    }
  })


  .controller('datamodelController', function ($scope, $rootScope, $translate, datamodelModel, Notification, $location) {
    $location.search({ page: 'datamodel' });
    // cytoscape graph
    $scope.nodetype = {};
    $scope.showGraph = true;
    $scope.toggleGraph = () => {
      $scope.showGraph = !$scope.showGraph;
    }


    $scope.gennerateDiffReport = () => {
      if ($scope.selectedDiffBackup && $scope.selectedDiffBackup != '') {
        // call the report
        datamodelModel.runDiffDatamodelReport($scope.selectedDiffBackup.split('.')[0]).then((result) => {
          // print the report
          $scope.diffBkDm = result;
        })

      } else {
        Notification.warning('Select a backup first');
      }
    }

    // event for nodetype selection
    $scope.selectNodetype = ({ nodetypeId, source, target }) => {
      const nodetype = _.find($scope.datamodel.nodetypes, { "id": nodetypeId });
      if (nodetype) {
        if (nodetype.elementType === 'relationship') {
          if (source) nodetype.sourceNodetype = source;
          if (target) nodetype.targetNodetype = target;
        }
        $scope.datamodel.openItem = nodetype;
        $scope.datamodel.itemSelected = true;
        $scope.datamodel.packageSelected = false;
        $scope.datamodel.methodSelected = false;
        $scope.selectedNodetype = $scope.datamodel.openItem;
        $scope.$apply();
      } else {
        console.info('nodetype not found');
      }
    }

    // event for package selection
    $scope.selectPackage = function (packageName) {
      // $scope.datamodel.openItem = _.find($scope.datamodel.nodetypes, { "name": packageName })
      $scope.datamodel.itemSelected = false;
      $scope.datamodel.packageSelected = true;
      $scope.datamodel.methodSelected = false;
    }

    // event for method selection
    $scope.selectMethod = function (methodName) {
      $scope.datamodel.itemSelected = false;
      $scope.datamodel.packageSelected = false;
      $scope.datamodel.methodSelected = true;
    }

    $scope.createNodetype = function () {
      $('body').trigger('click');
      $("#nodetypeCreationModal").modal();
      // open nodetype creation modal
    }

    // element type filter management
    $scope.filterNodetypes = false;
    $scope.filterRelationships = false;
    $scope.filterViews = false;
    $scope.filterPolynodes = false;

    $scope.switchFilter = function (elementTypeFilter) {
      $scope[elementTypeFilter] = !$scope[elementTypeFilter];
    }

    $scope.filteringNodetypes = function (element) {
      switch (element.elementType) {
        case "node":
          return !$scope.filterNodetypes;
        case "relationship":
          return !$scope.filterRelationships;
        case "view":
          return !$scope.filterViews;
        case "polynode":
          return !$scope.filterPolynodes;
        default:
          return false;
      }
    }

    $scope.setNodetypesStyles = function () {
      // set nodetype directly in scope variables for UI style
      $scope.datamodel.nodetypes = $scope.datamodel.nodetypes.map(function (elt) {
        var nodetype = elt;
        nodetype.isNode = false;
        nodetype.isRelationship = false;
        nodetype.isView = false;
        nodetype.isPolynode = false;
        switch (elt.elementType) {
          case "relationship":
            nodetype.isRelationship = true;
            break;
          case "view":
            nodetype.isView = true;
            break;
          case "node":
            nodetype.isNode = true;
            break;
          case "polynode":
            nodetype.isPolynode = true;
            break;
          default:
            break;
        }
        return nodetype
      });
    }

    $scope.centerDatamodelElement = (item) => {
      if (item.isNode) {
        $scope.selectNode($scope.cy.$(`#${item.id}`));
        $scope.cy.center(`#${item.id}`);
      } else if (item.isRelationship) {
        $scope.selectEdge($scope.cy.$(`.${item.id}`));
        $scope.cy.center(`.${item.id}`);
      }
    }

    $scope.makeGraph = (packages, nodetypes) => {
      $rootScope.$broadcast('getPermissions');
      // load graph datamodel
      var formattedPackages = packages.map((pack) => {
        return setPackage(pack);
      })

      function addMissingPackage(packageName) {
        const package = {
          id: packageName,
          name: packageName,
        }
        formattedPackages.push(setPackage(package));
      }

      function setPackage(pack) {
        var node = {};
        node.pack = pack;
        node.selectable = true;
        node.classes = "compound package";
        node.data = {
          id: pack.id,
          name: pack.name,
          image: null,
          package: true,
        }
        return node;
      }

      // build graph content
      var elements = [];
      nodetypes.forEach((elt) => {
        if (elt.core && elt.hidden) return;

        var node = {};
        node.nodetype = elt;
        node.data = {
          id: elt.id,
          nodetypeId: elt.id,
          name: elt.name,
          linkName: `${elt.name}\n[:${elt.linkName}] | ${elt.cardinality || 'NtoN'} `,
          image: elt.ui.defaultThumbnail,
        };
        switch (elt.elementType) {
          case 'relationship':
            if (!elt.directions) return;

            elt.directions.forEach((direction, index) => {
              node.group = 'edges';
              node.name = node.data.linkName;
              node.classes = `${elt.id}`;
              node.data.source = direction.source;
              node.data.target = direction.target;
              node.data.id = `${elt.id}(${index})`;

              if (elt.relType && elt.relType === 'property') {
                node.data.relType = 'property';
              }
              const distinctNode = angular.copy(node);
              elements.push(distinctNode);
            });
            break;
          case ("node"):
            node.group = "nodes";
            node.classes = "nodetype";
            const package = formattedPackages.find((p) => p.data.name === elt.package);
            if (package) {
              node.data.parent = package.data.id;
            } else {
              addMissingPackage(elt.package);
              node.data.parent = elt.package;
            }
            elements.push(node);
            break;
          case ("view"):
            node.group = "nodes";
            node.classes = "views";
            node.cl;
            node.data.parent = elt.package;
            elements.push(node);
            break;
          default:
            node.group = "nodes";
            node.data.parent = elt.package;
            elements.push(node);
            break;
        }

      })

      // add packages nested nodes
      elements = elements.concat(formattedPackages)
      elements = elements.map((elt) => {
        if ((elt.data.image == undefined) || (elt.data.image == null)) {
          elt.data.image = "images/emptyLogo.png";
        }
        return elt;
      })

      $scope.toggleGraphFullScreen = () => {
        $scope.showGraphFs = !$scope.showGraphFs;
        $(() => {
          $scope.cy.fit();
        });
      }

      // build graph view
      $scope.cy = cytoscape({
        container: document.getElementById('datamodelGraph'), // container to render in
        elements: elements,
        selectionType: 'single',
        boxSelectionEnabled: true,
        style: [ // the stylesheet for the graph
          {
            selector: 'node',
            style: {
              'shape': 'ellipse',
              'label': 'data(name)',
              'z-index': 2,
              'background-color': '#337ab7',
              'border-width': 0,
              'background-opacity': .8,
              'width': 120,
              'height': 120,
              'font-size': 28,
              'font-weight': 'bold',
              'background-width': 80,
              'background-height': 80,
              'text-valign': "bottom",
              'text-wrap': "wrap",
              'background-image': 'data(image)',
            }
          },
          {
            selector: 'node:selected',
            style: {
              'background-color': '#5cc85c',
            }
          },
          {
            selector: 'node.obfuscated',
            style: {
              'background-opacity': .8,
            }
          },
          {
            selector: 'node.compound',
            style: {
              'shape': 'cutrectangle',
              'label': 'data(name)',
              'z-index': 1,
              'font-weight': 'normal',
              'font-size': 50,
              'background-color': '#E6F8FA',
              'background-opacity': .5,
              'text-valign': "top",
              'text-wrap': "wrap",
              'border-width': 2,
              'border-style': 'solid',
              'border-opacity': 1,
              'border-color': 'black',
            }
          },
          {
            selector: '.package:selected',
            style: {
              'background-color': '#f0ad4e',
              'background-opacity': .8,
            }
          },
          {
            selector: '$node:selected > node',
            style: {
              'background-color': '#f0ad4e',
              'background-opacity': .8,
            }
          },
          {
            selector: '$node > node ',
            css: {
              'padding-top': '10px',
              'padding-left': '10px',
              'padding-bottom': '10px',
              'padding-right': '10px',
              'text-valign': 'top',
              'text-halign': 'center',
              'border-width': 2,
              'border-style': 'solid',
              'border-opacity': 1,
              'border-color': 'black',
              'label': 'data(name)',
              'background-opacity': .5,
            }
          },
          {
            selector: '$node > node:selected',
            css: {
              'background-opacity': .8,
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 2,
              'background-opacity': 0.8,
              'text-wrap': 'wrap',
              'line-color': '#ccc',
              'label': 'data(linkName)',
              'target-arrow-color': '#000',
              'target-arrow-shape': 'triangle',
              'source-arrow-color': '#000',
              'z-index': 1,
              'curve-style': 'bezier',
              'control-point-step-size': '150px',
              'text-rotation': 'autorotate',
            }
          },
          {
            selector: 'edge[relType = "property"]',
            style: {
              'width': 4,
              'line-color': '#FF0000',
              'line-style': 'dashed',
              'label': 'data(linkName)',
              'target-arrow-color': '#FF0000',
              'target-arrow-shape': 'triangle',
              'source-arrow-color': '#FF0000',
              'z-index': 1,
              'curve-style': 'bezier',
              'text-rotation': 'autorotate',
            }
          },
          {
            selector: 'edge:selected',
            style: {
              'width': 10,
              'text-margin-y': '0px',
              'font-size': '2em',
              'line-color': '#b22',
            }
          },
          {
            selector: 'edge.obfuscated',
            style: {
              'width': 2,
              'line-color': '#ccc',
              'background-opacity': 0.4,
              'color': '#AAA'
            }
          },
          {
            selector: 'edge.inbound',
            style: {
              'width': 8,
              'line-color': '#f0ad4e',
            }
          },
          {
            selector: 'edge.outbound',
            style: {
              'width': 8,
              'line-color': '#5cb85c',
            }
          },
          {
            selector: 'edge.edgPropHighlight',
            style: {
              'width': 15,
            }
          },
          {
            selector: 'node.inbound',
            style: {
              'background-color': '#f0ad4e',
            }
          },
          {
            selector: 'node.outbound',
            style: {
              'background-color': '#d9534f',
            }
          },
        ],

        layout: {
          fit: true,
          name: 'dagre',
          avoidOverlap: true,
          animate: true,
          padding: 5,
          spacingFactor: 1.5,
        },
        wheelSensitivity: 0.2,
        maxZoom: 3,
        minZoom: .1,
      });


      $(() => {
        setTimeout(() => {
          $scope.cy.resize()
          $scope.cy.fit()
        }, 1000);
      });

      // update UI when tapping on graph
      $scope.cy.on('tap', function (evt) {
        if (evt.target == $scope.cy) {
          $scope.cy.$("*").removeClass("selected");
          $scope.cy.$("*").removeClass("obfuscated");
          $scope.cy.$("*").removeClass("outbound");
          $scope.cy.$("*").removeClass("inbound");
        }
      });

      // update UI when tapping on a node
      $scope.cy.on('tap', 'node', function (evt) {
        var node = evt.target;
        $scope.selectNode(node);
      });

      $scope.selectNode = (node) => {
        if (!node.data().package) {
          $scope.cy.$("*").addClass("obfuscated");
          $scope.cy.$("*").removeClass("outbound");
          $scope.cy.$("*").removeClass("inbound");
          $scope.cy.$("*").unselect();
          node.removeClass("obfuscated");
          node.neighborhood().removeClass("obfuscated");
          node.outgoers('[id != "' + node.id() + '"]').addClass("outbound");
          node.incomers('[id != "' + node.id() + '"]').addClass("inbound");
          node.select();
          $scope.selectNodetype(node.data());
          const items = node.neighborhood().map((i) => {
            return $scope.$parent.datamodel.nodetypes.find((n) => {
              return n.id === i.data().id;
            });
          });
          $scope.relatedNodetypes = items.filter((i) => i?.elementType === 'node');
          $scope.relatedRelationships = items.filter((i) => {
            return i?.elementType === 'relationship';
          });
          $scope.relatedNodetype = undefined;
          $scope.relatedRelationship = undefined;
        }
      };
      // update UI when tapping on an edge
      $scope.cy.on('tap', 'edge', function (evt) {
        const edge = evt.target;
        $scope.selectEdge(edge);
      });

      $scope.selectEdge = (edge) => {
        if (!edge.data()) {
          return;
        }
        $scope.cy.$("*").addClass("obfuscated");
        $scope.cy.$("*").removeClass("outbound");
        $scope.cy.$("*").removeClass("inbound");
        $scope.cy.$("*").unselect();
        edge.removeClass("obfuscated");
        edge.neighborhood().removeClass("obfuscated");
        edge.select();
        $scope.selectNodetype(edge.data());
        const source = $scope.$parent.datamodel.nodetypes.find(n => n.id === edge.source().data().id);
        const target = $scope.$parent.datamodel.nodetypes.find(n => n.id === edge.target().data().id);
        $scope.relatedNodetypes = _.uniqBy([source, target], '_id');
        $scope.relatedRelationships = [];
        $scope.relatedNodetype = undefined;
        $scope.relatedRelationship = undefined;
      }

      $scope.selectPropertyEdge = (edge) => {
        $scope.cy.$("*").removeClass("edgPropHighlight");
        edge.addClass("edgPropHighlight");
        $scope.selectNode($scope.cy.$("#" + edge.data().source));
      }

      var coreGraphCxt = $scope.cy.cxtmenu({
        selector: 'core', // elements matching this cytoscape.js selector will trigger cxtmenus
        commands: [ // an array of commands to list in the menu or a function that returns the array
          {
            fillColor: '#5cb85c', // optional: custom background color for item
            content: 'Add new nodetype', // html/text content to be displayed in the menu
            select: function (ele, pos) { // a function to execute when the command is selected
              $scope.$broadcast('startCreatingNodetype', {
                relAndRelated: false,
                isrelationship: false,
                hasPackage: false,
              });
              $("#nodetypeCreationModal").modal();
            }
          }
        ]
      })

      var compoundGraphCxt = $scope.cy.cxtmenu({
        menuRadius: 130,
        selector: 'node.compound', // elements matching this cytoscape.js selector will trigger cxtmenus
        commands: [ // an array of commands to list in the menu or a function that returns the array

          {
            fillColor: '#5cb85c', // optional: custom background color for item
            content: 'Add new nodetype in package', // html/text content to be displayed in the menu
            select: function (ele, pos) { // a function to execute when the command is selected
              // preset package
              $scope.selectedPackage = _.find($scope.$parent.datamodel.packages, { "id": ele.data().id });
              $scope.$apply();
              $scope.$broadcast('startCreatingNodetype', {
                relAndRelated: false,
                isrelationship: false,
                hasPackage: true
              });
              // open modal
              $("#nodetypeCreationModal").modal();
            }
          }, {
            fillColor: '#f0ad4e', // optional: custom background color for item
            content: 'Remove Package', // html/text content to be displayed in the menu
            select: function (ele, pos) { // a function to execute when the command is selected
              let warnTitle;
              var nodetypeName = ele.data().name;
              if ($scope.cy.$(':selected').length > 0) {
                warnTitle = `Do you really want to delete these nodetypes ?`;
              } else {
                warnTitle = `Do you really want to delete ${nodetypeName} nodetype ?`;
              }
              // preset package
              $scope.$apply();
              Swal.fire({
                title: 'Are you sure you want to remove this package?',
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, remove it',
              }).then((result) => {
                const proms = [];
                if (result.value) {

                  const ids = [];
                  if ($scope.cy.$(':selected').length > 0) {
                    $scope.cy.$(':selected').forEach((el) => {
                      if (el.data().package) {
                        ids.push(el.id())
                      }
                    })
                  } else {
                    ids.push(ele.data().id);
                  }

                  ids.forEach((id) => {
                    proms.push(datamodelModel.packages.remove(id))
                  })
                  Promise.all(proms).then(async (values) => {
                    const dm = await datamodelModel.getDatamodel()
                    // restore datamodel variables
                    $scope.$parent.datamodel.nodetypes = dm.nodetypes;
                    // rebuild the graph
                    $scope.setNodetypesStyles();
                    $scope.makeGraph(dm.packages, dm.nodetypes);
                    // unselect the deleted nodetype
                    $scope.$parent.datamodel.openItem = null;
                    $scope.$parent.datamodel.itemSelected = false;
                    $scope.$parent.datamodel.packageSelected = false;
                    $scope.$parent.datamodel.methodSelected = false;
                    $scope.selectedPackage = null;
                  })
                }
              });
            }
          }
        ]
      })
      var nodeGraphCxt = $scope.cy.cxtmenu({
        menuRadius: 160,
        selector: 'node.nodetype', // elements matching this cytoscape.js selector will trigger cxtmenus
        commands: [ // an array of commands to list in the menu or a function that returns the array
          {
            fillColor: '#5cb85c', // optional: custom background color for item
            content: 'Create Related Nodetype', // html/text content to be displayed in the menu
            select: function (ele) { // a function to execute when the command is selected
              $scope.selectedPackage = _.find($scope.$parent.datamodel.packages, { "id": parseInt(ele.data().parent) });
              $("#nodetypeCreationModal").modal(); // = Opens the nodetype creation process preconfigured with "relationship" and starting point predefined
              $scope.$broadcast('startCreatingNodetype', {
                relAndRelated: true,
                isrelationship: true,
                sourceId: ele.data().id,
              })
            }
          }, {
            fillColor: '#337ab7', // optional: custom background color for item
            content: 'Create Relationship', // html/text content to be displayed in the menu
            select: function (ele) { // a function to execute when the command is selected
              $("#nodetypeCreationModal").modal(); // = Opens the nodetype creation process preconfigured with "relationship" and starting point predefined
              $scope.$broadcast('startCreatingNodetype', {
                isrelationship: true,
                sourceId: ele.data().id,
                undirectedRelationship: $scope.undirectedRelationship,
              })
            }
          }, {
            fillColor: '#f0ad4e', // optional: custom background color for item
            content: 'Delete Nodetype', // html/text content to be displayed in the menu
            select: function (ele) { // a function to execute when the command is selected,
              let warnTitle;
              var nodetypeName = ele.data().name;
              if ($scope.cy.$(':selected').length > 0) {
                warnTitle = `Do you really want to delete these nodetypes ?`;
              } else {
                warnTitle = `Do you really want to delete ${nodetypeName} nodetype ?`;
              }
              // `ele` holds the reference to the active element
              Swal.fire({
                title: warnTitle,
                type: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes'
              }).then(async (result) => {
                const proms = [];
                if (result.value) {
                  const ids = [];
                  if ($scope.cy.$(':selected').length > 0) {
                    $scope.cy.$(':selected').forEach((el) => {
                      if (!el.data().package && !el.data().source) {
                        ids.push(el.id())
                      }
                    })
                  } else {
                    ids.push(ele.data().id);
                  }
                  ids.forEach((id) => {
                    proms.push(datamodelModel.nodetypes.remove(id))
                  })
                  Promise.all(proms).then(async (values) => {
                    const dm = await datamodelModel.getDatamodel()
                    // restore datamodel variables
                    $scope.$parent.datamodel.nodetypes = dm.nodetypes;
                    // rebuild the graph
                    $scope.setNodetypesStyles();
                    $scope.makeGraph(dm.packages, dm.nodetypes);
                    // unselect the deleted nodetype
                    $scope.$parent.datamodel.openItem = null;
                    $scope.$parent.datamodel.itemSelected = false;
                    $scope.$parent.datamodel.packageSelected = false;
                    $scope.$parent.datamodel.methodSelected = false;
                    $scope.selectedPackage = null;
                  })
                } else {
                  console.info(nodetypeName + " nodetype deletion cancelled!");
                }
              });

            }
          }

        ]
      })
    }

    $scope.loadDatamodelData = () => {
      $scope.$emit("reloadDatamodel");
    };

    setTimeout(() => {
      $scope.setNodetypesStyles();
      $scope.makeGraph($scope.datamodel.packages, $scope.datamodel.nodetypes);
    }, 500);

    $scope.$on('translateUpdatedProps', async () => {
      try {
        await $translate.use($rootScope.appContext.user.language.key).then((res2) => {
        });
      } catch (error) {
        console.error("error", error)
      }
    })
  })
