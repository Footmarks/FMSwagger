// __Dependencies__
var baucis = require('../fmbaucis');
var deco = require('deco');
var decorators = deco.require(__dirname, [ 'Controller', 'Release' ]).hash;

baucis.Controller.decorators(decorators.Controller);
baucis.Release.decorators(decorators.Release);
