const _ = require('lodash');

function processFormDefinitionItem(nodetype, elt, datamodel, nodetypesProp) {
  let relationship;
  let nodeNodetype;
  let propertyDM;
  let selectEntries;
  if (elt.readOnly && elt.readOnly !== 'false') {
    elt.readOnly = true;
  } else {
    elt.readOnly = false;
  }
  //  Update Element Size to 2 if not exists
  if (!elt.size) {
    elt.size = '2';
  }
  if (!elt.offset) {
    elt.offset = '0';
  }

  if (elt.type === 'item') {
    // retrieve field type
    propertyDM = _.find(nodetype.properties, { name: elt.property });

    if (!propertyDM) {
      console.error(`missing type for prop : ${elt.property} (nodetype: ${nodetype.name})`);
      return false;
    }

    let schema;
    if (propertyDM.type === 'node' && propertyDM.relationship && elt.nodeProp) {
      //  Find the target Nodetype from the relationship in the property
      const relationshipDM = datamodel.nodetypeDefinitions.find((n) => n.id === propertyDM.relationship);
      const direction = relationshipDM.directions.find((d) => d.source === nodetype.id);
      const targetNodetypeDM = datamodel.nodetypeDefinitions.find((n) => n.id === direction.target); // won't work with multiple source/target

      schema = {
        key: `${elt.property}.properties.${elt.nodeProp}`,
        translationKey: [`nodetype.${targetNodetypeDM.name}.${elt.nodeProp}`],
        feedback: false,
        type: 'text',
        htmlClass: `col-md-${elt.size} col-md-offset-${elt.offset}`,
        readonly: true,
        _ro: true,
      };
    }
    switch (propertyDM.type) {
      case 'string':
        schema = {
          feedback: false,
          type: 'text',
          htmlClass: `col-md-${elt.size} col-md-offset-${elt.offset}`,
        };
        break;
      case 'richText':
        schema = {
          type: 'section',
          htmlClass: `col-md-${elt.size} col-md-offset-${elt.offset} notSection`,
          items: [
            {
              type: 'template',
              template: `<textarea ng-model-options="{ updateOn: 'blur'}" rows='${elt.textareaRows || 3}' class='form-control' style='white-space:pre-wrap;margin-bottom:10px;' ng-model='model.${elt.property}' ng-bind-html='model.${elt.property}'></textarea>`,
              htmlClass: `col-md-${elt.size} col-md-offset-${elt.offset}`,
              feedback: false,
              ganisterProp: 'template',
            },
          ],
        };
        break;
      case 'double':
        schema = {
          feedback: false,
          type: 'number',
          pattern: '[0-9]{10}',
          htmlClass: `col-md-${elt.size} col-md-offset-${elt.offset}`,
        };
        break;
      case 'integer':
        schema = {
          feedback: false,
          type: 'number',
          // eslint-disable-next-line no-useless-escape
          pattern: '^(\+|-)?\d+$',
          htmlClass: `col-md-${elt.size} col-md-offset-${elt.offset}`,
        };
        break;
      case 'node':
        if (propertyDM.core && propertyDM.name === '_createdBy') {
          relationship = { linkName: 'created' };
          nodeNodetype = datamodel[nodetypesProp].find((item) => item.name === 'user');
        } else {
          relationship = datamodel[nodetypesProp].find((r) => r.id === propertyDM.relationship);
          if (!propertyDM.relationship) return {};

          const direction = relationship.directions.find((d) => d.source === nodetype.id);
          nodeNodetype = datamodel[nodetypesProp].find((n) => n.id === direction.target); // won't work with multiple source/target
        }
        schema = {
          type: 'section',
          htmlClass: `col-md-${elt.size} col-md-offset-${elt.offset} nodeEntry notSection`,
          items: [
            {
              key: elt.nodeProp ? `${elt.property}.properties.${elt.nodeProp}` : `${elt.property}.properties._labelRef`,
              translationKey: [`nodetype.${nodetype.name}.${elt.property}`],
              type: 'text',
              readonly: true,
              feedback: false,
              ganisterProp: 'node',
              fieldHtmlClass: 'disabled',
            },
            {
              type: 'button',
              notitle: true,
              readonly: false,
              _ro: false,
              onClick: `openNodeProp('${propertyDM.name}')`,
              style: 'mb-10 btn-info btn-xs no-border-radius nodeEntryFirstButton',
              icon: 'glyphicon glyphicon-eye-open',
              alwaysUnlocked: true,
            },
            {
              type: 'button',
              notitle: true,
              readonly: false,
              onClick: `openNodePropModal('${nodeNodetype.name}','${propertyDM.id}')`,
              style: 'mb-10 btn-success btn-xs right-border-radius-only nodeEntrySecondButton',
              icon: 'glyphicon glyphicon-log-in',
            },
          ],
        };
        if (elt.nodeProp) {
          const textItem = schema.items.find((item) => item.type === 'text');
          textItem.translationKey.push(`nodetype.${nodeNodetype.name}.${elt.nodeProp}`);
          schema.items = [textItem];
        }
        break;
      case 'date':
        schema = {
          type: 'section',
          htmlClass: `col-md-${elt.size} col-md-offset-${elt.offset} notSection`,
          items: [
            {
              type: 'template',
              template: `<input type='date' class='form-control' ng-model='model.${elt.property}'>`,
              htmlClass: `col-md-${elt.size} col-md-offset-${elt.offset}`,
              feedback: false,
              ganisterProp: 'template',
            },
          ],
        };
        break;
      case 'boolean':
        schema = {
          type: 'section',
          htmlClass: `col-md-${elt.size} col-md-offset-${elt.offset} notSection booleanSchemaForm`,
          items: [
            {
              feedback: false,
              type: 'template',
              htmlClass: `col-md-${elt.size} col-md-offset-${elt.offset}`,
              template: `
                  <div class="">
                    <label class="switch boolean control-label " ng-class="{indeterminate:model.${elt.property} === null || model.${elt.property} === '' || model.${elt.property} === undefined}">
                      <input type="checkbox" class="boolean" sf-field-model="replaceAll" ng-model='model.${elt.property}'>
                      <span class="slider boolean round"></span>
                    </label>
                  </div>`,
              ganisterProp: 'template',
            },
          ],
        };
        break;
      case 'dateTime':
        schema = {
          type: 'section',
          htmlClass: `col-md-${elt.size} col-md-offset-${elt.offset} notSection`,
          items: [
            {
              type: 'template',
              template: `<input type='datetime-local' class='form-control' ng-model='model.${elt.property}'><div class="help-block" ></div>`,
              htmlClass: `col-md-${elt.size} col-md-offset-${elt.offset}`,
              feedback: false,
              ganisterProp: 'template',
            },
          ],
        };
        break;
      case 'json':
        if (elt.property === '_serialized') {
          let templateBuild = '<h4>';
          if (nodetype.instanciations) {
            nodetype.instanciations.forEach((inst) => {
              templateBuild = `${templateBuild}
              <span class='label label-primary' ng-if="instanciation.id=='${inst.id}'" style='margin:2px;' ng-repeat="instanciation in model.${elt.property}">
                {{ instanciation.translation || instanciation.name }}
              </span>
              <span class='label label-primary' ng-if="instanciation=='${inst.id}'" style='margin:2px;' ng-repeat="instanciation in model.${elt.property}">
                ${inst.name}
              </span>
              `;
            });
          }
          templateBuild = `${templateBuild}</h4>`;

          schema = {
            readonly: true,
            _ro: true,
            type: 'section',
            htmlClass: `col-md-${elt.size} col-md-offset-${elt.offset} notSection`,
            items: [
              {
                type: 'template',
                template: `<div>
                ${templateBuild}
                </div>`,
                htmlClass: `col-md-${elt.size} col-md-offset-${elt.offset}`,
                feedback: false,
                ganisterProp: 'template',
              },
            ],
          };
        } else {
          schema = {
            feedback: false,
            htmlClass: `col-md-${elt.size} col-md-offset-${elt.offset}`,
          };
        }
        break;
      case 'multiselect':
        if (elt.property === '_serialized') {
          let templateBuild = '<h4>';
          if (nodetype.instanciations) {
            nodetype.instanciations.forEach((inst) => {
              templateBuild = `${templateBuild}
              <span class='label label-primary' ng-if="instanciation=='${inst.id}'" style='margin:2px;' ng-repeat="instanciation in model.${elt.property}" >
                {{ 'nodetype.${nodetype.name}.${inst.name}' | translate }}
              </span>
              `;
            });
          }
          templateBuild = `${templateBuild}</h4>`;

          schema = {
            readonly: true,
            _ro: true,
            type: 'section',
            htmlClass: `col-md-${elt.size} col-md-offset-${elt.offset} notSection`,
            items: [
              {
                type: 'template',
                template: `<div>
                ${templateBuild}
                </div>`,
                htmlClass: `col-md-${elt.size} col-md-offset-${elt.offset}`,
                feedback: false,
                ganisterProp: 'template',
              },
            ],
          };
        } else {
          // retrieve list of values
          selectEntries = [];
          if (propertyDM.listSource) {
            const list = _.find(datamodel.listOfValues, { name: propertyDM.listSource });
            if (list) {
              selectEntries = list.items.map(listEntry => listEntry.value);
            } else {
              selectEntries = [];
            }
          }
          schema = {
            type: 'section',
            htmlClass: `col-md-${elt.size} col-md-offset-${elt.offset} notSection`,
            items: [
              {
                feedback: false,
                type: 'template',
                titleMap: selectEntries,
                htmlClass: `col-md-${elt.size} col-md-offset-${elt.offset}`,
                template: `
                  <div class="">
                    <ui-select multiple ng-model="model.${elt.property}" disabler theme="bootstrap" close-on-select="false" >
                    <ui-select-match placeholder="Select...">{{$item}}</ui-select-match>
                    <ui-select-choices repeat="elt in form.titleMap ">
                      {{elt}}
                    </ui-select-choices>
                  </ui-select>
                  </div>`,
                ganisterProp: 'template',
              },
            ],
          };
        }
        break;
      case 'nutriscore':
        schema = {
          type: 'section',
          htmlClass: `col-md-${elt.size} col-md-offset-${elt.offset} notSection`,
          items: [
            {
              type: 'template',
              template: `
              <img ng-if='model.${elt.property}=="A"' class='img-responsive' src='/images/formulation/nutriscore_a.png'/>
              <img ng-if='model.${elt.property}=="B"' class='img-responsive' src='/images/formulation/nutriscore_b.png'/>
              <img ng-if='model.${elt.property}=="C"' class='img-responsive' src='/images/formulation/nutriscore_c.png'/>
              <img ng-if='model.${elt.property}=="D"' class='img-responsive' src='/images/formulation/nutriscore_d.png'/>
              <img ng-if='model.${elt.property}=="E"' class='img-responsive' src='/images/formulation/nutriscore_e.png'/>
              <img ng-if='["A","B","C","D","E"].indexOf(model.${elt.property})<0' class='img-responsive' src='/images/formulation/nutriscore_x.png'/>
              `,
              htmlClass: `col-md-${elt.size} col-md-offset-${elt.offset}`,
              feedback: false,
              ganisterProp: 'template',
            },
          ],
        };
        break;
      case 'select':
        // retrieve list of values
        selectEntries = [];
        if (propertyDM.listSource) {
          const list = _.find(datamodel.listOfValues, { name: propertyDM.listSource });
          if (list) {
            selectEntries = list.items.map((listEntry) => {
              return {
                name: listEntry.label,
                value: listEntry.value,
              };
            });
            selectEntries.push({ name: '', value: '' });
          } else {
            selectEntries = [];
          }
        }
        schema = {
          feedback: false,
          titleMap: selectEntries,
          type: 'select',
          htmlClass: `col-md-${elt.size} col-md-offset-${elt.offset}`,
          ngModelOptions: {
            updateOn: 'default',
          },
        };
        break;
      default:
        schema = {
          feedback: false,
          htmlClass: `col-md-${elt.size} col-md-offset-${elt.offset}`,
        };
        break;
    }

    if (schema.items) {
      schema.items = schema.items.map((item) => {
        const newItem = {
          ...item,
          key: item.key || elt.property,
          readonly: item.readonly !== undefined ? item.readonly : elt.readOnly,
          _ro: item._ro || elt.readOnly,
          translationKey: item.translationKey || [`nodetype.${nodetype.name}.${elt.property}`],
        };
        if (item.notitle) {
          delete newItem.key;
          delete newItem.translationKey;
        }
        return newItem;
      });
    } else {
      schema = {
        key: schema.key || elt.property,
        readonly: schema.readonly || elt.readOnly,
        _ro: schema._ro || elt.readOnly,
        translationKey: schema.translationKey || [`nodetype.${nodetype.name}.${elt.property}`],
        ngModelOptions: {
          updateOn: 'blur',
        },
        ...schema,
      };
    }
    schema.condition = elt.condition;
    return schema;
  }
  // otherwise elt is a container
  let container;
  switch (elt.containerType) {
    case 'accordion':
      container = {
        type: 'template',
        template: `
          <div class='schema-form-section noBorder col-md-12'><details ${elt.foldedDefault === 'true' ? '' : 'open'} class='panel panel-info'>
          <summary class='panel-heading'>${elt.label}</summary>
          <div class='schema-form-section panel-body '><sf-decorator ng-repeat='item in form.items' form='item'></sf-decorator></div>
          </details></div>
        `,
      };
      break;
    case 'row':
      container = {
        type: 'template',
        template: `<div class="row" style="margin: 15px 0px!important">
        <sf-decorator ng-repeat="item in form.items" form="item"></sf-decorator>
      </div>`,
      };
      break;
    default:
      container = { type: 'section' };
      break;
  }
  container.condition = elt.condition;
  container.items = [];
  elt.columns[0].forEach((e) => {
    container.items.push(processFormDefinitionItem(nodetype, e, datamodel, nodetypesProp));
  });
  return container;
}

