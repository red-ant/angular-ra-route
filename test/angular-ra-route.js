describe('Module: ra.route >', function() {

  var $location,
      $route,
      Route;

  describe('Service: Route >', function() {

    beforeEach(function() {
      // Basic configuration for a recipes area
      var moduleConfig = function(RouteProvider) {
        RouteProvider.
          base('recipe', '/recipes').
            when('index').
            when('show',   '/:slug').
            when('create', '/new', { controller:  'Exercises', templateUrl: '/assets/new-recipe.html' });

        RouteProvider.otherwise({
          controller:  '404',
          templateUrl: '/assets/404.html'
        });

        RouteProvider.config({
          templateUrl: function(key) {
            return '/foo/' + key + '.js';
          }
        });

        RouteProvider.when('exercise', '/exercises');
      };
      module('ra.route', moduleConfig);

      // Get the route service for later use
      inject(function($injector) {
        $location = $injector.get('$location');
        $route    = $injector.get('$route');
        Route     = $injector.get('Route');

        spyOn($location, 'path').andCallThrough();
        spyOn($location, 'search').andCallThrough();
      });
    });

    describe('RouteProvider >', function() {

      var index_route,
          show_route,
          create_route,
          otherwise;

      describe('index route >', function() {
        it('should set an index route', function() {
          index_route = $route.routes['/recipes'];

          expect(index_route).toEqual(jasmine.any(Object));
        });

        it('should set a default controller', function() {
          expect(index_route.controller).toBe('Recipe');
        });

        it('should set a default templateUrl', function() {
          expect(index_route.templateUrl).toBe('/recipe/index.html');
        });
      });

      describe('show route >', function() {
        it('should set a show route', function() {
          show_route = $route.routes['/recipes/:slug'];

          expect(show_route).toEqual(jasmine.any(Object));
        });

        it('should set a default controller', function() {
          expect(show_route.controller).toBe('Recipe');
        });

        it('should set a default templateUrl', function() {
          expect(show_route.templateUrl).toBe('/recipe/show.html');
        });
      });

      describe('create route >', function() {
        it('should set a create route', function() {
          create_route = $route.routes['/recipes/new'];

          expect(create_route).toEqual(jasmine.any(Object));
        });

        it('should override the default controller', function() {
          expect(create_route.controller).toBe('Exercises');
        });

        it('should override the default templateUrl', function() {
          expect(create_route.templateUrl).toBe('/assets/new-recipe.html');
        });
      });

      describe('otherwise >', function() {
        it('should set a route', function() {
          otherwise = $route.routes.null;

          expect(otherwise).toEqual(jasmine.any(Object));
        });

        it('should set the controller', function() {
          expect(otherwise.controller).toBe('404');
        });

        it('should set a templateUrl', function() {
          expect(otherwise.templateUrl).toBe('/assets/404.html');
        });
      });

      describe('configuration >', function() {
        it('should specify a custom templateUrl', function() {
          expect($route.routes['/exercises'].templateUrl).toBe('/foo/exercise.js');
        });
      });

    });

    // Service tests
    describe('defined >', function() {
      it('should return false if a route is not defined', function() {
        expect(Route.defined('video')).toBe(false);
      });

      it('should return true if a route is defined', function() {
        expect(Route.defined('exercise')).toBe(true);
      });

      it('should return truen if a route is defined as base.child', function() {
        expect(Route.defined('recipe.index')).toBe(true);
      });
    });

    describe('definition >', function() {
      it('should return a full definition', function() {
        var definition = Route.definition('recipe.create');

        expect(definition).toEqual(jasmine.any(Object));
        expect(definition.key).toBe('recipe.create');
      });

      it('should return undefined for an undefined definition', function() {
        expect(Route.definition('foo')).toBeUndefined();
      });
    });

    describe('obj >', function() {
      it('should alias definition', function() {
        Route.definition = jasmine.createSpy().andReturn('foo');
        var value = Route.obj('testing');

        expect(value).toBe('foo');
        expect(Route.definition).toHaveBeenCalledWith('testing');
      });
    });

    describe('raw >', function() {
      it('should return the raw path for a definition', function() {
        expect(Route.raw('recipe.show')).toBe('/recipes/:slug');
      });

      it('should return undefined for an undefined definition', function() {
        expect(Route.raw('recipe.category')).toBeUndefined();
      });
    });

    describe('get >', function() {
      it('should get a route', function() {
        expect(Route.get('recipe.index')).toBe('/recipes');
      });

      it('should get a route and replace the parameters', function() {
        expect(Route.get('recipe.show', { slug: '1-banana' })).toBe('/recipes/1-banana');
      });

      it('should get a route and default to replacing the first parameter if it is a string', function() {
        expect(Route.get('recipe.show', '2-apple')).toBe('/recipes/2-apple');
      });

      it('should return undefined for an undefined route', function() {
        expect(Route.get('foo')).toBeUndefined();
        expect(Route.get('foo', { params: 'testing' })).toBeUndefined();
      });
    });

    describe('is >', function() {
      it('should return if the current route is the same as $location.path', function() {
        $location.path('/recipes');

        expect(Route.is('recipe.index')).toBe(true);
        expect(Route.is('recipe.show')).toBe(false);
      });

      it('should return false for an undefined route definition', function() {
        $location.path('/recipes');

        expect(Route.is('foo')).toBe(false);
      });
    });

    describe('matches >', function() {
      it('should return if the current route matches the same as $location.path', function() {
        $location.path('/recipes');

        expect(Route.matches('recipe.index')).toBe(true);
        expect(Route.matches('recipe.show')).toBe(false);
      });

      it('should return if the current raw route matches $location.path', function() {
        $location.path('/recipes/1-banana');

        expect(Route.matches('recipe.index')).toBe(false);
        expect(Route.matches('recipe.show')).toBe(true);
        expect(Route.matches('foo')).toBe(false);
      });
    });

    describe('go >', function() {
      beforeEach(function() {
        $location.path.reset();
        $location.search.reset();
      });

      it('should call $location.path with the route', function() {
        var response = Route.go('recipe.index');

        expect(response).toBe(Route);
        expect($location.path).toHaveBeenCalledWith('/recipes');
      });

      it('should call $location.path and replace the parameters', function() {
        Route.go('recipe.show', '1-banana');

        expect($location.path).toHaveBeenCalledWith('/recipes/1-banana');
      });

      it('should call $location.path and replace the parameters call $location.search with the rest of the parameters', function() {
        Route.go('recipe.show', { slug: '2-apple', filter: 'snack' });

        expect($location.path).toHaveBeenCalledWith('/recipes/2-apple');
        expect($location.search).toHaveBeenCalledWith({ filter: 'snack' });
      });

      it('should not call $location.search if no_query is set to true', function() {
        Route.go('recipe.show', { slug: '3-orange', filter: 'snack' }, true);

        expect($location.path).toHaveBeenCalledWith('/recipes/3-orange');
        expect($location.search).not.toHaveBeenCalled();
      });
    });

    describe('path >', function() {
      beforeEach(function() {
        $location.path.reset();
      });

      it('should call $location.path with no arguments', function() {
        $location.path('/recipes/new');
        $location.path.reset();

        var response = Route.path();

        expect($location.path).toHaveBeenCalledWith();
        expect(response).toBe('/recipes/new');
      });

      it('should call $location.path with the path', function() {
        $location.path('/recipes');
        $location.path.reset();

        var response = Route.path('/recipes/new');

        expect($location.path).toHaveBeenCalledWith('/recipes/new');
        expect(response).toBe(Route);
        expect($location.path()).toBe('/recipes/new');
      });
    });

    describe('search >', function() {
      beforeEach(function() {
        $location.search.reset();
      });

      it('should call $location.search with no arguments', function() {
        $location.search({ q: 'keyword' });
        $location.search.reset();

        var response = Route.search();

        expect($location.search).toHaveBeenCalledWith();
        expect(response).toEqual({ q: 'keyword' });
      });

      it('should call $location.search with search, param_value', function() {
        Route.search('q', 'keyword');

        expect($location.search).toHaveBeenCalledWith('q', 'keyword');
      });
    });

    describe('goSearch >', function() {
      it('should call go with the corret parameters', function() {
        Route.go = jasmine.createSpy().andReturn('foo');

        var response = Route.goSearch('recipe.index', 'keyword');

        expect(Route.go).toHaveBeenCalledWith('recipe.index', { q: 'keyword' });
        expect(response).toBe('foo');
      });
    });
  });
});
