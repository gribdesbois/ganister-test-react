
/* globals angular */
angular.module('app.ganister.config.models.healthReport', [
  'app.ganister.config.models',
  'chart.js',
])
  .controller('healthReportController', function ($scope, $http, Notification, $location) {
    $location.search({ page: 'healthReport' });


    // ██╗   ██╗ █████╗ ██████╗ ██╗ █████╗ ██████╗ ██╗     ███████╗███████╗
    // ██║   ██║██╔══██╗██╔══██╗██║██╔══██╗██╔══██╗██║     ██╔════╝██╔════╝
    // ██║   ██║███████║██████╔╝██║███████║██████╔╝██║     █████╗  ███████╗
    // ╚██╗ ██╔╝██╔══██║██╔══██╗██║██╔══██║██╔══██╗██║     ██╔══╝  ╚════██║
    //  ╚████╔╝ ██║  ██║██║  ██║██║██║  ██║██████╔╝███████╗███████╗███████║
    //   ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝╚══════╝


    $scope.reports = [];
    $scope.assignmentLoading = true;
    $scope.cpuUsage = {
      type: 'line',
      data: [],
      labels: [],
      options: {
        tooltips: {
          callbacks: {
            title: function (tooltipItem, data) {
              return moment(tooltipItem.xLabel).format("DD/MM/YYYY HH:mm:SS");
            },
            label: function (tooltipItem) {
              return tooltipItem.yLabel + " %";
            }
          }
        },
        scales: {
          xAxes: [{
            type: 'time',
            time: {
              unit: 'hour'
            }
          }]
        },
        elements: {
          point: {
            radius: 6,
          },
          line: {
            tension: 0,
          }
        }
      },
    };

    $scope.nodesUsage = {
      type: 'line',
      data: [],
      labels: [],
      options: {
        tooltips: {
          callbacks: {
            title: function (tooltipItem, data) {
              return moment(tooltipItem.xLabel).format("DD/MM/YYYY");
            },
            label: function (tooltipItem) {
              return tooltipItem.yLabel + " nodes";
            }
          }
        },
        scales: {
          xAxes: [
            {
              type: 'time',
              distribution: 'linear',
              time: {
                unit: 'day',
                format: "DD/mm/YYYY",
              }
            }
          ],
        },
        elements: {
          point: {
            radius: 5,
          },
          line: {
            tension: 0,
          }
        }
      },
    };
    $scope.relationshipsUsage = {
      type: 'line',
      data: [],
      labels: [],
      options: {
        tooltips: {
          callbacks: {
            title: function (tooltipItem, data) {
              return moment(tooltipItem.xLabel).format("DD/MM/YYYY");
            },
            label: function (tooltipItem) {
              return tooltipItem.yLabel + " rels";
            }
          }
        },
        scales: {
          xAxes: [
            {
              type: 'time',
              distribution: 'linear',
              time: {
                unit: 'day',
                format: "DD/mm/YYYY",
              }
            }
          ],
        },
        elements: {
          point: {
            radius: 6,
          },
          line: {
            tension: 0,
          }
        }
      },
    };
    $scope.dbAnalytics = { nodes: [], relationships: [] };

    $scope.toDate = new Date(Date.now());
    $scope.fromDate = new Date(Date.now() - 86400000);

    $scope.dbToDate = new Date(Date.now());
    $scope.dbFromDate = new Date(Date.now() - (86400000 * 30));

    $scope.memoryUsage = {
      data: [],
      labels: [],
      options: {
        tooltips: {
          callbacks: {
            title: function (tooltipItem, data) {
              return moment(tooltipItem.xLabel).format("DD/MM/YYYY HH:mm:SS");
            },
            label: function (tooltipItem, data) {
              return Math.round(tooltipItem.yLabel * 100) / 100 + " MB";
            }
          }
        },
        scales: {
          xAxes: [
            {
              type: 'time',
              distribution: 'linear',
              time: {
                unit: 'hour',
                format: "DD/mm/YYYY HH:MM:SS",
              }
            }
          ],
          yAxes: [
            {
              display: true,
              ticks: {
                //max:100,
                beginAtZero: true   // minimum value will be 0.
              }
            }
          ],
        },
        elements: {
          point: {
            radius: 6,
          },
          line: {
            tension: 0,
          }
        }
      },
    };

    // ▄▄███▄▄·███████╗ ██████╗ ██████╗ ██████╗ ███████╗   ███████╗██╗   ██╗███╗   ██╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗███████╗
    // ██╔════╝██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝   ██╔════╝██║   ██║████╗  ██║██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝
    // ███████╗███████╗██║     ██║   ██║██████╔╝█████╗     █████╗  ██║   ██║██╔██╗ ██║██║        ██║   ██║██║   ██║██╔██╗ ██║███████╗
    // ╚════██║╚════██║██║     ██║   ██║██╔═══╝ ██╔══╝     ██╔══╝  ██║   ██║██║╚██╗██║██║        ██║   ██║██║   ██║██║╚██╗██║╚════██║
    // ███████║███████║╚██████╗╚██████╔╝██║     ███████╗██╗██║     ╚██████╔╝██║ ╚████║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║███████║
    // ╚═▀▀▀══╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚══════╝╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝



    $scope.runResolveMethod = (method, errorList, e) => {
      if (method) {
        e.report.button = '<i class="fas fa-spinner fa-spin"></i>';
        if (method === "listFix") {
          $scope.runResolveErrorsMethod(errorList);
        } else {
          $http.post(`/api/v0/healthReport/${method}`).then((result) => {
            if (result.status === 200) {
              const index = $scope.reports.findIndex(item => item.resolveMethod === method);
              $scope.reports[index] = result.data;
              Notification.success('Fixed');
            } else {
              Notification.error({ title: 'Error', message: result.data.message });
              $scope.reports = [];
            }
          });
        }
      } else {
        Notification.error('Resolved Method does not exist');
      }
    };

    $scope.runResolveErrorsMethod = (errorList) => {

      let returnedErrorList = [];
      const swalConfSet = [];
      errorList.forEach((error) => {
        if (error.correction) {
          let swalConf = {

          };
          switch (error.correction.action) {
            case 'addLifecycle':
            case 'addLifecycleDefaultState':
              swalConf = {
                text: 'Go to the ' + error.correction.nodetypeName + ' configuration to edit the lifecycle',
              }
              break;
            case 'stateMapping':
              const stateOptions = {};
              error.correction.availableStates.forEach((state) => {
                state = state.substring(1, state.length - 1);
                stateOptions[state] = state;
              });
              swalConf = {
                input: "select",
                inputOptions: stateOptions,
                title: "Mapping Correct state",
                text: error.correction.nodetypeName + " nodes with state " + error.correction.errorState + " will have your selection as new state",
                inputValidator: (value) => {
                  return new Promise((resolve, reject) => {
                    $http.post(`/api/v0/healthReport/mapLifecycleState/${error.correction.nodetypeName}/${error.correction.errorState}/${value}`)
                      .then(() => {
                        resolve();
                      })
                      .catch((err) => {
                        returnedErrorList.push(error);
                        resolve();
                      })
                  })
                }
              }
              break;
            default:
              break;
          }
          swalConfSet.push(swalConf);
        }
      });
      Swal.mixin({
        confirmButtonText: 'Next &rarr;',
        showCancelButton: true,
      }).queue(swalConfSet).then((result) => {
        console.info("done");
        $scope.loadReports();
        return
      });

    };

    $scope.refreshRessourcesGraph = () => {
      $http.get(`/api/v0/healthReport/ressources`).then((result) => {
        if (result.status !== 200) return Notification.error('Resource Logs not loaded correctly');
        Notification.success({ title: 'Success', message: 'Resources Logs loaded', delay: 3000 });
        $scope.cpuUsage.data = [[]];
        $scope.cpuUsage.data[0] = result.data.logs
          .map(log => ({ "x": log.time, "y": log.cpuUsage.system }))
          .filter(log => log.x > moment($scope.fromDate).valueOf() && log.x < moment($scope.toDate).valueOf());
        $scope.memoryUsage.data = [[]];
        $scope.memoryUsage.data[0] = result.data.logs
          .map(log => ({ "x": log.time, "y": (((log.memoryUsage.heapTotal / 1048576).toFixed(3)) / 1760) * 100 }))
          .filter(log => log.x > moment($scope.fromDate).valueOf() && log.x < moment($scope.toDate).valueOf());
      });
    }

    $scope.refreshDBAnalyticsGraph = () => {
      $http.get(`/api/v0/healthReport/dbAnalytics`).then((result) => {
        if (result.status !== 200) return Notification.error('DB Analytics Logs not loaded correctly');
        Notification.success({ title: 'Success', message: 'DB Analytics Logs loaded', delay: 3000 });
        $scope.dbAnalytics.nodes = [[]];
        $scope.dbAnalytics.relationships = [[]];
        $scope.dbAnalytics.nodes[0] = result.data.logs
          .map(log => ({ "x": log.timestamp, "y": log.nodes }))
          .filter(log => log.x > moment($scope.dbFromDate).valueOf() && log.x < moment($scope.dbToDate).valueOf());
        $scope.dbAnalytics.relationships[0] = result.data.logs
          .map(log => ({ "x": log.timestamp, "y": log.relationships }))
          .filter(log => log.x > moment($scope.dbFromDate).valueOf() && log.x < moment($scope.dbToDate).valueOf());
      });
    }

    $scope.loadErrorLog = () => {
      $http.get(`/api/v0/log/errors`).then((result) => {
        if (result.status === 200) {
          $scope.errors = result.data;
          $scope.errorsGrid.api.setRowData($scope.errors);
          Notification.success({ title: 'Success', message: 'Errors loaded', delay: 3000 });
        } else {
          Notification.error({ title: 'Error', message: 'Errors not loaded', delay: 3000 });
          $scope.errors = [];
        }
      });
    }

    $scope.deleteErrorLogs = () => {
      const rows = $scope.errorsGrid.api.getSelectedRows();
      rows.map((r) => {
        $http.delete(`/api/v0/log/errors/${r._id}`)
          .then((result) => {
            if (result.status === 200) return $scope.errorsGrid.api.updateRowData({ remove: [r] });
            Notification.error({ title: 'Error', message: 'Log not deleted', delay: 3000 });
          });
      })

    }

    $scope.errorsGrid = {
      defaultColDef: {
        resizable: true
      },
      animateRows: true,
      columnDefs: [
        {
          headerName: "Title",
          field: "error.title",
          pinned: 'left',
        },
        {
          headerName: "Code",
          field: "statusCode",
        },
        {
          headerName: "Message",
          field: "error.message",
        },
        {
          headerName: "Query",
          field: "error.query",
        },
        {
          headerName: "time",
          field: "time",
          valueFormatter: (params) => {
            return new Date(params.value).toLocaleDateString("fr-FR")
          }
        },
        {
          headerName: "Function Name",
          field: "error.functionName",
        },
        {
          headerName: "ID",
          field: "_id",
          hide: true,
        },
      ],
      rowSelection: "multiple",
      rowData: [],
      getRowNodeId: data => data._id,
      onGridReady: function () {
        $scope.loadErrorLog();
      },
    }

    //  Fetch Reports
    $scope.loadReports = () => {
      $scope.assignmentLoading = true;
      $http.get(`/api/v0/healthReport`).then((result) => {
        if (result.status === 200) {
          $scope.reports = result.data;
          Notification.success({ title: 'Success', message: 'Reports loaded', delay: 3000 });
        } else {
          Notification.error({ title: 'Error', message: 'Reports not loaded', delay: 3000 });
          $scope.reports = [];
        }
        $scope.assignmentLoading = false;
      });
    }

    // ██╗███╗   ██╗██╗████████╗
    // ██║████╗  ██║██║╚══██╔══╝
    // ██║██╔██╗ ██║██║   ██║   
    // ██║██║╚██╗██║██║   ██║   
    // ██║██║ ╚████║██║   ██║   
    // ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝   

    $scope.loadReports();
    $scope.refreshRessourcesGraph();
    $scope.refreshDBAnalyticsGraph();
  });