// Generated by CoffeeScript 1.4.0
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define(['jquery', 'backbone', 'application/collections/slides', 'application/models/slide'], function($, Backbone, Slides, Slide) {
  var Conference;
  return Conference = (function(_super) {

    __extends(Conference, _super);

    Conference.prototype.defaults = {
      slidesC: new Slides(),
      count: 0,
      date: new Date(),
      descrition: "",
      name: ""
    };

    function Conference(aConf) {
      Conference.__super__.constructor.call(this, aConf);
    }

    Conference.prototype.initialize = function() {};

    Conference.prototype.restore = function(data) {
      var len, newCount, x, _i;
      console.log("restore");
      console.log(data);
      this.get('slidesC').reset();
      len = data.length - 1;
      if (len >= 0) {
        localStorage.clear();
        this.get('slidesC').fetch();
        len = data.length - 1;
        for (x = _i = 0; 0 <= len ? _i <= len : _i >= len; x = 0 <= len ? ++_i : --_i) {
          this.addSlide(data[x]);
          this.get('slidesC').fetch();
        }
        this.get('slidesC').sort();
        newCount = this.get('slidesC').at(this.get('slidesC').length - 1).get('Order');
      }
      return this.trigger('change:slidesC');
    };

    Conference.prototype.sent = function(data) {
      var slides;
      console.log('je suis la Conference et j envoi ça:', data);
      slides = this.get('slidesC').where({
        _id: data
      });
      console.log('je suis la conference et voici ce que jai trouvé dans mes modele: ', slides[0]);
      return slides[0].set('sent', true);
    };

    Conference.prototype.back = function(data) {
      var slides;
      slides = this.get('slidesC').where({
        _id: data
      });
      console.log(slides[0]);
      return slides[0].set('sent', false);
    };

    Conference.prototype["new"] = function(data) {
      this.addSlide(data);
      console.log("new triggered");
      return this.trigger('new', this.get('slidesC').get(data._id));
    };

    Conference.prototype["delete"] = function(data) {
      console.log('sur le point de supprimer le slide d id:', data);
      return this.get('slidesC').remove(this.get('slidesC').get(data));
    };

    Conference.prototype.update = function(data) {
      var obj,
        _this = this;
      console.log("sur le point de mettre à jour le slide");
      obj = $.parseJSON(data.JsonData);
      return $.each(obj, function(key, val) {
        return _this.get('slidesC').get(data._id).set(key, val);
      });
    };

    Conference.prototype.addSlide = function(dataSlide) {
      var obj, slide;
      obj = $.parseJSON(dataSlide.JsonData);
      obj.id = dataSlide._id;
      slide = new Slide(obj);
      slide.set("conf", dataSlide._conf);
      slide.set("sent", dataSlide.Sent);
      slide.set("_id", dataSlide._id);
      slide.set("Order", dataSlide.Order);
      slide.set("Type", dataSlide.Type);
      this.get('slidesC').add(slide);
      return slide.save();
    };

    return Conference;

  })(Backbone.Model);
});
