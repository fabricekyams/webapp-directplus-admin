// Generated by CoffeeScript 1.4.0
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define(['jquery', 'backbone', 'application/views/organisationView'], function($, Backbone, OrganisationView) {
  var mainView;
  return mainView = (function(_super) {

    __extends(mainView, _super);

    function mainView() {
      return mainView.__super__.constructor.apply(this, arguments);
    }

    mainView.prototype.el = '#header';

    mainView.prototype.initialize = function() {
      var conference,
        _this = this;
      this.listenTo(this.model, 'change:organisations', this.render);
      this.listenTo(this.model, 'new', function(data) {
        return _this.renderNew(data);
      });
      conference = this.model.get('conference');
      $('.emissions').delegate('.organisationsList', 'organisationChoosed', function(e, data) {
        return _this.model.organisationChoosed(data);
      });
      $('.conferencesblock').delegate('.confList', 'conferenceChoosed', function(e, data) {
        return _this.model.get('organisation').conferenceChoosed(data);
      });
      $('.confList').delegate('#newConf', 'click', function(evt) {
        return _this.newConf();
      });
      $('.confList').delegate('#deleteconf', 'deleteconf', function(evt, id) {
        return _this.deleteConf(id);
      });
      $('.organisationsList').delegate('#newOrg', 'click', function(evt) {
        return _this.newOrg();
      });
      $('.organisationsList').delegate('#deleteorg', 'deleteorg', function(evt, id) {
        return _this.deleteOrg(id);
      });
      $('.confsblock').delegate('.update-org', 'click', function(evt) {
        var form;
        form = $('.orgsettings form').serializeArray();
        return _this.updateOrg(form);
      });
      $('.slider').delegate('#delete', 'deleteSlide', function(e, data) {
        return _this["delete"](data, 'deleteSlide');
      });
      $('.slider').delegate('#preview', 'click', function(e) {
        return _this.itemAction(e, 'previewSlide');
      });
      $('#modal-update').click(function(e) {
        var form, type;
        form = $('.modal-body form').serializeArray();
        type = $('.modal-legend').attr('id');
        return _this["new"](e, form, type);
      });
      $('#sendbt').click(function(e) {
        e.preventDefault();
        return _this.envoyer();
      });
      $('#rembt').click(function(e) {
        e.preventDefault();
        return _this.recuperer();
      });
      $('#savebt').click(function(e) {
        return _this.save();
      });
      return $('.dpr').click(function(e) {
        console.log("datepick");
        return $('.dp').datepicker('show');
      });
    };

    mainView.prototype.render = function() {
      $('.organisation').remove();
      console.log("main view is redenring");
      return this.model.get('organisations').each(function(organisation) {
        var organisationView;
        organisationView = new OrganisationView({
          model: organisation
        });
        return $('.organisationsList').prepend(organisationView.render().el);
      });
    };

    mainView.prototype.renderNew = function(organisation) {
      var organisationView;
      organisationView = new OrganisationView({
        model: organisation
      });
      return $('.organisationsList').prepend(organisationView.render().el);
    };

    mainView.prototype.envoyer = function() {
      var id;
      id = $('input:radio[name=slides]:checked').attr('id');
      console.log(id);
      return this.trigger('sendslide', id);
    };

    mainView.prototype.recuperer = function() {
      var id;
      id = $('input:radio[name=slides]:checked').attr('id');
      return this.trigger('removeslide', id);
    };

    mainView.prototype.itemAction = function(e, eventitem) {
      var id;
      id = $(e.target).parent().prev().attr('id');
      console.log(eventitem);
      return this.trigger(eventitem, id);
    };

    mainView.prototype["delete"] = function(data) {
      console.log('je dois detruire ce slide: ', data);
      return this.trigger('deleteSlide', data);
    };

    mainView.prototype.preview = function(e) {};

    mainView.prototype.update = function(e, form) {
      var slide;
      slide = this.getContentForm(form, 'slide');
      slide._id = $('.modal-body').attr('id');
      slide.type = $('.modal-body').attr('data');
      slide._conf = this.model.get('organisation').get('conference').get('_id');
      this.trigger('updateSlide', slide);
      return $('#myModal').modal('hide');
    };

    mainView.prototype.save = function() {
      var conference, form, slide;
      form = $('.tab-pane.active > form').serializeArray();
      if ($('.tab-pane.active').attr('id') === 'settings') {
        conference = this.getContentForm(form, 'settings');
        conference._id = this.model.get('organisation').get('conference').get('_id');
        return this.trigger('updateConference', conference);
      } else {
        slide = this.getContentForm(form, 'slide');
        slide.type = $('.tab-pane.active').attr('id');
        slide._conf = this.model.get('organisation').get('conference').get('_id');
        return console.log(slide);
      }
    };

    mainView.prototype.getContentForm = function(form, type) {
      var nameg, o, obj, slide;
      console.log(form);
      obj = {};
      slide = {};
      for (o in form) {
        nameg = form[o].name;
        obj[nameg] = form[o].value;
      }
      if (type === 'slide') {
        slide.jsonData = JSON.stringify(obj);
      } else {
        slide = obj;
      }
      return slide;
    };

    mainView.prototype.newConf = function() {
      $(".modal-body").children().remove();
      console.log($("#settings form").html());
      $("#settings form").clone().appendTo(".modal-body");
      $(".modal-body legend").addClass("modal-legend");
      $(".modal-legend").attr("id", "conference");
      return this.setDate();
    };

    mainView.prototype.newOrg = function() {
      var html;
      $(".modal-body").children().remove();
      html = $('#orgsettings-template').html();
      $(".modal-body").append(html);
      $(".modal-body legend").addClass("modal-legend");
      return $(".modal-legend").attr("id", "organisation");
    };

    mainView.prototype.saveConf = function(e, form) {
      var conference;
      console.log($('.datepicker').attr('data-date'));
      conference = this.getContentForm(form, 'conference');
      conference._orga = this.model.get('organisation').get('_id');
      conference.date = $('.datepicker').attr('data-date');
      console.log(conference);
      console.log($('.datepicker').data('datepicker').getDate());
      return this.trigger('newConference', conference);
    };

    mainView.prototype.saveOrg = function(e, form) {
      var organisation;
      organisation = this.getContentForm(form, 'organisation');
      console.log(organisation);
      this.trigger('newOrganisation', organisation);
      return $('#myModal').modal('hide');
    };

    mainView.prototype["new"] = function(e, form, type) {
      switch (type) {
        case 'conference':
          return this.saveConf(e, form);
        case 'organisation':
          return this.saveOrg(e, form);
        case 'slide':
          return this.update(e, form);
      }
    };

    mainView.prototype.deleteOrg = function(id) {
      return this.trigger('deleteorg', id);
    };

    mainView.prototype.deleteConf = function(id) {
      return this.trigger('deleteconf', id);
    };

    mainView.prototype.updateOrg = function(form) {
      var organisation;
      organisation = this.getContentForm(form, 'organisation');
      organisation._id = $('.orgsettings').attr('data-id');
      console.log(organisation);
      return this.trigger('updateorg', organisation);
    };

    mainView.prototype.setDate = function() {
      var now,
        _this = this;
      now = new Date();
      $('.datepicker').attr('data-date', now);
      $('.timepicker').timepicker('showWidget');
      return $('.datepicker').datepicker({
        startDate: now
      }).on('changeDate', function(ev) {
        var newDate;
        newDate = new Date(ev.date);
        return $('.datepicker').attr('data-date', newDate);
      }).data('datepicker');
    };

    return mainView;

  })(Backbone.View);
});
