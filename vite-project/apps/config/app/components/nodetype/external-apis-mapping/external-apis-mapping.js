angular.module('app.ganister.config.models.nodetypes.externalAPIsMapping', [])
  .controller('externalAPIsMappingController', function ($scope, datamodelModel, Notification) {
    $scope.nodetype = $scope.datamodel.openItem;

    //  Config External APIs
    $scope.configExternalAPIs = [{
      name: 'github',
      properties: ['owner', 'repo'],
      img: 'github.png',
      info: `In order to enable the Github integration you need to have a GitHub Token which allows to access the private token accounts. Property in .env file is GITHUB_TOKEN`,
    }, {
    //   name: 'gitlab',
    //   properties: ['owner', 'repo'],
    //   img: 'gitlab.png',
    //   info: `In order to enable the Gitlab integration you need to have a Gitlab Token which allows to access the private token accounts. Property in .env file is GITLAB_TOKEN`,
    // }, {
      name: 'element14',
      properties: ['term'],
      img: 'element14logo.png',
      info: `To enable Element 14, add your API key to the .env file with property ELEMENT14_API_KEY`,
    }, {
      name: 'ihs',
      img: 'IHSmarkit.png',
      properties: ['partNumber', 'manufacturer'],
      info: `IHS requires the following properties in your .env file IHS_USERNAME/IHS_PASSWORD`,
    }, {
      name: 'z2Data',
      img: 'z2Logo.png',
      properties: ['partNumber'],
      info: `z2Data API key is required. Set it in the .env file with property name : Z2DATA_API_KEY`,
    }];

    //  Get Nodetype's External APIs
    const getNodetypeExternalAPIs = () => {
      $scope.nodetypeExternalAPIs = _.get($scope.nodetype, 'externalAPIs', []);
      $scope.configExternalAPIs.filter((api) => !$scope.nodetypeExternalAPIs.find((a) => a.name === api.name)).map((api) => {
        const { name } = api;
        $scope.nodetypeExternalAPIs.push({ name, enabled: false, mapping: {} });
      });
      $scope.nodetypeExternalAPIs = $scope.nodetypeExternalAPIs.map((nodetypeExternalAPI) => {
        nodetypeExternalAPI.info = _.find($scope.configExternalAPIs, { 'name': nodetypeExternalAPI.name }).info;
        nodetypeExternalAPI.img = _.find($scope.configExternalAPIs, { 'name': nodetypeExternalAPI.name }).img;
        return nodetypeExternalAPI;
      });
    }

    getNodetypeExternalAPIs();


    //  Update External API Request
    $scope.updateExternalAPI = async (externalAPI) => {
      try {
        const result = await datamodelModel.nodetypes.externalAPIs.update(
          $scope.nodetype.name,
          externalAPI,
        );
        if (result.error) return Notification.error({
          title: 'Cannot Update External API',
          message: result.error.message,
        });
        return Notification.success({ message: 'External API updated', replaceMessage: true });
      } catch (error) {
        console.error(error);
        return Notification.error({
          title: 'Cannot Update External API',
          message: error.message,
        });
      }
    };

    const columnDefs = [{
      headerName: "apiProperty",
      field: "apiProperty",
      editable: true
    },
    {
      headerName: "property",
      field: "property",
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: $scope.nodetype.properties.map((p) => p.name)
      },
    }];

    $scope.selectedAPI;
    $scope.onAPIChange = () => {
      if ($scope.selectedAPI) {
        const apiDef = $scope.configExternalAPIs.find((api) => api.name === $scope.selectedAPI.name);
        const rowData = [];
        apiDef.properties.map((apiProperty) => {
          const property = $scope.selectedAPI.mapping[apiProperty];
          rowData.push({ apiProperty, property });
        });
        $scope.externalAPIsGridOptions.api.setRowData(rowData);
      }
    }

    $scope.externalAPIsGridOptions = {
      defaultColDef: {
        resizable: true
      },
      animateRows: true,
      columnDefs: [],
      rowData: [],
      onGridReady: () => {
        if ($scope.externalAPIsGridOptions.api) $scope.externalAPIsGridOptions.api.setColumnDefs(columnDefs);
      },
      onCellValueChanged: (params) => {
        $scope.externalAPIsGridOptions.api.forEachNode(({ data }) => $scope.selectedAPI.mapping[data.apiProperty] = data.property);
        datamodelModel.nodetypes.externalAPIs.update($scope.nodetype.name, $scope.selectedAPI).then((result) => {
          const nodetypeIndex = $scope.datamodel.nodetypes.findIndex(item => item.id === result.nodetype.id);
          $scope.datamodel.nodetypes[nodetypeIndex] = result.nodetype;
          Notification.success('External API Mapping Updated');
        });
      },
    }

    $scope.$on('nodetypeMainUpdate', (event, nodetype) => {
      $scope.nodetype = nodetype;
      getNodetypeExternalAPIs();
      const column = columnDefs.find((c) => c.field === 'property');
      column.cellEditorParams.values = $scope.nodetype.properties.map((p) => p.name);
      $scope.externalAPIsGridOptions.api.setColumnDefs(columnDefs);
    });
  });