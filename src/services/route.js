(function() {
'use strict';

var dependencies = [];

if (angular.version.minor > 0) {
  dependencies.push('ngRoute');
}

angular.module('ra.route.services', dependencies).

  provider('Route', function($routeProvider) {

    var base   = {},
        lookup = {};

    var config = {
      templateUrl: function(key, base_key) {
        var path = [];

        if (base_key) {
          path.push(base_key);
        }

        if (key) {
          path.push(key + '.html');
        }

        return '/' + path.join('/');
      }
    };

    function store(key, path, opts) {
      lookup[key] = {
        key:  key,
        path: path,
        opts: opts
      };
    }

    function getControllerName(key) {
      var name = '',
          name_array = key.split('-');

      angular.forEach(name_array, function(k) {
        name = name + k.charAt(0).toUpperCase() + k.slice(1);
      });

      return name;
    }

    function getTemplateUrl(key, opts) {
      if (opts.templateUrl) {
        return opts.templateUrl;
      }

      var base_key;

      if (key.indexOf('.') > 0) {
        var keys = key.split('.');
        key      = keys.pop();
        base_key = keys.join('.');
      }

      return config.templateUrl(opts.templateName || key, opts.templateBase || base_key, opts);
    }

    function when(key, path, opts) {
      opts.templateUrl = getTemplateUrl(key, opts);

      // Store the path information in the lookup
      store(key, path, opts);

      $routeProvider.when(path, opts);
    }

    // raw  = /recipes/:id
    // path = /recipes/25
    // pathsMatch(raw, path) => true
    function pathsMatch(raw, path) {
      if (!raw || !path) {
        return false;
      }

      var p,
          raw_parts  = raw.split('/'),
          path_parts = path.split('/'),
          match      = true;

      if (raw_parts.length !== path_parts.length) {
        return false;
      }

      angular.forEach(raw_parts, function(r) {
        p = path_parts.shift();

        if (!(r === p || r.charAt(0) === ':')) {
          match = false;
          return  false;
        }
      });

      return match;
    }


    return {

      config: function(conf) {
        angular.extend(config, conf);
      },

      base: function(key, path, opts) {
        opts = opts || {};
        if (!opts.controller) {
          opts.controller = getControllerName(key);
        }

        store(key, path, opts, true);

        return angular.extend({}, this, {
          when: function(k, p, o) {
            k = key  + '.' + k;
            p = path + (p || '');
            o = angular.extend({}, opts, o);

            when(k, p, o);
            return this;
          }
        });
      },

      when: function(key, path, opts) {
        opts = opts || {};

        if (base) {
          base = undefined;
        }

        when(key, path, opts);
        return this;
      },

      otherwise: function(otherwise) {
        $routeProvider.otherwise(otherwise);
        return this;
      },

      $get: function($window, $location, $rootScope, $route) {
        // Returns keys from $route
        var getRouteKeys = function(url) {
          var route_def = $route.routes[url];
          return route_def && route_def.keys;
        };

        var replaceUrlParams = function(url, params) {
          var route_keys = getRouteKeys(url);

          if (!route_keys || !params) {
            return url;
          }

          // params => true removes all optional keys
          if (params === true) {
            params = {};
          }

          // Allow for passing a string as the solitary parameter
          if (!angular.isObject(params)) {
            // Get the first key
            var key = route_keys[0];
            url = url.replace(':' + key.name, params);

            // Get the loop below to replace optional parameters
            params = {};
          }

          if (angular.isObject(params)) {
            angular.forEach(route_keys, function(key) {
              if (params[key.name]) {
                var name = ':' + key.name;
                if (key.optional) {
                  name += '?';
                }

                url = url.replace(name, params[key.name]);
              } else if (key.optional) {
                url = url.replace('/:' + key.name + '?', '');
              }
            });
          }

          return url;
        };

        var getQueryParams = function(url, params) {
          var query_params = {};

          if (angular.isObject(params)) {
            angular.forEach(params, function(v, k) {
              var regex = new RegExp('\\/(\\:'+ k +')(\\/|$)');
              var match = url.match(regex);
              if (match && match[1]) {
                return;
              }

              query_params[k] = v;
            });
          }

          return query_params;
        };

        return {
          /**
           * Returns if a route key is defined
           * ==========
           * Route.defined('recipes.index') => true
           */
          defined: function(key) {
            return !!this.definition(key);
          },


          /**
           * Returns a full route definition
           * ==========
           * Route.definition('recipes.show') => Object { path: 'foo'… }
           */
          definition: function(key) {
            return lookup && lookup[key];
          },
          obj: function(key) {
            return this.definition(key);
          },


          /**
           * Returns the raw path without any parameter replacement
           * ==========
           * Route.raw('recipes.show') => '/recipes/:slug'
           */
          raw: function(key, shortened) {
            var route = this.definition(key);

            return route && route.path;
          },


          /**
           * Returns a path
           * ==========
           * If params is a string and there is one path parameter to
           * replace, it will replace it.
           *
           * Route.get('recipes.show', { slug: 'foo' }) => '/recipes/foo'
           * Route.get('recipes.show', 'bar')           => '/recipes/bar'
           */
          get: function(key, params) {
            var path = this.raw(key);

            if (path && params) {
              path = replaceUrlParams(path, params);
            }

            return path;
          },


          /**
           * Same as get(), however returns a full path including protocol, host, and port
           */
          getFull: function(key, params) {
            var full = [
              $location.protocol() + '://',
              $location.host()
            ];

            if ($location.port() && $location.port() !== 80) {
              full.push(':', $location.port());
            }

            full.push(this.get(key, params));

            return full.join('');
          },


          /**
           * Returns true if the current path is the route
           * ==========
           * $location.path()          => '/recipes'
           * Route.is('recipes.index') => true
           * Route.is('recipes.show')  => false
           */
          is: function(key, params) {
            return this.get(key, params) === $location.path();
          },


          /**
           * Returns true if the current path matches the route
           * ==========
           * $location.path()          => '/recipes/143-banana'
           * Route.matches('recipes.index') => false
           * Route.matches('recipes.show')  => true
           */
          matches: function(key) {
            return pathsMatch(this.raw(key, true), $location.path());
          },


          /**
           * Move to route
           * ==========
           * Changes current $location.path to the route and
           * returns $location
           *
           * Route.go('recipes.index')                           => $location.path('/recipes')
           * Route.go('reipces.index').search({ q: 'query' })    => $location.path('/recipes').search({ q: 'query' });
           *
           * Allows passing query params, i.e. any keys in params that are not
           * path parameters. Pass no_query as true to skip this.
           *
           * Route.go('recipes.show', { slug: 'foo', q: 'bar' }) => $location.path('/recipes/foo').search({ q: 'bar' });
           */
          go: function(key, params, no_query) {
            $location.path(this.get(key, params));

            if (!no_query) {
              var query = getQueryParams(this.raw(key), params);
              $location.search(query);
            }

            return this;
          },


          /**
           * Same as go, but removes current from history
           */
          replace: function(key, params, no_query) {
            this.go(key, params, no_query);

            $location.replace();

            return this;
          },


          /**
           * $location.path wrapper
           */
          path: function(path) {
            if (arguments.length === 0) {
              return $location.path();
            } else {
              $location.path(path);
              return this;
            }
          },


          /**
           * $location.search wrapper
           */
          search: function(search, param_value) {
            if (arguments.length === 0) {
              return $location.search();
            } else {
              $location.search(search, param_value);
              return this;
            }
          },


          /**
           * Move to route, hard
           * ==========
           * Same as above, but a window.location.href
           */
          redirect: function(key, params) {
            $window.location.href = this.get(key, params);
          },


          /**
           * Search convenience method
           */
          goSearch: function(key, query) {
            return this.go(key, { q: query });
          }
        };
      }
    };
  });

})();
