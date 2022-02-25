angular.module('app.ganister.tool.helperFunctions', [])
  .service('helperFunctions', function ($rootScope, $translate, clientMethodsService) {
    const helperFunctions = this;

    //  Mandatory Fields
    helperFunctions.askMandatoryFields = async (nodetype, properties = {}) => {
      try {
        const mandatoryProperties = { ...properties };

        const nodetypeProperties = nodetype.properties.filter((property) => {
          return property.mandatory && !property.generated;
        });

        // sort array by order
        let propertiesForms = nodetypeProperties.sort((a, b) => {
          return a.order - b.order;
        });

        propertiesForms = nodetypeProperties.map((property, index) => {
          const inputId = 'swal-' + property.name;

          const form = {
            title: $translate.instant(`nodetype.${nodetype.name}.${property.name}`),
            text: $translate.instant('default.node.askMandatoryFieldsText'),
            inputValue: mandatoryProperties[property.name] || "",
            inputValidator: (value) => {
              if (value === null || value === undefined || value === '') {
                return 'This field is required';
              }
            }
          }

          switch (property.type) {
            case 'date':
              form.html = `<input name="${form.title}" id="mandatory-${inputId}" type="date">`;
            case 'dateTime':
              if (!form.html) {
                form.html = `<input name="${form.title}" id="mandatory-${inputId}" type="datetime-local">`;
              }
              form.preConfirm = () => {
                value = $(`#mandatory-${inputId}`).val();
                if (value) {
                  const date = new Date(value);
                  return date.getTime();
                }
                Swal.showValidationMessage('This field is required');
                return false;
              }
              break;
            case 'integer':
            case 'double':
              form.input = 'number';
              break;
            case 'select':
            case 'multiselect':
              form.input = 'text';

              const list = $rootScope.datamodel.listOfValues.find(list => list.name === property.listSource);
              if (list) {
                form.input = 'select';
                form.inputOptions = {};
                list.items.map(item => form.inputOptions[item.value] = item.label);
              }
              break;
            case 'boolean':
              form.input = 'radio';
              form.inputOptions = {
                true: $translate.instant('default.shared.true') || 'True',
                false: $translate.instant('default.shared.false') || 'False',
              };
              break;
            case 'richText':
              form.input = 'textarea';
              break;
            default:
              form.input = 'text';
              break;
          }

          if (index + 1 === nodetypeProperties.length) {
            form.confirmButtonText = 'Create';
          }
          return form;
        });

        if (!propertiesForms.length) return mandatoryProperties;

        const result = await Swal
          .mixin({
            type: 'info',
            confirmButtonText: 'Next &rarr;',
            showCancelButton: true,
            progressSteps: propertiesForms.map((p, i) => i + 1),
          })
          .queue(propertiesForms);

        if (result.dismiss) return;

        result.value.forEach((input, index) => {
          const property = nodetypeProperties[index];

          switch (property.type) {
            case 'integer':
              property.value = parseInt(input);
              break;
            case 'double':
              property.value = parseFloat(input);
              break;
            case 'boolean':
              if (input === 'true') {
                property.value = true;
              } else if (input === 'null') {
                property.value = null;
              } else if (input === 'false') {
                property.value = false;
              } else {
                property.value = input;
              }
              break;
            default:
              property.value = input;
              break;
          }

          mandatoryProperties[property.name] = property.value;
        });

        return mandatoryProperties;
      } catch (error) {
        console.error(error);
      }
    }

    helperFunctions.translateProperty = (translationPath) => {
      const translation = $translate.instant(translationPath);
      const translated = translation !== translationPath;

      const [propertyName] = translationPath.split('.').reverse();

      const trimmedName = propertyName.replace('_', '');
      const capitalizedName = trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1);

      const translatedProperty = translated ? translation : capitalizedName;
      return translatedProperty;
    };

    helperFunctions.translateFields = (nodetype, result) => {

      // translate nodetypes tabs
      const tabNames = /(gtr_tab\()(\w+\.\w+\.\w+)(\))/mg;
      result.message = result.message.replaceAll(tabNames, (match, p1, p2) => {
        return $translate.instant(p2);
      });

      // translate mandatory fields
      let fields = result.message.match(/#(.*)#/g);
      if (fields) {
        fields = fields.pop().replaceAll('#', '').split(',');
        const translatedFields = [];
        fields.forEach((field) => {
          const property = _.find(nodetype.properties, { name: field });

          if (property) {
            const translatedProperty = $translate.instant(`nodetype.${nodetype.name}.${property.name}`);
            translatedFields.push(translatedProperty);
          }
        })
        result.message = result.message.replace(/#(.*)#/, `<br> · ${translatedFields.join('<br> · ')}`);
      }
      return result;
    }

    helperFunctions.generateUUID = () => { // Public Domain/MIT
      var d = new Date().getTime();//Timestamp
      var d2 = (performance && performance.now && (performance.now() * 1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if (d > 0) {//Use timestamp until depleted
          r = (d + r) % 16 | 0;
          d = Math.floor(d / 16);
        } else {//Use microseconds since page-load if supported
          r = (d2 + r) % 16 | 0;
          d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    }


    /**
     * Return nodetype specific filtered view of semVer versionning
     * @param {*} version
     * @param {*} nodetype
     */
    helperFunctions.filterSemVersionning = (version, nodetypeDM) => {
      if (!version) version = "0.0.0";
      const versionElts = version.split('.');
      let digitCount = 0;
      const semVerElts = [];
      let semVer = '';
      if (nodetypeDM && nodetypeDM.versioningRule) {
        if (nodetypeDM.versioningRule.major === 'nonInterchangeable' || nodetypeDM.versioningRule.major === 'interchangeable') {
          digitCount = 1;
          if (nodetypeDM.versioningRule.minor === 'nonInterchangeable' || nodetypeDM.versioningRule.minor === 'interchangeable') {
            digitCount = 2;
            if (nodetypeDM.versioningRule.patch === 'nonInterchangeable' || nodetypeDM.versioningRule.patch === 'interchangeable') {
              digitCount = 3;
            }
          }
          for (let i = 0; i < digitCount; i++) {
            semVerElts.push(versionElts[i]);
          }
          semVer = semVerElts.join('.');
        }
      }
      return semVer;
    };

    helperFunctions.simpleHash = (s) => {
      /* Simple hash function. */
      var a = 1, c = 0, h, o;
      if (s) {
        a = 0;
        /*jshint plusplus:false bitwise:false*/
        for (h = s.length - 1; h >= 0; h--) {
          o = s.charCodeAt(h);
          a = (a << 6 & 268435455) + o + (o << 14);
          c = a & 266338304;
          a = c !== 0 ? a ^ c >> 21 : a;
        }
      }
      return String(a);
    };

    helperFunctions.convertNodeDatesBackToMoment = (nodetypeDM, node) => {
      //  Convert Date values before saving
      if (!nodetypeDM || !nodetypeDM.properties) return node;
      const dateProps = nodetypeDM.properties.filter((item) => item.type === 'date' || item.type === 'dateTime');
      Object.keys(node).map((key) => {
        const dateProp = dateProps.find((p) => p.name === key);
        if (dateProp) {
          if (node[key]) {
            const date = new Date(node[key]);
            node[key] = date;
          } else {
            node[key] = null;
          }
        }
      })
      return node;
    };

    /**
    * getNodeIcon
    * @param {*} nodetype 
    * @returns 
    */
    helperFunctions.getNodeIcon = (nodetype) => {
      const defaultThumbnail = this.getNodeIconUrl(nodetype)
      if (defaultThumbnail) {
        return `<img src="${defaultThumbnail}" style="width: 16px; height: 16px; margin-right: 5px;" />`;
      }
      return '<i class="glyphicon glyphicon-asterisk"></i>';
    };

    /**
    * getNodeIconUrl
    * @param {*} nodetype 
    * @returns 
    */
    helperFunctions.getNodeIconUrl = (nodetype) => {
      const nodetypeDM = $rootScope.datamodel.nodetypes.find((n) => n.name === nodetype);
      const defaultThumbnail = _.get(nodetypeDM, 'ui.defaultThumbnail');
      if (defaultThumbnail) {
        return defaultThumbnail;
      }
      return null;
    };

    helperFunctions.getLockedState = (node) => {
      const { _lockState, _lockedBy } = node.properties;
      const currentUserId = $rootScope.appContext.user._id;

      let locked = 0;
      if (_lockState) {
        if (_lockedBy === currentUserId) {
          locked = 1;
        } else {
          locked = 2;
        }
      }

      return locked;
    };

    helperFunctions.runTriggeredMethods = async (trigger, data, scope) => {
      const nodetype = $rootScope.datamodel.nodetypes.find((n) => {
        return n.name === data._type;
      });

      const { methods = [] } = nodetype;

      const triggeredClientMethods = methods.filter((m) => {
        const method = $rootScope.datamodel.methods.find((customMethod) => {
          return customMethod.name === m.name && customMethod.serverOrClient === 'client';
        });
        return method && m.trigger === trigger;
      });

      for (const method of triggeredClientMethods) {
        const { name } = method;
        await clientMethodsService[name]($rootScope, scope, data);
      }

      return data;
    };

    helperFunctions.getRelationshipLinkName = (RelationshipName) => {
      const nodeNodetype = $rootScope.datamodel.nodetypes.find((nodetype) => nodetype.name === RelationshipName);
      const { linkName } = nodeNodetype;
      return linkName;
    }
    
  })