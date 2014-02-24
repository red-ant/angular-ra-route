angular-ra-route
================

AngularJS Module: route

## route directive

The route directive allows for easy setting of anchor hrefs utilising the Route service.

The following basic AngularJS app will be used throughout the examples, so take heed.

```js
angular.module('MyCoolApp', ['ra.route']).
  config(function(RouteProvider) {
    RouteProvider.base('recipes', '/recipes').
      when('index').
      when('edit',      '/:id/edit').
      when('edit-type', '/:id/edit/:category').
      when('show',      '/:id');
  }).
  
  controller('Recipe', function($scope) {
    $scope.recipe = {
      id: 21,
      name: 'Jerked chicken'
    };
    
    $scope.category = 'chicken';
  });
```

## route 

Please note: all the following route-* attributes are reliant on this directive.

The easiest and dirtiest method, which will cover the majority of cases.

In the form of route="lookup\_key[, params[, append\_query]]"

- lookup_key: the key specified in the RouteProvider
- object: object to replace parameter placeholders
- append_query: any leftover parameters will be appended as a query string

```html
<a route="recipe.index">Recipe index</a>
<!-- Will become -->
<a href="/recipes">Recipe index</a>

<a route="recipe.edit, recipe">Edit: Jerked chicken</a>
<!-- Will become -->
<a href="/recipes/21/edit">Edit: Jerked chicken</a>

<a route="recipe.show, recipe, true">Jerked chicken recipe</a>
<!-- Will become -->
<a href="/recipes/21?name=Jerked+chicken">Jerked chicken recipe</a>
```

### route-params

The param and append_query options in the route directive are not well thought out, and probably should be refactored. If the params is in object notation e.g. { id: 1, ... }, you will have to use the route-params attribute.

```html
<a route="recipe.edit-type" route-params="{ id: 34, type: category }">
  Edit {{ category }} recipe: Jerked chicken
</a>
<!-- Will become -->
<a href="/recipes/34/edit/chicken">
  Edit chicken recipe: Jerked chicken
</a>
```

### route-search

You can append a search query using this attribute.

```html
<a route="recipe.edit-type" route-params="{ id: 34, type: category }" route-search="{ page: 2 }">
  Edit {{ category }} recipe: Jerked chicken
</a>
<!-- Will become -->
<a href="/recipes/34/edit/chicken?page=2">
  Edit chicken recipe: Jerked chicken
</a>
```
