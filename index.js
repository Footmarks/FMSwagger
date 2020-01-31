// __Dependencies__
var FMRest = require('@footmarksadmin/fmrest');
var deco = require('fmdeco');
var decorators = deco.require(__dirname, [ 'Controller', 'Api' ]).hash;

FMRest.Controller.decorators(decorators.Controller);
FMRest.Api.decorators(decorators.Api);
