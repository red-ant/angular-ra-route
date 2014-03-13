'use strict';
// Source: src/angular-ra-route.js
angular.module('ra.route', ['ra.route.directives', 'ra.route.services']);

// Source: src/directives/route.js
angular.module('ra.route.directives', []).
  directive('route', function($parse, Route) {
    return {
      restrict: 'A',
      priority: 99,
      link: function($scope, element, attr) {
        var key,
            params = {},
            search;

        function parseRoute(value) {
          if (value) {
            if (value.indexOf(',') > -1) {
              value  = value.split(',');
              key    = value[0].trim();
              params = value[1].trim();

              if (value[2]) {
                setSearch(true);
              }

              $scope.$watch(params, setParams, true);
            } else {
              key = value;
              setRoute();
            }
          }
        }

        function setParams(p) {
          params = p;
          setRoute();
        }

        function setSearch(s) {
          search = s;
          setRoute();
        }

        function setRoute() {
          var path = Route.get(key, params, search);
          attr.$set('href', path);
        }

        if (attr.routeParams) {
          $scope.$watch(attr.routeParams, setParams, true);
        }

        if (attr.routeSearch) {
          $scope.$watch(attr.routeSearch, setSearch, true);
        }

        attr.$observe('route', parseRoute);
      }
    };
  });

// Source: src/services/route.js
(function() {
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

      redirect: function(from, to) {
        $routeProvider.when(from, { redirectTo: to });
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

          if (route_def && route_def.keys) {
            return route_def.keys;
          }

          // We have to build them ourselves
          var re = /:(\w+)/g,
              param_match,
              keys = [];

          while ((param_match = re.exec(url)) !== null) {
            keys.push({ name: param_match[1] });
          }

          return keys;
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
          if (route_keys.length && !angular.isObject(params)) {
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
          var route_keys = getRouteKeys(url),
              params_obj = angular.copy(params);

          angular.forEach(route_keys, function(key) {
            if (params_obj[key.name]) {
              delete params_obj[key.name];
            }
          });

          return params_obj;
        };

        var toQueryString = function(obj, prefix) {
          var query = [];

          angular.forEach(obj, function(value, key) {
            if (angular.isString(value) ||
                angular.isNumber(value) ||
                typeof value === 'boolean') {
              query.push(encodeURIComponent(key) +'='+ encodeURIComponent(value));
            }
          });

          return (prefix ? '?' : '') + query.join('&');
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
          get: function(key, params, query) {
            var path = this.raw(key),
                query_string;

            if (query) {
              if (query === true) {
                query_string = toQueryString(getQueryParams(path, params), true);
              } else if (angular.isObject(query)) {
                query_string = toQueryString(query, true);
              }
            }

            if (path && params) {
              path = replaceUrlParams(path, params);
            }

            if (query_string) {
              path = path + query_string;
            }

            return path;
          },


          /**
           * Same as get(), however returns a full path including protocol, host, and port
           */
          getFull: function() {
            var port     = $location.port();
            var protocol = $location.protocol();

            var full = [
              protocol + '://',
              $location.host()
            ];

            if ((protocol === 'http'  && port !== 80) ||
                (protocol === 'https' && port !== 443)) {
              full.push(':', port);
            }

            full.push(this.get.apply(this, arguments));

            return full.join('');
          },


          /**
           * Returns true if the current path is the route
           * ==========
           * $location.path()          => '/recipes'
           * Route.is('recipes.index') => true
           * Route.is('recipes.show')  => false
           */
          is: function(key, params, location) {
            location = location || $location.path();
            return this.get(key, params) === location;
          },


          /**
           * Returns true if the current path matches the route
           * ==========
           * $location.path()          => '/recipes/143-banana'
           * Route.matches('recipes.index') => false
           * Route.matches('recipes.show')  => true
           */
          matches: function(key, location) {
            location = location || $location.path();
            return pathsMatch(this.raw(key, true), location);
          },


          /**
           * Move to route
           * ==========
           * Changes current $location.path to the route and
           * returns $location
           *
           * Route.go('recipes.index')                           => $location.path('/recipes')
           * Route.go('recipes.index').search({ q: 'query' })    => $location.path('/recipes').search({ q: 'query' });
           *
           * Allows passing query params, i.e. any keys in params that are not
           * path parameters. Pass no_query as true to skip this.
           *
           * Route.go('recipes.show', { slug: 'foo', q: 'bar' }) => $location.path('/recipes/foo').search({ q: 'bar' });
           */
          go: function(key, params, append_query) {
            $location.url(this.get(key, params, append_query));
            return this;
          },


          /**
           * Same as go, but removes current from history
           */
          replace: function(key, params, append_query) {
            this.go(key, params, append_query);
            $location.replace();
            return this;
          },


          /**
           * $location.path wrapper
           */
          path: function() {
            return $location.path.apply($location, arguments);
          },


          /**
           * $location.search wrapper
           */
          search: function() {
            return $location.search.apply($location, arguments);
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
            return this.go(key).search({ q: query });
          }
        };
      }
    };
  });

})();
