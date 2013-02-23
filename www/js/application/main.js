// Generated by CoffeeScript 1.3.3

requirejs.config({
  baseUrl: 'js/',
  paths: {
    jquery: 'vendors/jquery/jquery',
    underscore: 'vendors/underscore/underscore',
    backbone: 'vendors/backbone/backbone',
    bootstrap: 'vendors/bootstrap/bootstrap',
    text: 'vendors/require/text'
  },
  shim: {
    backbone: {
      deps: ['jquery', 'underscore'],
      exports: 'Backbone'
    },
    underscore: {
      exports: '_'
    },
    bootstrap: ['jquery']
  },
  wait: '5s'
});

require(['backbone', 'jquery', 'application/application', 'bootstrap'], function(Backbone, $, Application) {
  return $(function() {
    var App;
    App = new Application();
    return App.init();
  });
});
