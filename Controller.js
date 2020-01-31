// This is a Controller mixin to add methods for generating Swagger data.

// __Dependencies__
var mongoose = require('mongoose');
var _ = require('lodash');
// __Private Members__

// Convert a Mongoose type into a Swagger type
function swaggerTypeFor (type) {
  if (!type) return null;
  if (type === String) return 'string';
  if (type === Number) return 'double';
  if (type === Date) return 'Date';
  if (type === Boolean) return 'boolean';
  if (type === mongoose.Schema.Types.ObjectId) return 'string';
  if (type === mongoose.Schema.Types.Oid) return 'string';
  if (type === mongoose.Schema.Types.Array) return 'Array';
  if (Array.isArray(type) || type.name === "Array") return 'Array';
  if (type === Object) return null;
  if (type instanceof Object) return null;
  if (type === mongoose.Schema.Types.Mixed) return null;
  if (type === mongoose.Schema.Types.Buffer) return null;
  throw new Error('Unrecognized type: ' + type);
}

// A method for capitalizing the first letter of a string
function capitalize (s) {
    if (!s) return s;
    if (s.length === 1) return s.toUpperCase();
    return s[0].toUpperCase() + s.substring(1);
}

// __Module Definition__
var decorator = module.exports = function () {
    var controller = this;

    // __Private Instance Members__

    function generatePropertyDefinition (name, path) {
        var property = {};
        var schema = controller.model().schema;
        var select = controller.select();
        var type = path.options.type ? swaggerTypeFor(path.options.type) : 'string'; // virtuals don't have type
        var mode = (select && select.match(/(?:^|\s)[-]/g)) ? 'exclusive' : 'inclusive';
        var exclusiveNamePattern = new RegExp('\\B-' + name + '\\b', 'gi');
        var inclusiveNamePattern = new RegExp('(?:\\B[+]|\\b)' + name + '\\b', 'gi');

        if (path.selected === false) return;

        if (select && mode === 'exclusive' && select.match(exclusiveNamePattern)) return;
        if (select && mode === 'inclusive' && name !== '_id' && !select.match(inclusiveNamePattern)) return;

        property.required = path.options.required || false; // TODO _id is required for PUT
        property.type = type;


        if (type === 'Array') {
            // Is it an array of strings?
            var subSchema = null;
            if (path.caster && path.caster.instance) { // an array of some basic type
                property.items = { type: path.caster.instance };
            } else { // an array of complex type
                property.items = { $ref: capitalize(name) };
                subSchema = {};
                subSchema[capitalize(name)] = path.schema;
            }
        } else {
            property.required = path.options.required || false; // TODO _id is required for PUT

            // Set enum values if applicable
            if (path.enumValues && path.enumValues.length > 0) {
                property.allowableValues = { valueType: 'LIST', values: path.enumValues };
            }

            // Set allowable values range if min or max is present
            if (!isNaN(path.options.min) || !isNaN(path.options.max)) {
                property.allowableValues = { valueType: 'RANGE' };
            }

            if (!isNaN(path.options.min)) {
                property.allowableValues.min = path.options.min;
            }

            if (!isNaN(path.options.max)) {
                property.allowableValues.max = path.options.max;
            }

            if (!property.type) {
              property.type = 'string';
            }

        }
        var retVal = { property: property };
        if (subSchema) {
            retVal['schema'] = subSchema;
        }
        return retVal;
    }

    function generateModelRefs() {
        var definition = {};

        var created = false;
        var schema = controller.model().schema;
        var subSchemas = [];
        Object.keys(schema.paths).forEach(function (name) {
            var names = name.split('.');
            if (names.length > 1) {
                for (var i = 0, l = names.length - 1; i < l; i++) {
                    if (!definition[capitalize(names[i])]) {
                        definition[capitalize(names[i])] = {};
                    }
                    definition[capitalize(names[i])]['id'] = capitalize(names[i]);
                    if (!definition[capitalize(names[i])]['properties']) {
                        definition[capitalize(names[i])]['properties'] = {};
                    }

                    var path = schema.paths[name];
                    var prop = generatePropertyDefinition(name, path);
                    var property = prop ? prop.property : null;     

                    if (prop.schema) {
                        subSchemas.push(prop.schema);
                    }

                    if (i < (l - 1)) {
                        definition[capitalize(names[i])]['properties'][names[i + 1]] = { $ref: capitalize(names[i + 1]) };
                    } else {
                        definition[capitalize(names[i])]['properties'][names[i + 1]] = property;
                    }
                }
            }
        });
        Object.keys(subSchemas).forEach(function (subSchema) {
            Object.keys(subSchemas[subSchema]).forEach(function (subSchemaName) {
                Object.keys(subSchemas[subSchema][subSchemaName].paths).forEach(function (name) {
                    if (!definition[subSchemaName]) {
                        definition[subSchemaName] = {};
                    }
                    definition[subSchemaName]['id'] = capitalize(subSchemaName);
                    if (!definition[subSchemaName]['properties']) {
                        definition[subSchemaName]['properties'] = {};
                    }
                    var path = subSchemas[subSchema][subSchemaName].paths[name];
                    var prop = generatePropertyDefinition(name, path);
                    var property = prop ? prop.property : null;                    

                    definition[subSchemaName]['properties'][name] = property;
                });
            });
        });
        return definition;
    }

    // A method used to generate a Swagger model definition for a controller
    function generateModelDefinition() {
        var definition = {};
        var schema = controller.model().schema;
        var hiddenFieldsAll = ["passwordHash", "appKey", "passwordResetToken", "passwordResetExpires", "lastLogin",
                                "lastFailedLogin", "_t", "__v", "salt", "__updatedFields"];
        definition.id = capitalize(controller.model().singular());
        definition.properties = {};

        var subSchemas = [];
        Object.keys(schema.paths).forEach(function (name) {
            if (hiddenFieldsAll.indexOf(name) <= 0) {
                var path = schema.paths[name];
                var prop = generatePropertyDefinition(name, path);
                var property = prop ? prop.property : null;

                if (prop && prop.schema) {
                    subSchemas.push(prop.schema);
                }
                var names = name.split('.');
                if (names.length < 2) {
                    definition.properties[name] = property;
                } else {
                    definition.properties[names[0]] = { $ref: capitalize(names[0]) };
                }
            }
        });
        retVal = { definition: definition };
        if (subSchemas.length) {
            var refs = {};
            Object.keys(subSchemas).forEach(function (subSchema) {
                if (definition.id === 'Visit') {
                }
                Object.keys(subSchemas[subSchema]).forEach(function (subSchemaName) {
                    if (definition.id === 'Visit') {
                    }
                    Object.keys(subSchemas[subSchema][subSchemaName].paths).forEach(function (name) {
                        if (definition.id === 'Visit') {
                        }
                        if (!refs[subSchemaName]) {
                            refs[subSchemaName] = {};
                        }
                        refs[subSchemaName]['id'] = capitalize(subSchemaName);
                        if (!refs[subSchemaName]['properties']) {
                            refs[subSchemaName]['properties'] = {};
                        }
                        var path = subSchemas[subSchema][subSchemaName].paths[name];
                        var prop = generatePropertyDefinition(name, path);                        
                        var property = prop ? prop.property : null;

                        refs[subSchemaName]['properties'][name] = property;
                    });
                });
            });
            retVal.refs = refs;
        }
        return retVal;
    }

    // Generate parameter list for operations
    function generateParameters(verb, plural) {
        var hiddenFieldsAll = ["passwordHash", "appKey", "passwordResetToken", "passwordResetExpires", "lastLogin",
                                "lastFailedLogin", "_t", "__t", "__v", "salt"];
        var hiddenFieldsUpdate = ["id", "_id", "appSecret", "password", "appSecretEncrypted", "companySecret", "companySecretEncrypted", "created", "updated", "status", "type", "company"];
        var hiddenFieldsCreate = ["id", "_id", "appSecret", "password", "appSecretEncrypted", "companySecret", "companySecretEncrypted", "created", "updated", "status", "type", "company"];
        var parameters = [];

        // Parameters available for singular routes
        if (!plural) {
            parameters.push({
                paramType: 'path',
                name: 'id',
                description: 'The ID of a ' + controller.model().singular(),
                dataType: 'string',
                required: true,
                allowMultiple: false
            });
        }

        // Parameters available for plural routes
        if (plural) {
            parameters.push({
                paramType: 'query',
                name: 'page',
                description: 'The page number where documents will be read from.',
                dataType: 'int',
                required: false,
                allowMultiple: false
            });

            parameters.push({
                paramType: 'query',
                name: 'per_page',
                description: 'The amount of documents associated with a page.',
                dataType: 'int',
                required: false,
                allowMultiple: false
            });

            parameters.push({
                paramType: 'query',
                name: 'count',
                description: 'Set to true to return count instead of documents.',
                dataType: 'boolean',
                required: false,
                allowMultiple: false
            });

            parameters.push({
                paramType: 'query',
                name: 'conditions',
                description: 'Set the conditions used to find or remove the document(s).',
                dataType: 'string',
                required: false,
                allowMultiple: false
            });

            parameters.push({
                paramType: 'query',
                name: 'sort',
                description: 'Set the fields by which to sort.',
                dataType: 'string',
                required: false,
                allowMultiple: false
            });
        }

        // Parameters available for singular and plural routes
        parameters.push({
            paramType: 'query',
            name: 'select',
            description: 'Select which paths will be returned by the query.',
            dataType: 'string',
            required: false,
            allowMultiple: false
        });

        parameters.push({
            paramType: 'query',
            name: 'populate',
            description: 'Specify which paths to populate.',
            dataType: 'string',
            required: false,
            allowMultiple: false
        });

        if (verb === 'post') {
            parameters.push({
                paramType: 'body',
                name: 'document',
                description: 'Create a document by sending the paths to be updated in the request body.',
                dataType: capitalize(controller.model().singular()),
                required: true,
                allowMultiple: false
            });
        }

        if (verb === 'put') {
            parameters.push({
                paramType: 'body',
                name: 'document',
                description: 'Update a document by sending the paths to be updated in the request body.',
                dataType: capitalize(controller.model().singular()),
                required: true,
                allowMultiple: false
            });            
        }
        return parameters;
    };

    function generateErrorResponses(plural) {
        var errorResponses = [];

        // TODO other errors (400, 403, etc. )

        // Error rosponses for singular operations
        if (!plural) {
          errorResponses.push({
            code: 404,
            reason: 'No ' + controller.model().singular() + ' was found with that ID.'
          });
        }

        // Error rosponses for plural operations
        if (plural) {
          errorResponses.push({
            code: 404,
            reason: 'No ' + controller.model().plural() + ' matched that query.'
          });
        }

        // Error rosponses for both singular and plural operations
        // None.

        return errorResponses;
    };

    // Generate a list of a controller's operations
    function generateOperations(plural) {
        var operations = [];

        controller.methods().forEach(function (verb) {
            //var method = ['post', 'get', 'put', 'delete'].indexOf(verb);
            var operation = {};
            var titlePlural = capitalize(controller.model().plural());
            var titleSingular = capitalize(controller.model().singular());

            // Don't do head, post/put for single/plural
            if (verb === 'head') return;
            if (verb === 'post' && !plural) return;
            if (verb === 'put' && plural) return;
            if ((verb === 'del' || verb === 'delete') && plural) return;

            // Use the full word
            if (verb === 'del') verb = 'delete';

            operation.httpMethod = verb.toUpperCase();
            if (plural) operation.nickname = verb + titlePlural;
            else operation.nickname = verb + titleSingular + 'ById';

            operation.responseClass = titleSingular; // TODO sometimes an array!

            if (plural) operation.summary = capitalize(verb) + ' some ' + controller.model().plural();
            else operation.summary = capitalize(verb) + ' a ' + controller.model().singular() + ' by its unique ID';

            operation.parameters = generateParameters(verb, plural);
            operation.errorResponses = generateErrorResponses(plural);


            operations.push(operation);
        });

        return operations;
    };

    // __Build the Definition__
    controller.generateSwagger = function () {
        if(controller.swagger) return controller;

        var modelName = capitalize(controller.model().singular());

        controller.swagger = { apis: [], models: {} };

        var defs = generateModelDefinition();
        // Model
        controller.swagger.models[modelName] = defs.definition;
        if (defs.refs) {
            var refs = defs.refs;
            Object.keys(refs).forEach(function (name) {
                controller.swagger.models[name] = refs[name];
            });
        }

        var refs = generateModelRefs();
        Object.keys(refs).forEach(function (name) {
            controller.swagger.models[name] = refs[name];
        });
        

        // Instance route
        controller.swagger.apis.push({
            path: '/' + controller.model().plural() + '/{id}',
            description: 'Operations about a given ' + controller.model().singular(),
            operations: generateOperations(false)
        });

        // Collection route
        controller.swagger.apis.push({
            path: '/' + controller.model().plural(),
            description: 'Operations about ' + controller.model().plural(),
            operations: generateOperations(true)
        });

        return controller;
    };

    return controller;
};
