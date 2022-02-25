angular.module('app.ganister.tabs.node.nodeFormTabs.externalAPIs.element14.searchTerm', [
  'app.ganister.externalAPIs.element14',
  'ui-notification',
]).controller('externalAPIsElement14SearchTermController', ($rootScope, $scope, Notification, element14Model) => {
  $scope.test = 'Element 14 Search Term Controller';

  const externalAPIsDM = _.get($scope.nodetype, 'externalAPIs', []);
  const externalAPIDM = externalAPIsDM.find((api) => api.name === $scope.rel.externalAPI);

  $scope.gridOptions = {
    defaultColDef: {
      // allow every column to be aggregated
      enableValue: true,
      // allow every column to be grouped
      enableRowGroup: true,
      // allow every column to be pivoted
      enablePivot: true,
      resizable: true,
      sortable: true,
    },
    sideBar: true,
    groupDefaultExpanded: -1,
    columnDefs: [],
    rowHeight: 80,
    rowData: [],
    groupUseEntireRow: true,
    angularCompileRows: true,
  };
  const imageUrl = 'https://uk.farnell.com/productimages/standard/en_GB'
  const element14Renderer = (field) => {

    switch (field) {
      case 'image':
        return (params) => {
          if (params.value) {
            return `<img style='max-height:72px;max-width:200px;' value='${params.value.baseName}' class='img-responsive' src='${imageUrl}${params.value.baseName}'/>`
          } else {
            return '';
          }
        };
      case 'datasheets':
        return (params) => {
          if (params.value && params.value.length > 0) {
            return `<a href='${params.value[0].url}' target='_blank'>${params.value[0].url}</a>`
          } else {
            return ''
          }
        };
      case 'attributes':
        return (params) => {
          if (params.value) {
            const attributes = params.value.map((attr) => {
              return `<div style='line-height: 20px;' >${attr.attributeLabel}: ${attr.attributeValue}</div>`
            });
            const attributesTitle = params.value.map((attr) => {
              return `${attr.attributeLabel}: ${attr.attributeValue}`
            });
            return `<div title="${attributesTitle.join('\n')}">
            ${attributes.join(' ')}
            </div>`
          } else {
            return '';
          }
        };
      case 'prices':
        return (params) => {
          if (params.value) {
            const pricetags = params.value.map((price) => {
              return `<div style='line-height: 22px;' >From ${price.from} to ${price.to} = ${price.cost}</div>`
            })
            const priceTitle = params.value.map((price) => {
              return `From ${price.from} to ${price.to} = ${price.cost}`
            });
            return `<div title="${priceTitle.join('\n')}">
            ${pricetags.join(' ')}
            </div>`
          } else {
            return '';
          }
        };
      default:
        return (params) => {
          if (['string', 'number', 'boolean'].includes(typeof params.value)) {
            return params.value;
          } else {
            return '';
          }
        }
    }

  }

  $scope.fetchData = async () => {
    const { term } = externalAPIDM.mapping;
    if (!term) {
      $scope.$emit("objCountUpdate", $scope.rel.name, 0);
      return console.warn('Cannot Fetch Products :"term" is not mapped');
    }
    if (!$scope.node.properties[term]) {
      $scope.$emit("objCountUpdate", $scope.rel.name, 0);
      return console.warn('Cannot Fetch Products :"term" is empty');
    }
    const offset = 0;
    const numberOfResults = 100;
    const storeInfoId = "uk.farnell.com";
    const { data, error, message } = await element14Model.searchTerm(numberOfResults, offset, storeInfoId, $scope.node.properties[term]);
    if (error) return Notification.error(message);
    if (!_.isEmpty(data)) {
      const columnDefs = Object.keys(data[0]).map((key) => ({
        headerName: key,
        field: key,
        cellRenderer: element14Renderer(key),
        // autoHeight:true,
      }));
      $scope.gridOptions.api.setColumnDefs(columnDefs);
      $scope.gridOptions.api.setRowData(data);
    } else {
      $scope.gridOptions.api.setRowData([]);
    }
    $scope.$emit("objCountUpdate", $scope.rel.name, data.length);
  };
  $scope.fetchData();

  $scope.$on('refreshTabContent', () => {
    $scope.fetchData();
  })
});