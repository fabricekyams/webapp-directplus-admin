// Generated by CoffeeScript 1.4.0
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define(['jquery', 'backbone', 'backbonels', 'application/views/slideView', 'application/models/slide'], function($, Backbone, Backbonels, slideView, Slide) {
  var slides;
  return slides = (function(_super) {

    __extends(slides, _super);

    function slides() {
      this.comparator = __bind(this.comparator, this);
      return slides.__super__.constructor.apply(this, arguments);
    }

    slides.prototype.model = Slide;

    slides.prototype.localStorage = new Backbonels("slidesStore");

    slides.prototype.position = 0;

    slides.prototype.comparator = function(item) {
      return item.get("Order");
    };

    return slides;

  })(Backbone.Collection);
});