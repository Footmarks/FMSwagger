// __Dependencies__
var url = require('url');
var deco = require('fmdeco');

// __Private Module Members__

// Figure out the basePath for Swagger API definition
function getBase (request, extra) {
  var parts = request.originalUrl.split('/');
  // Remove extra path parts.
  parts.splice(-extra, extra);
  return request.protocol + '://' + request.headers.host + parts.join('/');
};

// A method for generating a Swagger resource listing
function generateResourceListing (options) {
  var plurals = options.controllers.map(function (controller) {
    return controller.model().plural();
  });
  var listing = {
    apiVersion: options.version,
    swaggerVersion: '1.2',
    basePath: options.basePath,
    apis: plurals.map(function (plural) {
      return { path: '/api-docs/' + plural, description: 'Operations about ' + plural + '.' };
    })
  };

  return listing;
}

// __Module Definition__
var decorator = module.exports = function (options, protect) {
  var api = this;


  // Middleware for the documentation index.
  api.get('/api-docs', function (request, response) {
    response.json(generateResourceListing({
      version: request.fmrest.release,
      controllers: protect.controllers(request.fmrest.release),
      basePath: getBase(request, 1)
    }));
  });

  // Find the correct controller to handle the request.
  api.get('/api-docs/:path', function (request, response, next) {
    var fragment = '/' + request.params.path;
    var controllers = protect.controllers(request.fmrest.release, fragment);
    // If not found, bail.
    if (controllers.lenth === 0) return next();

    controllers[0].generateSwagger();

    response.json(deco.merge(controllers[0].swagger, {
      apiVersion: request.fmrest.release,
      swaggerVersion: '1.2',
      basePath: getBase(request, 2),
      resourcePath: fragment
    }));
  });

  return api;
};