module.exports = {
  buildNgSchema: (nodetype) => {
    const schema = {
      type: 'object',
      title: nodetype.name,
      properties: {},
    };
    nodetype.properties.forEach((prop) => {
      schema.properties[prop.name] = {
        title: prop.name,
        type: prop.type,
      };
      if (prop.required) {
        schema.required.push(prop.name);
      }
    });
    return schema;
  },

  buildNGForm: (nodetype, datamodel, nodetypesProp) => {
    const { form } = nodetype.ui;
    //  If form has a definition, regenerate nodeform
    if (form.definition) {
      const formSchema = [{
        type: 'section',
        htmlClass: 'col-md-12',
        items: [],
      }];
      if (form.definition.A) {
        form.definition.A.forEach((elt) => {
          formSchema[0].items.push(processFormDefinitionItem(nodetype, elt, datamodel, nodetypesProp));
        });
        return formSchema;
      }
    }
    return [];
  },

  buildInfoDataForm: (nodetype, datamodel) => {
    //  Generate Form Schema
    const properties = nodetype.properties.filter((prop) => prop.infoData === true);
    const propertyNames = properties.map((p) => p.name);
    const schema = { type: 'object', title: nodetype.name, properties: {} };

    properties.forEach((prop) => {
      schema.properties[prop.name] = { title: prop.name, type: prop.type };
      if (prop.required) {
        schema.required.push(prop.name);
      }
    });

    const formDefinition = {
      A: {
        type: 'container',
        containerType: 'accordion',
        foldedDefault: 'false',
        id: 0,
        label: 'Identification',
        size: '12',
        columns: [],
        readOnly: false,
      },
    };
    properties.map((property, index) => {
      formDefinition.A.columns.push({
        type: 'item',
        id: index + 1,
        property: property.name,
        size: '12',
        readOnly: false,
      });
    });

    //  If form has a definition, regenerate nodeform
    const form = [];
    if (formDefinition.A && formDefinition.A.columns.length) {
      form.push({ type: 'section', htmlClass: 'col-md-12', items: [] });
      formDefinition.A.columns.forEach((elt) => {
        const item = processFormDefinitionItem(nodetype, elt, datamodel, 'nodetypes');
        form[0].items.push(item);
      });
    }
    return { form, properties: propertyNames, schema };
  },
};
