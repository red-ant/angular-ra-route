'use strict';

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
