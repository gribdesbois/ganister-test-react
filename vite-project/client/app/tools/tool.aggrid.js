/* globals _, angular, */
angular.module('app.ganister.tool.aggrid', [
  'app.ganister.models.nodetypes',
])
  .service('agRenderMachine', function (Notification, nodesModel, $rootScope, helperFunctions, $translate) {
    const agRenderMachine = this;
    const showdownConverter = new showdown.Converter();
    const debounceMs = 1500;


    function humanFileSize(bytes, si) {
      const thresh = si ? 1000 : 1024;
      if (Math.abs(bytes) < thresh) {
        return `${bytes} B`;
      }
      const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
      let u = -1;
      do {
        bytes /= thresh;
        ++u;
      } while (Math.abs(bytes) >= thresh && u < units.length - 1);
      return `${bytes.toFixed(1)} ${units[u]}`;
    }

    function resolveNodetypeReference(params) {
      if (!params.data) return {};
      let nodetypeName;
      if (params.column && params.column.colId && params.column.colId.split('.')) {
        switch (params.column.colId.split('.')[0]) {
          case 'target':
            nodetypeName = params.data.target._type;
            propName = params.column.colId.split('.')[2];
            break;
          case 'source':
            nodetypeName = params.data.source._type;
            propName = params.column.colId.split('.')[2];
            break;
          default:
            nodetypeName = params.data._type;
            propName = params.column.colId.split('.')[1];
            break;
        }
      }
      const nodetype = _.find($rootScope.datamodel.nodetypes, { name: nodetypeName });
      const property = _.find(nodetype.properties, { "name": propName });
      return { nodetype, property };
    }




    agRenderMachine.getBooleanEditor = () => {
      // function to act as a class
      function CheckboxRenderer() { }

      CheckboxRenderer.prototype.init = function (params) {
        this.params = params;

        this.eGui = document.createElement('input');
        this.eGui.type = 'checkbox';
        this.params.column.colDef.editable ? delete this.eGui.disabled : this.eGui.disabled = "disabled";
        this.eGui.checked = params.value;

        this.checkedHandler = this.checkedHandler.bind(this);
        this.eGui.addEventListener('click', this.checkedHandler);
      }

      CheckboxRenderer.prototype.checkedHandler = function (e) {
        let checked = e.target.checked;
        let colId = this.params.column.colId;
        this.params.node.setDataValue(colId, checked);
      }

      CheckboxRenderer.prototype.getGui = function (params) {
        return this.eGui;
      }

      CheckboxRenderer.prototype.destroy = function (params) {
        this.eGui.removeEventListener('click', this.checkedHandler);
      }
      CheckboxRenderer.prototype.getValue = function (params) {
        return this.eGui.checked
      };

      return CheckboxRenderer;
    };


    agRenderMachine.getDatePicker = () => {
      // function to act as a class
      function Datepicker() { }

      // gets called once before the renderer is used
      Datepicker.prototype.init = function (params) {
        let value;
        if (params.value) {
          value = new Date(parseInt(params.value)).toISOString().slice(0, 10);
        }
        // create the cell
        this.eInput = document.createElement('input');
        this.eInput.value = value;
        this.eInput.pattern = '\d{4}-\d{2}-\d{2}';
        this.eInput.type = 'date';
        this.eInput.classList.add('ag-input');
        this.eInput.style.height = '100%';
      };

      // gets called once when grid ready to insert the element
      Datepicker.prototype.getGui = function () {
        return this.eInput;
      };

      // focus and select can be done after the gui is attached
      Datepicker.prototype.afterGuiAttached = function () {
        this.eInput.focus();
        this.eInput.select();
      };


      // returns the new value after editing
      Datepicker.prototype.getValue = function () {
        if (!this.eInput.value) return undefined;
        const date = new Date(this.eInput.value);
        this.eInput.blur();
        return date.getTime();
      };

      // any cleanup we need to be done here
      Datepicker.prototype.destroy = function () {
        // but this example is simple, no cleanup, we could
        // even leave this method out as it's optional
      };

      // if true, then this editor will appear in a popup
      Datepicker.prototype.isPopup = function () {
        // and we could leave this method out also, false is the default
        return true;
      };

      return Datepicker;
    }

    agRenderMachine.nodetype = {};

    agRenderMachine.saveColumnsDef = (nodetypeName, gridOptions) => {
      const colsDefinition = {
        colState: gridOptions.columnApi.getColumnState(),
        groupState: gridOptions.columnApi.getColumnGroupState(),
        sortState: gridOptions.api.getSortModel(),
        // filterState: gridOptions.api.getFilterModel(),
      }
      const itemName = `ganister_colsDefinition_${nodetypeName}_${$rootScope.datamodel.instanceName}`;
      const JSONColsDefinition = JSON.stringify(colsDefinition);
      localStorage.setItem(itemName, JSONColsDefinition);
    }

    agRenderMachine.resetColumnsDef = (nodetypeName) => {
      const itemName = `ganister_colsDefinition_${nodetypeName}_${$rootScope.datamodel.instanceName}`;
      localStorage.removeItem(itemName);
    }

    agRenderMachine.restoreColumnsDef = (nodetypeName, gridOptions) => {
      const itemName = `ganister_colsDefinition_${nodetypeName}_${$rootScope.datamodel.instanceName}`;
      const localStorageItem = localStorage.getItem(itemName);
      const colsDefinition = JSON.parse(localStorageItem);
      if (!colsDefinition) return;

      if (gridOptions.columnApi && gridOptions.api) {
        // check if any column in columnDefs is not in colsDefinition
        const colsDefinitionColIds = _.map(colsDefinition.colState, 'colId');
        const columnDefsColIds = _.map(gridOptions.columnApi.getAllColumns(), 'colId');
        const colsDefinitionColIdsNotInColumnDefs = _.difference(colsDefinitionColIds, columnDefsColIds);
        if (colsDefinitionColIdsNotInColumnDefs.length < 1) {
          gridOptions.columnApi.setColumnState(colsDefinition.colState);
          gridOptions.columnApi.setColumnGroupState(colsDefinition.groupState);
          gridOptions.api.closeToolPanel();
          gridOptions.api.setSortModel(colsDefinition.sortState);
          gridOptions.api.setFilterModel(colsDefinition.filterState);
        }
      } else {
        console.info("Grid api not loaded or Dismissed by User yet...");
      }
    }

    agRenderMachine.setGridRowHeight = (columns, grid) => {
      let height = 30;
      const heights = columns
        .filter(c => c.visible && c.colDef.height)
        .map(c => c.colDef.height);

      if (heights.length) {
        height = _.max(heights);
        if (height < 30) height = 30;
      }
      grid.rowHeight = height;
      if (grid.api) grid.api.resetRowHeights();
    }

    agRenderMachine.getColumnDefs = (nodetype, multilevel = false, scopeNodetype = {}, reverse = false) => {
      const {
        elementType,
        undirectedRelationship,
        directions = [],
      } = nodetype;

      const relationshipNodetype = elementType === 'relationship';

      const sourceNodetypeDM = $rootScope.datamodel.nodetypes.find((n) => {
        return directions.find((d) => d.source === n.id);
      });
      const sourceNodetype = sourceNodetypeDM?.id;

      let targetNodetypeDM = $rootScope.datamodel.nodetypes.find((n) => {
        return directions.find((d) => d.target === n.id);
      });
      const targetNodetype = targetNodetypeDM?.id;

      let nodetypeId = nodetype.id;
      let gridName = 'gridColumns';
      if (relationshipNodetype && undirectedRelationship) {
        // in a undirectedRelationship, always take the nodetype not displayed in nodeForm as targetNodetype
        if (targetNodetype === scopeNodetype?.id) {
          nodetypeId = sourceNodetype;
          gridName = 'reverseGridColumns';
        } else {
          nodetypeId = targetNodetype;
        }
      } else if (relationshipNodetype) {
        nodetypeId = targetNodetype;
      }

      targetNodetypeDM = $rootScope.datamodel.nodetypes.find((n) => n.id === nodetypeId);

      const { formDisabled } = targetNodetypeDM;

      let columns = [...nodetype.ui[gridName]];
      if (reverse) {
        columns = [...sourceNodetypeDM.ui['gridColumns']];
        nodetype.ui[gridName].forEach((col) => {
          if (col.property.split('.')[0] === nodetype.name) {
            columns.push(col);
          }
        })
      }
      //  Add the locked column ONLY if form is not disabled and not empty
      if (!formDisabled) {
        let elt = targetNodetypeDM;
        if (reverse) {
          elt = sourceNodetypeDM
        }
        const lockedColumn = {
          headerName: "Locked",
          field: elt.id === nodetype.id ? 'locked' : reverse? 'source.locked': 'target.locked',
          colId: `${elt.name}.locked`,
          property: `${elt.name}.locked`,
          type: 'lock',
          width: 50,
          cellRendered: true,
          order: 0,
        };
        columns.push(lockedColumn);
      }

      if (multilevel) {
        const indentationColumn = {
          headerName: "indentation",
          field: 'indentation',
          colId: 'indentation',
          type: 'indentation',
          width: 50,
          cellRendered: true,
          order: 0,
        };
        columns.push(indentationColumn);
      }

      const columnDefs = [];
      columns
        .sort((a, b) => a.order - b.order)
        .forEach((columnDM) => {
          const column = angular.copy(columnDM);

          const { property, nodeProperty } = column;
          if (!property) return;

          const [nodetypeName, propertyName] = property.split('.');

          if (!column.field) {
            const fieldArray = [];
            if (reverse){
              if (nodetypeName !== nodetype.name) fieldArray.push('source');
            } else {
              if (nodetypeName !== nodetype.name) fieldArray.push('target');
            }
            if (propertyName !== '_type') fieldArray.push('properties');
            if (propertyName) fieldArray.push(propertyName);
            const field = fieldArray.join('.');

            column.field = field;
            column.colId = field;
            column.editable = column.editable && !reverse;
          }

          const translationPath = `nodetype.${nodetypeName}.${propertyName}`;
          column.headerName = helperFunctions.translateProperty(translationPath);

          if (column.autoHeight) column.cellClass = 'cell-wrap-text';
          if (!column.cellStyle) column.cellStyle = {};

          if ((targetNodetypeDM.name !== nodetypeName) && !reverse) {
            column.cellStyle['background-color'] = 'rgba(217, 237, 247, 0.3)';
          }
          if (reverse && (sourceNodetypeDM.name !== nodetypeName)) {
            column.cellStyle['background-color'] = 'rgba(217, 237, 247, 0.3)';
          }

          if (nodeProperty) {
            column.columnId = column.id;

            const targetProperty = targetNodetypeDM.properties.find((p) => p.name === propertyName);
            if (targetProperty) {
              const relationshipDM = $rootScope.datamodel.nodetypes.find((n) => n.id === targetProperty.relationship);
              if (relationshipDM) {
                let nodePropertyDM = $rootScope.datamodel.nodetypes.find((n) => n.id === relationshipDM.directions[0].target);
                if (reverse) {
                  nodePropertyDM = $rootScope.datamodel.nodetypes.find((n) => n.id === relationshipDM.directions[0].source);
                } 
                if (nodePropertyDM) {
                  const { name } = nodePropertyDM;
                  const nodePropertyTranslationPath = `nodetype.${name}.${nodeProperty}`;
                  const nodePropertyName = helperFunctions.translateProperty(nodePropertyTranslationPath);
                  column.headerName = `${column.headerName}: ${nodePropertyName}`;
                  column.prop = column.nodeProperty;
                  column.cellStyle['background-color'] = '#9be6be70';
                }
              }
            }
          }

          // handle sorting
          switch (column.rowSortBy) {
            case 'asc':
            case 'desc':
              column.sort = column.rowSortBy;
              break;
            default:
              break;
          }

          agRenderMachine.getFilter(column);
          agRenderMachine.getRendering(column);

          // avoid ag-grid warnings
          delete column.id;
          delete column.name;
          delete column.type;
          delete column.label;
          delete column.order;
          delete column.property;
          delete column.nodeProperty;
          delete column.cellRendered;

          columnDefs.push(column);
        });

      return columnDefs;
    };

    agRenderMachine.getFilter = (column) => {
      switch (column.type) {
        case 'lock':
          column.filter = 'agSetColumnFilter';
          column.filterParams = {
            cellRenderer: agRenderMachine.lockStateRenderer,
            values: [0, 1, 2],
            newRowsAction: 'keep',
            clearButton: true,
            debounceMs,
          };
          break;
        case 'dropdown': {
          column.filter = 'agSetColumnFilter';
          const [nodetypeName, propertyName] = column.property.split('.');
          const nodetype = $rootScope.datamodel.nodetypes.find((n) => n.name === nodetypeName);
          const propertyDM = nodetype.properties.find((p) => p.name === propertyName);
          const { listSource } = propertyDM || {};
          if (!listSource) {
            Notification.warning(`List definition not linked (${propertyName})`);
          } else {
            const listOfValues = $rootScope.datamodel.listOfValues.find((l) => l.name === listSource);
            const filterValues = listOfValues.items.map(i => i.value);
            // filterValues.push('');
            column.filterParams = {
              values: filterValues,
              cellRenderer: (params) => {
                // retrieves the label for the referenced value.
                const elt = listOfValues.items.find((i) => i.value === params.value);
                return elt.label;
              },
              newRowsAction: 'keep',
              clearButton: true,
              debounceMs,
            };
          }
          break;
        }
        case 'boolean':
          column.filter = 'agSetColumnFilter';
          column.filterParams = {
            cellRenderer: agRenderMachine.booleanRenderer,
            values: [null, 'true', 'false'],
            newRowsAction: 'keep',
            clearButton: true,
            debounceMs,
          };
          break;
        case 'double':
        case 'integer':
          column.filter = 'agNumberColumnFilter';
          column.filterParams = {
            newRowsAction: 'keep',
            clearButton: true,
            debounceMs,
          };
          column.comparator = function (number1, number2) {
            if (number1 === null && number2 === null) {
              return 0;
            }
            if (number1 === null) {
              return -1;
            }
            if (number2 === null) {
              return 1;
            }
            return number1 - number2;
          }
          break;
        case 'serialization':
          column.filter = false;
          break;
        case 'text':
          column.filter = 'agTextColumnFilter';
          column.filterParams = {
            newRowsAction: 'keep',
            clearButton: true,
            debounceMs,
          };
          break;
        case 'state': {
          column.filter = 'agSetColumnFilter';
          if (column.property.indexOf('.') > -1) {
            const [nodetypeName] = column.property.split('.');
            const nodetype = $rootScope.datamodel.nodetypes.find((n) => n.name === nodetypeName);
            if (!nodetype.lifecycle) {
              // KEEP app warning console
              console.error("lifecycle has not been found", { nodetype, column });
              return "n/a";
            }
            const states = nodetype.lifecycle.states.map((s) => s.name);
            column.filterParams = {
              cellRendererParams: nodetype,
              cellRenderer: agRenderMachine.stateFilterRenderer,
              cellHeight: 20,
              values: states,
              newRowsAction: 'keep',
              clearButton: true,
            };
          }
          break;
        }
        case 'date':
        case 'dateTime':
          column.filter = 'agDateColumnFilter';
          column.filterParams = {
            newRowsAction: 'keep',
            clearButton: true,
            debounceMs,
          };
          break;
        case 'version':
          column.filter = 'agTextColumnFilter';
          column.filterParams = {
            newRowsAction: 'keep',
            clearButton: true,
            debounceMs,
          };
          break;
        case 'node':
          column.filter = 'agTextColumnFilter';
          column.filterParams = {
            newRowsAction: 'keep',
            clearButton: true,
            debounceMs,
            textCustomComparator: (filter, value, filterText) => {
              return true;
            },
          };
          break;
        default:
          column.filter = 'agTextColumnFilter';
          column.filterParams = {
            newRowsAction: 'keep',
            clearButton: true,
            debounceMs,
          };
          break;
      }
      return column;
    };

    agRenderMachine.getRendering = (column) => {
      if (column.cellRendered) {
        switch (column.type) {
          case 'string':
          case 'text':
            column.cellRenderer = agRenderMachine.textStringRenderer;
            break;
          case 'lock':
            column.cellRenderer = agRenderMachine.lockStateRenderer;
            break;
          case 'indentation':
            column.cellRenderer = agRenderMachine.indentationRenderer;
            break;
          case 'progress':
            column.cellRenderer = agRenderMachine.progressRenderer;
            break;
          case 'nutriscore':
            column.cellRenderer = agRenderMachine.nutriscoreRenderer;
            break;
          case 'integer':
            column.cellRenderer = agRenderMachine.integerRenderer;
            column.valueParser = (params) => {
              return Number(params.newValue);
            }
            break;
          case 'double':
            column.cellRenderer = agRenderMachine.floatRenderer;
            column.valueParser = (params) => {
              return Number(params.newValue);
            }
            break;
          case 'state':
            column.cellRenderer = agRenderMachine.stateRenderer;
            break;
          case 'date':
            column.cellRenderer = agRenderMachine.dateRenderer;
            break;
          case 'dateTime':
            column.cellRenderer = agRenderMachine.dateTimeRenderer;
            break;
          case 'version':
            column.cellRenderer = agRenderMachine.versionRenderer;
            break;
          case 'node':
            column.cellRenderer = agRenderMachine.nodeRenderer;
            break;
          case 'filesize':
            column.cellRenderer = agRenderMachine.filesizeRenderer;
            break;
          case 'nodetypeLogo':
            column.cellRenderer = agRenderMachine.nodetypeLogoRenderer;
            break;
          case 'markdown':
            column.cellRenderer = agRenderMachine.markdownRenderer;
            break;
          case 'mimetype':
            column.cellRenderer = agRenderMachine.mimetypeRenderer;
            break;
          case 'image':
            column.cellRenderer = agRenderMachine.imageRenderer;
            break;
          case 'user':
            column.cellRenderer = agRenderMachine.userRenderer;
            break;
          case 'tags':
            column.cellRenderer = agRenderMachine.tagsRenderer;
            break;
          case 'boolean':
            column.cellRenderer = 'booleanEditor';
            break;
          case 'url':
            column.cellRenderer = agRenderMachine.urlRenderer;
            break;
          case 'serialization':
            column.cellRenderer = agRenderMachine.serializationRenderer;
            break;
          case 'dropdown':
            column.cellRenderer = agRenderMachine.dropdownRenderer;
            break;
          default:
            break;
        }
      }

      if (column.editable) {
        switch (column.type) {
          case 'markdown':
            column.cellEditor = 'agLargeTextCellEditor';
            column.cellEditorParams = {
              maxLength: 9999999,
              cols: 100,
            };
            break;
          case 'dropdown':
            column.cellEditor = 'agRichSelectCellEditor';
            // retrieve dropdown possible values
            const [nodetypeName, propertyName] = column.property.split('.');

            const nodetype = _.find($rootScope.datamodel.nodetypes, { "name": nodetypeName });
            const propertyDM = _.find(nodetype.properties, { "name": propertyName });

            const { listSource } = propertyDM || {};
            const listOfValues = _.find($rootScope.datamodel.listOfValues, { "name": listSource });
            listOfValues.items.push({ value: '', label: '' });
            const values = listOfValues.items.map((i) => i.value);
            const labels = listOfValues.items.map((i) => i.label);

            column.cellEditorParams = {
              values,
              formatValue: (val) => {
                return labels[values.indexOf(val)];
              }
            }
            break;
          case 'node': {
            column.cellEditorParams = { customEditor: 'nodeSelector' };
            break;
          }
          case 'date': {
            column.cellEditor = 'datePicker';
            break;
          }
          case 'boolean': {
            column.cellEditor = 'booleanEditor';
            break;
          }
          default:
            column.cellEditor = 'agTextCellEditor';
            break;
        }
        // display editable columns with a specific light orange color
        column.cellStyle['background-color']='#ffbb3322';
      }

      switch (column.rowSortBy) {
        case 'asc':
        case 'desc':
          column.sort = column.rowSortBy;
          break;
        default:
          break;
      }

      return column;
    };

    const checkNodePropValue = ({ colDef, data, value }) => {
      if (data == null || !data) return value;
      if (!colDef) return value;
      if (!value) return null;
      const { colId, columnId } = colDef;
      if (!colId) return value;
      const nodetypeName = data._type;
      const propertyName = colId;
      const nodetypeDM = _.find($rootScope.datamodel.nodetypes, { "name": nodetypeName });
      if (nodetypeDM) {
        const columnDM = _.find(nodetypeDM.ui.gridColumns, { "id": columnId });
        if (columnDM && columnDM.nodeProperty && columnDM.type === 'node') {
          const properties = _.get(data, `${propertyName}.properties`, false);
          if (_.isEmpty(properties)) return {};
          return _.get(data, `${propertyName}.properties.${columnDM.nodeProperty}`);
        } else if (colDef.prop) {
          return _.get(data, `${propertyName}.properties.${colDef.prop}`);
        }
      }
      return value;
    }

    const translateInstanciations = (nodetype) => {
      if (!nodetype.instanciations) return;
      nodetype.instanciations = [...nodetype.instanciations].map((instanciation) => {
        const translationPath = `nodetype.${nodetype.name}.${instanciation.name}`;
        const translation = $translate.instant(translationPath);
        if (translation !== translationPath) {
          instanciation.translation = translation.charAt(0).toUpperCase() + translation.slice(1);
        } else {
          instanciation.translation = undefined;
        }
        return instanciation;
      });
    }

    // CELL RENDERERS
    agRenderMachine.textStringRenderer = (params) => {
      const value = checkNodePropValue(params);
      let cell = _.unescape(value);
      return cell;
    }

    agRenderMachine.nodetypeLogoRenderer = (params) => {
      return helperFunctions.getNodeIcon(params.data._type);
    }

    agRenderMachine.dropdownRenderer = (params) => {
      const value = checkNodePropValue(params);
      let cell = '';
      if (value) {
        if (params.colDef.cellEditorParams) {
          cell = params.colDef.cellEditorParams.formatValue(value);
        } else {
          const { property } = resolveNodetypeReference(params);
          const propertyListName = property.listSource;
          const listOfValues = _.find($rootScope.datamodel.listOfValues, { "name": propertyListName });
          listOfValues.items.push({ value: '', label: '' });
          const values = listOfValues.items.map((val) => val.value);
          const labels = listOfValues.items.map((val) => val.label);
          cell = labels[values.indexOf(value)]
        }
      }
      return cell;
    }

    agRenderMachine.serializationRenderer = (params) => {
      const value = checkNodePropValue(params);
      let cell = '';
      if (params && params.data) {
        const nodetype = resolveNodetypeReference(params).nodetype;
        if (Array.isArray(value) && nodetype && nodetype.instanciations) {
          value.forEach((inst) => {
            const instanciationDefinition = _.find(nodetype.instanciations, { id: inst });
            if (instanciationDefinition && !instanciationDefinition.translation) {
              translateInstanciations(nodetype);
            }
            if (instanciationDefinition) {
              cell = cell + `
                <span class="label label-primary" style='margin:2px;'>
                  ${instanciationDefinition.translation || instanciationDefinition.name}
                </span>
              `;
            }
          })
        } else {
          cell = ``;
        }
      } else {
        cell = ``;
      }
      return cell;
    }

    agRenderMachine.lockStateRenderer = (params) => {
      let cell;
      switch (parseInt(params.value)) {
        case 0:
          cell = '';
          break;
        case 1:
          cell = '<i class="fas fa-user-lock text-success"></i>';
          break;
        case 2:
          cell = '<i class="fas fa-lock text-danger"></i>';
          break;
      }
      return cell;
    };

    agRenderMachine.indentationRenderer = (params) => {
      return `<span class="label label-info" style="ont-size: 1.1rem; font-weight: 800;">${params.value}</span>`;
    };

    agRenderMachine.progressRenderer = (params) => {
      const value = checkNodePropValue(params);
      let cell = '';
      if (value) {
        cell = `<meter value='${value / 100}'/>`;
      } else if (params.node.key) {
        cell = `<meter value='${params.node.key / 100}'/>`;
      }
      return cell;
    };
    agRenderMachine.nutriscoreRenderer = (params) => {
      const value = checkNodePropValue(params);
      let cell = '';
      switch (value) {
        case 'A':
          cell = `<img value='${value}' style='height:100%;' src='/images/formulation/nutriscore_a.png'/>`;
          break;
        case 'B':
          cell = `<img value='${value}' style='height:100%;' src='/images/formulation/nutriscore_b.png'/>`;
          break;
        case 'C':
          cell = `<img value='${value}' style='height:100%;' src='/images/formulation/nutriscore_c.png'/>`;
          break;
        case 'D':
          cell = `<img value='${value}' style='height:100%;' src='/images/formulation/nutriscore_d.png'/>`;
          break;
        case 'E':
          cell = `<img value='${value}' style='height:100%;' src='/images/formulation/nutriscore_e.png'/>`;
          break;
        default:
          cell = `<img value='${value}' style='height:100%;' src='/images/formulation/nutriscore_x.png'/>`;
          break;
      }
      return cell;
    };

    agRenderMachine.filesizeRenderer = (params) => {
      const value = checkNodePropValue(params);
      let cell = '';
      if (value) {
        cell = humanFileSize(value, true);
      } else if (params.node.key) {
        cell = humanFileSize(params.node.key, true);
      }
      return cell;
    };

    agRenderMachine.imageRenderer = (params) => {
      let value = checkNodePropValue(params);
      var img = document.createElement('img');
      img.style.cssText = 'max-width:100%;max-height:100%';

      if (value) {
        // if image is a node (e.g. node's _thumbnail), pick the node's _id
        if (typeof value !== 'string') value = value._id;
        if (value && value.split('/')[0] === 'images') {
          img.src = value;
        } else {
          nodesModel.generatePublicURL(value, true).then(result => {
            if (!result || result.error) {
              Notification.error({
                title: 'Error Generating Public URL',
                ...result,
              });
            } else {
              img.src = result.url;
            }
          });
        }
        return img;
      } else {
        return '';
      }
    };

    agRenderMachine.markdownRenderer = (params) => {
      const value = checkNodePropValue(params);
      if (!value) {
        return '';
      }
      let newValue = value.replace(/<br>/g, '\n').replace(/&lt;br&gt;/g, '\n');
      return showdownConverter.makeHtml(newValue);
    };

    agRenderMachine.mimetypeRenderer = (params) => {
      const value = checkNodePropValue(params);
      let cell = '';
      let mimetype = '';
      if (value) {
        mimetype = value;
      } else if (params.node.key) {
        mimetype = params.node.key;
      }
      switch (mimetype) {
        case 'application/pdf':
          cell = ('<img src="images/filetypes/file-pdf-16.png"/>');
          break;
        default:
          cell = '';
      }
      return cell;
    };


    agRenderMachine.stateFilterRenderer = (params) => {
      let value = params.value;
      if (params && params.lifecycle) {
        const stateDefinition = _.find(params.lifecycle.states, { name: value });
        let bootstrapClassColor = 'default';
        if (stateDefinition) {
          if (stateDefinition.ui_color) {
            bootstrapClassColor = stateDefinition.ui_color;
          }
          cell = `<span class="label label-${bootstrapClassColor}">${stateDefinition.label}</span>`;
        }
      } else if (value) {
        cell = `<span class="label label-default">${value}</span>`;
      }
      return cell;
    }

    agRenderMachine.stateRenderer = (params) => {

      let value = checkNodePropValue(params);
      const nodetype = resolveNodetypeReference(params).nodetype;

      let cell = '';
      if (nodetype && nodetype.lifecycle) {
        const stateDefinition = _.find(nodetype.lifecycle.states, { name: value });
        let bootstrapClassColor = 'default';
        if (stateDefinition) {
          if (stateDefinition.ui_color) {
            bootstrapClassColor = stateDefinition.ui_color;
          }
          cell = `<span class="label label-${bootstrapClassColor}">${stateDefinition.label}</span>`;
        }
      } else if (value) {
        cell = `<span class="label label-default">${value}</span>`;
      }
      return cell;
    };

    agRenderMachine.versionRenderer = (params) => {
      const value = checkNodePropValue(params);
      let cell = '';
      const color = versionMapColors(value);
      // test if prop from target, source or direct
      const nodetype = resolveNodetypeReference(params).nodetype;


      if (params && params.data && value) {
        let _versionLabel = value;
        if (nodetype) {
          _versionLabel = helperFunctions.filterSemVersionning(value, nodetype);
        }
        cell = `<span style="background-color:${color};" class="badge">${_versionLabel}</span>`;
      } else if (value) {
        cell = value;
      }
      return cell;
    };

    agRenderMachine.impactMatrixInitialStateRenderer = (params) => {
      let cell = '';
      const value = params.data._state;

      if (params && params.data) {
        const nodetype = resolveNodetypeReference(params).nodetype;
        if (nodetype && nodetype.lifecycle) {
          const stateDefinition = _.find(nodetype.lifecycle.states, { name: value });
          let bootstrapClassColor = 'default';
          if (stateDefinition) {
            if (stateDefinition.ui_color) {
              bootstrapClassColor = stateDefinition.ui_color;
            }
            cell = `<span class="label label-${bootstrapClassColor}">${stateDefinition.label}</span>`;
          }
        }
      } else if (value) {
        cell = `<span class="label label-default">${value}</span>`;
      }
      return cell;
    };

    agRenderMachine.nodeRenderer = (params) => {
      const value = checkNodePropValue(params);

      const { colDef } = params;
      const propertyName = colDef.field;
      let propertyPath = 'data';
      if (params.data.target) {
        // check if propertyPath contains target
        if (!propertyName.includes('target')) propertyPath += '.target';
      } else if (params.data.source) {
        if (!propertyName.includes('source')) propertyPath += '.source';
      }
      
      if (value && value.properties) {
        return `
          <a ng-click="openNode(${propertyPath}.${propertyName})" >
            ${value.properties._maidenName || value.properties.label || value.properties._labelRef || value._labelRef}
          </a>
        `;
      } else if (_.isEmpty(value)) {
        return ``;
      }
      return `<span>${value || ''}</span>`;
    };

    agRenderMachine.userRenderer = (params) => {
      const value = checkNodePropValue(params);
      
      const { colDef } = params;
      const propertyName = colDef.field;
      let propertyPath = 'data';
      if (params.data.target) {
        propertyPath += '.target';
      } else if (params.data.source) {
        propertyPath += '.source';
      }

      let cell = '';
      if (value && value.label) {
        cell = `<a ng-click="openNode(${propertyPath}.${propertyName})" >${value.label}</a>`;
      }
      return cell;
    };

    agRenderMachine.dateRenderer = (params) => {
      const value = checkNodePropValue(params);
      let cell = value;
      if (value) {
        if (Number.isInteger(value)) {
          cell = moment(parseInt(value)).format('L');
        }
      }
      return cell;
    };

    agRenderMachine.dateTimeRenderer = (params) => {
      const value = checkNodePropValue(params);
      let cell = '';
      if (value) {
        cell = moment(parseInt(value)).format('LLL');
      }
      return cell;
    };

    agRenderMachine.integerRenderer = (params) => {
      const value = checkNodePropValue(params);
      let cell = '';
      if (value) {
        cell = parseInt(value);
      }
      return cell;
    };

    agRenderMachine.floatRenderer = (params) => {
      const value = checkNodePropValue(params);
      let cell = '';
      if (value) {
        cell = parseFloat(value);
      }
      return cell;
    };

    agRenderMachine.tagsRenderer = (params) => {
      const value = checkNodePropValue(params);
      let cell = '';
      if (value) {
        const tags = value.split(',').map(t => t.trim());
        tagsStrings = tags.map(t => `<label class="label label-tag">${t.trim()}</label>`);
        cell = tagsStrings.join(' ');
      }
      return cell;
    };

    agRenderMachine.urlRenderer = (params) => {
      const value = checkNodePropValue(params);
      let cell = '';
      if (value) {
        cell = `<a href="${value}" target="_blank">${value}</a>`;
      }
      return cell;
    };

    agRenderMachine.booleanRenderer = (params) => {
      const value = checkNodePropValue(params);
      let cell = '';
      if (value && (value === 'true' || value === true)) {
        cell = '<i style="font-size: 1.7em;color:blue;" class="far fa-check-square"></i>';
      } else if (value === 'false' || value === false) {
        cell = '<i style="font-size: 1.6em;" class="far fa-square"></i>';
      } else {
        cell = '<i style="font-size: 1.4em;color:#CCC;" class="far fa-square"></i>';
      }
      return cell;
    };


    function versionMapColors(version) {
      //  TODO: Change color according to version major, minor etc...?
      if (version) {
        if (
          parseInt(version.split(".")[0])) {
          const colorArray = [
            "#d2737d", "#c0a43c", "#f2510e", "#651be6", "#79806e", "#61da5e", "#cd2f00",
            "#9348af", "#01ac53", "#c5a4fb", "#996635", "#b11573", "#4bb473", "#75d89e",
            "#2f3f94", "#2f7b99", "#da967d", "#34891f", "#b0d87b", "#ca4751", "#7e50a8",
            "#c4d647", "#e0eeb8", "#11dec1", "#289812", "#566ca0", "#ffdbe1", "#2f1179",
            "#935b6d", "#916988", "#513d98", "#aead3a", "#9e6d71", "#4b5bdc", "#0cd36d",
            "#250662", "#cb5bea", "#228916", "#ac3e1b", "#df514a", "#539397", "#880977",
            "#f697c1", "#ba96ce", "#679c9d", "#c6c42c", "#5d2c52", "#48b41b", "#e1cf3b",
            "#5be4f0", "#57c4d8", "#a4d17a", "#225b8", "#be608b", "#96b00c", "#088baf",
            "#f205e6", "#1c0365", "#14a9ad", "#4ca2f9", "#a4e43f", "#d298e2", "#6119d0",
            "#f158bf", "#e145ba", "#ee91e3", "#05d371", "#5426e0", "#4834d0", "#802234",
            "#6749e8", "#0971f0", "#8fb413", "#b2b4f0", "#c3c89d", "#c9a941", "#41d158",
            "#fb21a3", "#51aed9", "#5bb32d", "#807fb", "#21538e", "#89d534", "#d36647",
            "#7fb411", "#0023b8", "#3b8c2a", "#986b53", "#f50422", "#983f7a", "#ea24a3",
            "#63b598", "#ce7d78", "#ea9e70", "#a48a9e", "#c6e1e8", "#648177", "#0d5ac1",];
          return colorArray[parseInt(version.split(".")[0]) * 7 + parseInt(version.split(".")[1])];
        } else {
          return "#AAA";
        }
      }
    }

  });
