/* globals angular, swal */
angular.module('app.ganister.config.models.methods', [
  'ui.codemirror',
])
  .controller('methodController', function ($scope, datamodelModel, Notification, $location, $window, $rootScope) {
    $location.search({ page: 'methods' });

    // editor codemirror init
    $scope.enabled = true;
    $scope.methodSelected = false;
    $scope.openMethods = [];
    $scope.methods = $scope.datamodel.methods
    $scope.changePending = false;
    $scope.lastSavedContent = "";
    $rootScope.theme = "default";
    if ($window.localStorage.getItem("ganister_methodEditorTheme")) {
      $rootScope.theme = $window.localStorage.getItem("ganister_methodEditorTheme");
    }

    $scope.editorOptions = {
      lineWrapping: true,
      smartIndent: true,
      firstLineNumber: 1,
      lineNumbers: true,
      readOnly: true,
      theme: $rootScope.theme,
      gutters: ["CodeMirror-lint-markers"],
      lint: true,
      mode: "javascript",
      autoCloseBrackets: true,
    };

    $scope.gridOptions = {
      defaultColDef: {
        resizable: true,
      },
      columnDefs: [
        {
          headerName: 'Nodetype Name',
          field: 'nodetypeName'
        },
        {
          headerName: 'Trigger',
          field: 'trigger'
        },
        {
          headerName: 'Description',
          field: 'description'
        },
        {
          headerName: 'Params',
          field: 'params'
        }
      ],
    };

    $scope.openMethod = (method) => {
      $scope.selectMethod(method, !method.opened);
      return method.opened = true;
    }

    //#region HANDLE CTRL+S

    $scope.ctrlDown = false;
    $scope.ctrlKey = 17, $scope.vKey = 86, $scope.cKey = 67;

    $scope.keyDownFunc = ($event) => {
      if ($scope.ctrlDown && String.fromCharCode($event.which).toLowerCase() == 's') {
        $event.preventDefault();
        const selectedMethod = _.find($scope.methods, { 'selected': true });
        if (selectedMethod) {
          $scope.saveMethod(selectedMethod);
        }

      }
    };

    angular.element($window).bind("keyup", ($event) => {
      if ($event.keyCode == $scope.ctrlKey)
        $scope.ctrlDown = false;
      $scope.$apply();
    });

    angular.element($window).bind("keydown", ($event) => {
      if ($event.keyCode == $scope.ctrlKey)
        $scope.ctrlDown = true;
      $scope.$apply();
    });

    //#endregion HANDLE CTRL+S


    //#region HANDLE FORMATTING
    function getSelectedRange() {
      return { from: $scope._editor.getCursor(true), to: $scope._editor.getCursor(false) };
    }

    $scope.autoFormatSelection = () => {
      var range = getSelectedRange();
      $scope._editor.autoFormatRange(range.from, range.to);
    }

    $scope.commentSelection = (isComment) => {
      var range = getSelectedRange();
      $scope._editor.commentRange(isComment, range.from, range.to);
    }
    //#endregion HANDLE FORMATTING

    $scope.availableThemes = [
      "default", "ambiance", "blackboard", "cobalt", "eclipse", "midnight"
    ];

    $scope.switchTheme = async (themeName) => {
      $rootScope.theme = themeName;
      $window.localStorage.setItem("ganister_methodEditorTheme", themeName);
      $scope._editor.setOption('theme', themeName);
      $scope.editorOptions.theme = themeName;
    }



    $scope.selectMethod = async (method, opening = false) => {
      $scope.selectedMethod = method;
      if (opening) $scope.selectedMethod.serverCode = method.code;
      $scope.methods = await $scope.methods.map((method) => {
        method.selected = false;
        return method;
      });
      method.selected = true;
      $scope._doc.readOnly = false;

      $scope._doc.setValue(method.code)
      $scope._editor.setOption("readOnly", false);
      $scope.$apply();
      setTimeout(() => {
        $scope._editor.refresh();
      }, 1);
      $scope.methodUsedIn = [];
      $scope.datamodel.nodetypes.forEach((nodetype) => {
        const { methods = [], actions = [], lifecycle = {} } = nodetype;

        const triggeredMethods = methods.filter((m) => m.name === method.name);
        if (!_.isEmpty(triggeredMethods)) {
          triggeredMethods.forEach((method) => {
            const { trigger, description, params } = method;
            $scope.methodUsedIn.push({
              nodetypeName: nodetype.name,
              trigger,
              description,
              params: JSON.stringify(params),
            });
          })
        }

        const actionMethods = actions.filter((action) => {
          const { preClientMethod = '', postClientMethod = '', serverMethod = {} } = action;
          return [preClientMethod, postClientMethod, serverMethod].find((actionMethod) => {
            if (typeof actionMethod === 'string') {
              return actionMethod === method.name;
            }
            return actionMethod.name === method.name;
          });
        });
        if (!_.isEmpty(actionMethods)) {
          actionMethods.forEach((action) => {
            const { name, params } = action;
            $scope.methodUsedIn.push({
              nodetypeName: nodetype.name,
              trigger: 'action',
              description: name,
              params: JSON.stringify(params),
            });
          })
        }

        const { states = [], transitions = [] } = lifecycle;
        transitions.forEach((transition) => {
          const {
            server_pre = [],
            server_post = [],
            preMethods = [],
            postMethods = []
          } = transition;
          
          const sourceState = states.find((s) => s.id === transition.from);
          const targetState = states.find((s) => s.id === transition.to);
          const description = `Transition from '${sourceState.name}' to '${targetState.name}'`;

          [server_pre, server_post, preMethods, postMethods].forEach((transitionMethods, index) => {
            transitionMethods
              .filter((m) => m.name === method.name)
              .forEach((m) => {
                let trigger;
                switch (index) {
                  case 0:
                    trigger = 'server_pre';
                    break;
                  case 1:
                    trigger = 'server_post';
                    break;
                  case 2:
                    trigger = 'preMethods';
                    break;
                  case 3:
                    trigger = 'postMethods';
                    break;
                  default:
                    break;
                }

                $scope.methodUsedIn.push({
                  nodetypeName: nodetype.name,
                  trigger,
                  description,
                  params: JSON.stringify(m.params)
                });
              });
          });
        });
      });
      
      $scope.gridOptions.api.setRowData($scope.methodUsedIn);
      return method;
    }

    $scope.saveMethod = (method) => {
      // check if linter is ok
      let hasErrors = false;
      let hasWarnings = false;
      $scope._editor.state.lint.marked.map((itm) => {
        if (itm.className === "CodeMirror-lint-mark-error") {
          hasErrors = true;
        } else {
          hasWarnings = true;
        }
        return itm.__annotation;
      });

      if (hasErrors || hasWarnings) {
        const lintType = hasErrors ? 'Errors' : 'Warnings';
        Swal.fire({
          title: `This Method still contains ${lintType}?`,
          type: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, Save It'
        }).then((result) => {
          if (result.value) {
            $scope.save(method);
          }
        });
      } else {
        $scope.save(method);
      }
    }

    $scope.save = () => {
      $scope.selectedMethod.code = $scope._doc.getValue();
      datamodelModel.methods.update($scope.selectedMethod).then((result) => {
        if (result.error) {
          return Notification.error({
            title: 'Error: Method is not saved',
            message: result.message,
          });
        }
        $scope.selectedMethod.serverCode = $scope.selectedMethod.code;
        $scope.selectedMethod.dirty = false;
        $rootScope.$broadcast('updateMethods', $scope.methods);
        datamodelModel.restartServer();
        
        return Notification.success('Method has been saved');
      });
    }

    $scope.closeMethodTab = () => {

      if ($scope.selectedMethod.dirty) {
        Swal.fire({
          title: `This Method still contains unsaved changes, are you sure to close?`,
          text: 'Closing it will cancel any unsaved work.',
          type: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, Close It'
        }).then((result) => {
          if (result.value) {
            $scope.selectedMethod.code = $scope.selectedMethod.serverCode;
            delete $scope.selectedMethod.serverCode;
            // test if content has been saved
            $scope.selectedMethod.opened = false;
            const firstOpenedMethod = _.find($scope.methods, { 'opened': true })
            if (firstOpenedMethod) {
              $scope.selectMethod(firstOpenedMethod);
            } else {
              $scope.selectedMethod = null;
              $scope.methodUsedIn = false;
            }
          }
        });
      } else {
        $scope.selectedMethod.code = $scope.selectedMethod.serverCode;
        delete $scope.selectedMethod.serverCode;
        // test if content has been saved
        $scope.selectedMethod.opened = false;
        const firstOpenedMethod = _.find($scope.methods, { 'opened': true })
        if (firstOpenedMethod) {
          $scope.selectMethod(firstOpenedMethod);
        } else {
          $scope.selectedMethod = null;
          $scope.methodUsedIn = false;
        }
      }
    }


    $scope.removeMethod = () => {
      Swal.fire({
        title: 'Are you sure you want to remove this method?',
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, remove it'
      }).then((result) => {
        if (result.value) {
          datamodelModel.methods.remove($scope.selectedMethod.id).then((result) => {
            if (result.error) {
              return Notification.error({
                title: 'Error: Method is not removed',
                message: result.message,
              });
            }
            _.remove($scope.methods, { id: $scope.selectedMethod.id });
            $rootScope.$broadcast('updateMethods', $scope.methods);
            $scope.activeMethod = null;
          });
        }
      });
    }

    $scope.newMethod = () => {
      // sweetAlert popup for text entry
      Swal.fire({
        title: 'Enter the method name',
        input: 'text',
        inputClass: 'input-with-no-spaces',
        showCancelButton: true,
        inputValidator: (methodName) => {
          if (!methodName) {
            return 'You need to write something'
          }

          // create method
          datamodelModel.methods.add(methodName).then((result) => {
            $scope.methods.push(result.newMethod);
            $rootScope.$broadcast('updateMethods', $scope.methods);
            Notification.success('Your Method has been created');
            $scope.openMethod(result.newMethod);
          })
        }
      })
    }

    $scope.cancelMethodChanges = () => {
      $scope.selectedMethod.code = $scope.selectedMethod.serverCode;
      $scope._doc.setValue($scope.selectedMethod.code)
    }
    $scope.codemirrorLoaded = (_editor) => {

      // Editor part
      $scope._doc = _editor.getDoc();
      $scope._editor = _editor;

      $scope._doc.readOnly = true;

      // Options
      _editor.setSize("100%", "700px");
      $scope._doc.markClean();

      _editor.on("change", (val) => {

        $scope._doc.changeGeneration();
        $scope.selectedMethod.code = $scope._doc.getValue();
        $scope.selectedMethod.dirty = ($scope.selectedMethod.serverCode != $scope.selectedMethod.code);
      });
    };

    $scope.renameMethod = (method) => {
      Swal.fire({
        title: 'Rename Method',
        input: 'text',
        inputClass: 'input-with-no-spaces',
        showCancelButton: true,
        inputValidator: (methodName) => {
          if (!methodName) {
            return 'You need to write something';
          }
          method.name = methodName;

          datamodelModel.methods.update(method).then((result) => {
            if (!result || !result.updatedMethod) {
              const message = result ? result.message : 'An error occured.';
              return Notification.error(message);
            }
            const index = $scope.methods.findIndex((m) => m.id === method.id);
            $scope.methods.splice(index, 1, result.updatedMethod);
            $rootScope.$broadcast('updateMethods', $scope.methods);
            Notification.success('Your Method has been renamed');
          });
        }
      });
    };

    $(document).on('keypress', '.input-with-no-spaces', (e) => {
      if (e.which === 32) {
        Notification.warning('Spaces are not allowed in method name');
        return false;
      }
    });
  });