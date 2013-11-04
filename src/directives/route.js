'use strict';

angular.module('ra.route.directives', []).
  directive('route', function($parse, Route) {
    return {
      restrict: 'A',
      priority: 99,
      link: function($scope, element, attr) {
        var key,
            query_params;

        function parseRoute(value) {
          if (value) {
            var params = {};

            if (value.indexOf(',') > -1) {
              value  = value.split(',');
              key    = value[0].trim();
              params = value[1].trim();

              if (value[2]) {
                query_params = value[2].trim() === 'true';
              }

              $scope.$watch(params, setRoute, true);
            } else {
              key = value;
              setRoute();
            }
          }
        }

        function setRoute(params) {
          var path = Route.get(key, params, query_params);
          attr.$set('href', path);
        }

        attr.$observe('route', parseRoute);
      }
    };
  });
