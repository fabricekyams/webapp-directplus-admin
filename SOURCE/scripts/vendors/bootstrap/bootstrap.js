/*!
* Timepicker Component for Twitter Bootstrap
*
* Copyright 2013 Joris de Wit
*
* Contributors https://github.com/jdewit/bootstrap-timepicker/graphs/contributors
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/
(function($, window, document, undefined) {
  'use strict';

  // TIMEPICKER PUBLIC CLASS DEFINITION
  var Timepicker = function(element, options) {
    this.widget = '';
    this.$element = $(element);
    this.defaultTime = options.defaultTime;
    this.disableFocus = options.disableFocus;
    this.isOpen = options.isOpen;
    this.minuteStep = options.minuteStep;
    this.modalBackdrop = options.modalBackdrop;
    this.secondStep = options.secondStep;
    this.showInputs = options.showInputs;
    this.showMeridian = options.showMeridian;
    this.showSeconds = options.showSeconds;
    this.template = options.template;
    this.appendWidgetTo = options.appendWidgetTo;

    this._init();
  };

  Timepicker.prototype = {

    constructor: Timepicker,

    _init: function() {
      var self = this;

      if (this.$element.parent().hasClass('input-append') || this.$element.parent().hasClass('input-prepend')) {
        this.$element.parent('.input-append, .input-prepend').find('.add-on').on({
          'click.timepicker': $.proxy(this.showWidget, this)
        });
        this.$element.on({
          'focus.timepicker': $.proxy(this.highlightUnit, this),
          'click.timepicker': $.proxy(this.highlightUnit, this),
          'keydown.timepicker': $.proxy(this.elementKeydown, this),
          'blur.timepicker': $.proxy(this.blurElement, this)
        });
      } else {
        if (this.template) {
          this.$element.on({
            'focus.timepicker': $.proxy(this.showWidget, this),
            'click.timepicker': $.proxy(this.showWidget, this),
            'blur.timepicker': $.proxy(this.blurElement, this)
          });
        } else {
          this.$element.on({
            'focus.timepicker': $.proxy(this.highlightUnit, this),
            'click.timepicker': $.proxy(this.highlightUnit, this),
            'keydown.timepicker': $.proxy(this.elementKeydown, this),
            'blur.timepicker': $.proxy(this.blurElement, this)
          });
        }
      }

      if (this.template !== false) {
        this.$widget = $(this.getTemplate()).prependTo(this.$element.parents(this.appendWidgetTo)).on('click', $.proxy(this.widgetClick, this));
      } else {
        this.$widget = false;
      }

      if (this.showInputs && this.$widget !== false) {
        this.$widget.find('input').each(function() {
          $(this).on({
            'click.timepicker': function() { $(this).select(); },
            'keydown.timepicker': $.proxy(self.widgetKeydown, self)
          });
        });
      }

      this.setDefaultTime(this.defaultTime);
    },

    blurElement: function() {
      this.highlightedUnit = undefined;
      this.updateFromElementVal();
    },

    decrementHour: function() {
      if (this.showMeridian) {
        if (this.hour === 1) {
          this.hour = 12;
        } else if (this.hour === 12) {
          this.hour--;

          return this.toggleMeridian();
        } else if (this.hour === 0) {
          this.hour = 11;

          return this.toggleMeridian();
        } else {
          this.hour--;
        }
      } else {
        if (this.hour === 0) {
          this.hour = 23;
        } else {
          this.hour--;
        }
      }
      this.update();
    },

    decrementMinute: function(step) {
      var newVal;

      if (step) {
        newVal = this.minute - step;
      } else {
        newVal = this.minute - this.minuteStep;
      }

      if (newVal < 0) {
        this.decrementHour();
        this.minute = newVal + 60;
      } else {
        this.minute = newVal;
      }
      this.update();
    },

    decrementSecond: function() {
      var newVal = this.second - this.secondStep;

      if (newVal < 0) {
        this.decrementMinute(true);
        this.second = newVal + 60;
      } else {
        this.second = newVal;
      }
      this.update();
    },

    elementKeydown: function(e) {
      switch (e.keyCode) {
      case 9: //tab
        this.updateFromElementVal();

        switch (this.highlightedUnit) {
        case 'hour':
          e.preventDefault();
          this.highlightNextUnit();
          break;
        case 'minute':
          if (this.showMeridian || this.showSeconds) {
            e.preventDefault();
            this.highlightNextUnit();
          }
          break;
        case 'second':
          if (this.showMeridian) {
            e.preventDefault();
            this.highlightNextUnit();
          }
          break;
        }
        break;
      case 27: // escape
        this.updateFromElementVal();
        break;
      case 37: // left arrow
        e.preventDefault();
        this.highlightPrevUnit();
        this.updateFromElementVal();
        break;
      case 38: // up arrow
        e.preventDefault();
        switch (this.highlightedUnit) {
        case 'hour':
          this.incrementHour();
          this.highlightHour();
          break;
        case 'minute':
          this.incrementMinute();
          this.highlightMinute();
          break;
        case 'second':
          this.incrementSecond();
          this.highlightSecond();
          break;
        case 'meridian':
          this.toggleMeridian();
          this.highlightMeridian();
          break;
        }
        break;
      case 39: // right arrow
        e.preventDefault();
        this.updateFromElementVal();
        this.highlightNextUnit();
        break;
      case 40: // down arrow
        e.preventDefault();
        switch (this.highlightedUnit) {
        case 'hour':
          this.decrementHour();
          this.highlightHour();
          break;
        case 'minute':
          this.decrementMinute();
          this.highlightMinute();
          break;
        case 'second':
          this.decrementSecond();
          this.highlightSecond();
          break;
        case 'meridian':
          this.toggleMeridian();
          this.highlightMeridian();
          break;
        }
        break;
      }
    },

    formatTime: function(hour, minute, second, meridian) {
      hour = hour < 10 ? '0' + hour : hour;
      minute = minute < 10 ? '0' + minute : minute;
      second = second < 10 ? '0' + second : second;

      return hour + ':' + minute + (this.showSeconds ? ':' + second : '') + (this.showMeridian ? ' ' + meridian : '');
    },

    getCursorPosition: function() {
      var input = this.$element.get(0);

      if ('selectionStart' in input) {// Standard-compliant browsers

        return input.selectionStart;
      } else if (document.selection) {// IE fix
        input.focus();
        var sel = document.selection.createRange(),
          selLen = document.selection.createRange().text.length;

        sel.moveStart('character', - input.value.length);

        return sel.text.length - selLen;
      }
    },

    getTemplate: function() {
      var template,
        hourTemplate,
        minuteTemplate,
        secondTemplate,
        meridianTemplate,
        templateContent;

      if (this.showInputs) {
        hourTemplate = '<input type="text" name="hour" class="bootstrap-timepicker-hour" maxlength="2"/>';
        minuteTemplate = '<input type="text" name="minute" class="bootstrap-timepicker-minute" maxlength="2"/>';
        secondTemplate = '<input type="text" name="second" class="bootstrap-timepicker-second" maxlength="2"/>';
        meridianTemplate = '<input type="text" name="meridian" class="bootstrap-timepicker-meridian" maxlength="2"/>';
      } else {
        hourTemplate = '<span class="bootstrap-timepicker-hour"></span>';
        minuteTemplate = '<span class="bootstrap-timepicker-minute"></span>';
        secondTemplate = '<span class="bootstrap-timepicker-second"></span>';
        meridianTemplate = '<span class="bootstrap-timepicker-meridian"></span>';
      }

      templateContent = '<table>'+
         '<tr>'+
           '<td><a href="#" data-action="incrementHour"><i class="icon-chevron-up"></i></a></td>'+
           '<td class="separator">&nbsp;</td>'+
           '<td><a href="#" data-action="incrementMinute"><i class="icon-chevron-up"></i></a></td>'+
           (this.showSeconds ?
             '<td class="separator">&nbsp;</td>'+
             '<td><a href="#" data-action="incrementSecond"><i class="icon-chevron-up"></i></a></td>'
           : '') +
           (this.showMeridian ?
             '<td class="separator">&nbsp;</td>'+
             '<td class="meridian-column"><a href="#" data-action="toggleMeridian"><i class="icon-chevron-up"></i></a></td>'
           : '') +
         '</tr>'+
         '<tr>'+
           '<td>'+ hourTemplate +'</td> '+
           '<td class="separator">:</td>'+
           '<td>'+ minuteTemplate +'</td> '+
           (this.showSeconds ?
            '<td class="separator">:</td>'+
            '<td>'+ secondTemplate +'</td>'
           : '') +
           (this.showMeridian ?
            '<td class="separator">&nbsp;</td>'+
            '<td>'+ meridianTemplate +'</td>'
           : '') +
         '</tr>'+
         '<tr>'+
           '<td><a href="#" data-action="decrementHour"><i class="icon-chevron-down"></i></a></td>'+
           '<td class="separator"></td>'+
           '<td><a href="#" data-action="decrementMinute"><i class="icon-chevron-down"></i></a></td>'+
           (this.showSeconds ?
            '<td class="separator">&nbsp;</td>'+
            '<td><a href="#" data-action="decrementSecond"><i class="icon-chevron-down"></i></a></td>'
           : '') +
           (this.showMeridian ?
            '<td class="separator">&nbsp;</td>'+
            '<td><a href="#" data-action="toggleMeridian"><i class="icon-chevron-down"></i></a></td>'
           : '') +
         '</tr>'+
       '</table>';

      switch(this.template) {
      case 'modal':
        template = '<div class="bootstrap-timepicker-widget modal hide fade in" data-backdrop="'+ (this.modalBackdrop ? 'true' : 'false') +'">'+
          '<div class="modal-header">'+
            '<a href="#" class="close" data-dismiss="modal">×</a>'+
            '<h3>Pick a Time</h3>'+
          '</div>'+
          '<div class="modal-content">'+
            templateContent +
          '</div>'+
          '<div class="modal-footer">'+
            '<a href="#" class="btn btn-primary" data-dismiss="modal">OK</a>'+
          '</div>'+
        '</div>';
        break;
      case 'dropdown':
        template = '<div class="bootstrap-timepicker-widget dropdown-menu">'+ templateContent +'</div>';
        break;
      }

      return template;
    },

    getTime: function() {
      return this.formatTime(this.hour, this.minute, this.second, this.meridian);
    },

    hideWidget: function() {
      if (this.isOpen === false) {
        return;
      }

if (this.showInputs) {
this.updateFromWidgetInputs();
}

      this.$element.trigger({
        'type': 'hide.timepicker',
        'time': {
          'value': this.getTime(),
          'hours': this.hour,
          'minutes': this.minute,
          'seconds': this.second,
          'meridian': this.meridian
        }
      });

      if (this.template === 'modal' && this.$widget.modal) {
        this.$widget.modal('hide');
      } else {
        this.$widget.removeClass('open');
      }

      $(document).off('mousedown.timepicker');

      this.isOpen = false;
    },

    highlightUnit: function() {
      this.position = this.getCursorPosition();
      if (this.position >= 0 && this.position <= 2) {
        this.highlightHour();
      } else if (this.position >= 3 && this.position <= 5) {
        this.highlightMinute();
      } else if (this.position >= 6 && this.position <= 8) {
        if (this.showSeconds) {
          this.highlightSecond();
        } else {
          this.highlightMeridian();
        }
      } else if (this.position >= 9 && this.position <= 11) {
        this.highlightMeridian();
      }
    },

    highlightNextUnit: function() {
      switch (this.highlightedUnit) {
      case 'hour':
        this.highlightMinute();
        break;
      case 'minute':
        if (this.showSeconds) {
          this.highlightSecond();
        } else if (this.showMeridian){
          this.highlightMeridian();
        } else {
          this.highlightHour();
        }
        break;
      case 'second':
        if (this.showMeridian) {
          this.highlightMeridian();
        } else {
          this.highlightHour();
        }
        break;
      case 'meridian':
        this.highlightHour();
        break;
      }
    },

    highlightPrevUnit: function() {
      switch (this.highlightedUnit) {
      case 'hour':
        this.highlightMeridian();
        break;
      case 'minute':
        this.highlightHour();
        break;
      case 'second':
        this.highlightMinute();
        break;
      case 'meridian':
        if (this.showSeconds) {
          this.highlightSecond();
        } else {
          this.highlightMinute();
        }
        break;
      }
    },

    highlightHour: function() {
      var $element = this.$element.get(0);

      this.highlightedUnit = 'hour';

if ($element.setSelectionRange) {
setTimeout(function() {
$element.setSelectionRange(0,2);
}, 0);
}
    },

    highlightMinute: function() {
      var $element = this.$element.get(0);

      this.highlightedUnit = 'minute';

if ($element.setSelectionRange) {
setTimeout(function() {
$element.setSelectionRange(3,5);
}, 0);
}
    },

    highlightSecond: function() {
      var $element = this.$element.get(0);

      this.highlightedUnit = 'second';

if ($element.setSelectionRange) {
setTimeout(function() {
$element.setSelectionRange(6,8);
}, 0);
}
    },

    highlightMeridian: function() {
      var $element = this.$element.get(0);

      this.highlightedUnit = 'meridian';

if ($element.setSelectionRange) {
if (this.showSeconds) {
setTimeout(function() {
$element.setSelectionRange(9,11);
}, 0);
} else {
setTimeout(function() {
$element.setSelectionRange(6,8);
}, 0);
}
}
    },

    incrementHour: function() {
      if (this.showMeridian) {
        if (this.hour === 11) {
          this.hour++;
          return this.toggleMeridian();
        } else if (this.hour === 12) {
          this.hour = 0;
        }
      }
      if (this.hour === 23) {
        this.hour = 0;

        return;
      }
      this.hour++;
      this.update();
    },

    incrementMinute: function(step) {
      var newVal;

      if (step) {
        newVal = this.minute + step;
      } else {
        newVal = this.minute + this.minuteStep - (this.minute % this.minuteStep);
      }

      if (newVal > 59) {
        this.incrementHour();
        this.minute = newVal - 60;
      } else {
        this.minute = newVal;
      }
      this.update();
    },

    incrementSecond: function() {
      var newVal = this.second + this.secondStep - (this.second % this.secondStep);

      if (newVal > 59) {
        this.incrementMinute(true);
        this.second = newVal - 60;
      } else {
        this.second = newVal;
      }
      this.update();
    },

    remove: function() {
      $('document').off('.timepicker');
      if (this.$widget) {
        this.$widget.remove();
      }
      delete this.$element.data().timepicker;
    },

    setDefaultTime: function(defaultTime){
      if (!this.$element.val()) {
        if (defaultTime === 'current') {
          var dTime = new Date(),
            hours = dTime.getHours(),
            minutes = Math.floor(dTime.getMinutes() / this.minuteStep) * this.minuteStep,
            seconds = Math.floor(dTime.getSeconds() / this.secondStep) * this.secondStep,
            meridian = 'AM';

          if (this.showMeridian) {
            if (hours === 0) {
              hours = 12;
            } else if (hours >= 12) {
              if (hours > 12) {
                hours = hours - 12;
              }
              meridian = 'PM';
            } else {
              meridian = 'AM';
            }
          }

          this.hour = hours;
          this.minute = minutes;
          this.second = seconds;
          this.meridian = meridian;

          this.update();

        } else if (defaultTime === false) {
          this.hour = 0;
          this.minute = 0;
          this.second = 0;
          this.meridian = 'AM';
        } else {
          this.setTime(defaultTime);
        }
      } else {
        this.updateFromElementVal();
      }
    },

    setTime: function(time) {
      var arr,
        timeArray;

      if (this.showMeridian) {
        arr = time.split(' ');
        timeArray = arr[0].split(':');
        this.meridian = arr[1];
      } else {
        timeArray = time.split(':');
      }

      this.hour = parseInt(timeArray[0], 10);
      this.minute = parseInt(timeArray[1], 10);
      this.second = parseInt(timeArray[2], 10);

      if (isNaN(this.hour)) {
        this.hour = 0;
      }
      if (isNaN(this.minute)) {
        this.minute = 0;
      }

      if (this.showMeridian) {
        if (this.hour > 12) {
          this.hour = 12;
        } else if (this.hour < 1) {
          this.hour = 12;
        }

        if (this.meridian === 'am' || this.meridian === 'a') {
          this.meridian = 'AM';
        } else if (this.meridian === 'pm' || this.meridian === 'p') {
          this.meridian = 'PM';
        }

        if (this.meridian !== 'AM' && this.meridian !== 'PM') {
          this.meridian = 'AM';
        }
      } else {
        if (this.hour >= 24) {
          this.hour = 23;
        } else if (this.hour < 0) {
          this.hour = 0;
        }
      }

      if (this.minute < 0) {
        this.minute = 0;
      } else if (this.minute >= 60) {
        this.minute = 59;
      }

      if (this.showSeconds) {
        if (isNaN(this.second)) {
          this.second = 0;
        } else if (this.second < 0) {
          this.second = 0;
        } else if (this.second >= 60) {
          this.second = 59;
        }
      }

      this.update();
    },

    showWidget: function() {
      if (this.isOpen) {
        return;
      }

      if (this.$element.is(':disabled')) {
        return;
      }

      var self = this;
      $(document).on('mousedown.timepicker', function (e) {
        // Clicked outside the timepicker, hide it
        if ($(e.target).closest('.bootstrap-timepicker-widget').length === 0) {
          self.hideWidget();
        }
      });

      this.$element.trigger({
        'type': 'show.timepicker',
        'time': {
          'value': this.getTime(),
          'hours': this.hour,
          'minutes': this.minute,
          'seconds': this.second,
          'meridian': this.meridian
        }
      });

      if (this.disableFocus) {
        this.$element.blur();
      }

      this.updateFromElementVal();

      if (this.template === 'modal' && this.$widget.modal) {
        this.$widget.modal('show').on('hidden', $.proxy(this.hideWidget, this));
      } else {
        if (this.isOpen === false) {
          this.$widget.addClass('open');
        }
      }

      this.isOpen = true;
    },

    toggleMeridian: function() {
      this.meridian = this.meridian === 'AM' ? 'PM' : 'AM';
      this.update();
    },

    update: function() {
      this.$element.trigger({
        'type': 'changeTime.timepicker',
        'time': {
          'value': this.getTime(),
          'hours': this.hour,
          'minutes': this.minute,
          'seconds': this.second,
          'meridian': this.meridian
        }
      });

      this.updateElement();
      this.updateWidget();
    },

    updateElement: function() {
      this.$element.val(this.getTime()).change();
    },

    updateFromElementVal: function() {
var val = this.$element.val();

if (val) {
this.setTime(val);
}
    },

    updateWidget: function() {
      if (this.$widget === false) {
        return;
      }

      var hour = this.hour < 10 ? '0' + this.hour : this.hour,
          minute = this.minute < 10 ? '0' + this.minute : this.minute,
          second = this.second < 10 ? '0' + this.second : this.second;

      if (this.showInputs) {
        this.$widget.find('input.bootstrap-timepicker-hour').val(hour);
        this.$widget.find('input.bootstrap-timepicker-minute').val(minute);

        if (this.showSeconds) {
          this.$widget.find('input.bootstrap-timepicker-second').val(second);
        }
        if (this.showMeridian) {
          this.$widget.find('input.bootstrap-timepicker-meridian').val(this.meridian);
        }
      } else {
        this.$widget.find('span.bootstrap-timepicker-hour').text(hour);
        this.$widget.find('span.bootstrap-timepicker-minute').text(minute);

        if (this.showSeconds) {
          this.$widget.find('span.bootstrap-timepicker-second').text(second);
        }
        if (this.showMeridian) {
          this.$widget.find('span.bootstrap-timepicker-meridian').text(this.meridian);
        }
      }
    },

    updateFromWidgetInputs: function() {
      if (this.$widget === false) {
        return;
      }
      var time = $('input.bootstrap-timepicker-hour', this.$widget).val() + ':' +
        $('input.bootstrap-timepicker-minute', this.$widget).val() +
        (this.showSeconds ? ':' + $('input.bootstrap-timepicker-second', this.$widget).val() : '') +
        (this.showMeridian ? ' ' + $('input.bootstrap-timepicker-meridian', this.$widget).val() : '');

      this.setTime(time);
    },

    widgetClick: function(e) {
      e.stopPropagation();
      e.preventDefault();

      var action = $(e.target).closest('a').data('action');
      if (action) {
        this[action]();
      }
    },

    widgetKeydown: function(e) {
      var $input = $(e.target).closest('input'),
          name = $input.attr('name');

      switch (e.keyCode) {
      case 9: //tab
        if (this.showMeridian) {
          if (name === 'meridian') {
            return this.hideWidget();
          }
        } else {
          if (this.showSeconds) {
            if (name === 'second') {
              return this.hideWidget();
            }
          } else {
            if (name === 'minute') {
              return this.hideWidget();
            }
          }
        }

        this.updateFromWidgetInputs();
        break;
      case 27: // escape
        this.hideWidget();
        break;
      case 38: // up arrow
        e.preventDefault();
        switch (name) {
        case 'hour':
          this.incrementHour();
          break;
        case 'minute':
          this.incrementMinute();
          break;
        case 'second':
          this.incrementSecond();
          break;
        case 'meridian':
          this.toggleMeridian();
          break;
        }
        break;
      case 40: // down arrow
        e.preventDefault();
        switch (name) {
        case 'hour':
          this.decrementHour();
          break;
        case 'minute':
          this.decrementMinute();
          break;
        case 'second':
          this.decrementSecond();
          break;
        case 'meridian':
          this.toggleMeridian();
          break;
        }
        break;
      }
    }
  };


  //TIMEPICKER PLUGIN DEFINITION
  $.fn.timepicker = function(option) {
    var args = Array.apply(null, arguments);
    args.shift();
    return this.each(function() {
      var $this = $(this),
        data = $this.data('timepicker'),
        options = typeof option === 'object' && option;

      if (!data) {
        $this.data('timepicker', (data = new Timepicker(this, $.extend({}, $.fn.timepicker.defaults, options, $(this).data()))));
      }

      if (typeof option === 'string') {
        data[option].apply(data, args);
      }
    });
  };

  $.fn.timepicker.defaults = {
    defaultTime: 'current',
    disableFocus: false,
    isOpen: false,
    minuteStep: 15,
    modalBackdrop: false,
    secondStep: 15,
    showSeconds: false,
    showInputs: true,
    showMeridian: true,
    template: 'dropdown',
    appendWidgetTo: '.bootstrap-timepicker'
  };

  $.fn.timepicker.Constructor = Timepicker;

})(jQuery, window, document);

/* =========================================================
* bootstrap-datepicker.js
* http://www.eyecon.ro/bootstrap-datepicker
* =========================================================
* Copyright 2012 Stefan Petre
* Improvements by Andrew Rowls
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
* ========================================================= */

!function( $ ) {

function UTCDate(){
return new Date(Date.UTC.apply(Date, arguments));
}
function UTCToday(){
var today = new Date();
return UTCDate(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
}

// Picker object

var Datepicker = function(element, options) {
var that = this;

this.element = $(element);
this.language = options.language||this.element.data('date-language')||"en";
this.language = this.language in dates ? this.language : this.language.split('-')[0]; //Check if "de-DE" style date is available, if not language should fallback to 2 letter code eg "de"
this.language = this.language in dates ? this.language : "en";
this.isRTL = dates[this.language].rtl||false;
this.format = DPGlobal.parseFormat(options.format||this.element.data('date-format')||dates[this.language].format||'mm/dd/yyyy');
this.isInline = false;
this.isInput = this.element.is('input');
this.component = this.element.is('.date') ? this.element.find('.add-on, .btn') : false;
this.hasInput = this.component && this.element.find('input').length;
if(this.component && this.component.length === 0)
this.component = false;

this.forceParse = true;
if ('forceParse' in options) {
this.forceParse = options.forceParse;
} else if ('dateForceParse' in this.element.data()) {
this.forceParse = this.element.data('date-force-parse');
}

this.picker = $(DPGlobal.template);
this._buildEvents();
this._attachEvents();

if(this.isInline) {
this.picker.addClass('datepicker-inline').appendTo(this.element);
} else {
this.picker.addClass('datepicker-dropdown dropdown-menu');
}
if (this.isRTL){
this.picker.addClass('datepicker-rtl');
this.picker.find('.prev i, .next i')
.toggleClass('icon-arrow-left icon-arrow-right');
}

this.autoclose = false;
if ('autoclose' in options) {
this.autoclose = options.autoclose;
} else if ('dateAutoclose' in this.element.data()) {
this.autoclose = this.element.data('date-autoclose');
}

this.keyboardNavigation = true;
if ('keyboardNavigation' in options) {
this.keyboardNavigation = options.keyboardNavigation;
} else if ('dateKeyboardNavigation' in this.element.data()) {
this.keyboardNavigation = this.element.data('date-keyboard-navigation');
}

this.viewMode = this.startViewMode = 0;
switch(options.startView || this.element.data('date-start-view')){
case 2:
case 'decade':
this.viewMode = this.startViewMode = 2;
break;
case 1:
case 'year':
this.viewMode = this.startViewMode = 1;
break;
}

this.minViewMode = options.minViewMode||this.element.data('date-min-view-mode')||0;
if (typeof this.minViewMode === 'string') {
switch (this.minViewMode) {
case 'months':
this.minViewMode = 1;
break;
case 'years':
this.minViewMode = 2;
break;
default:
this.minViewMode = 0;
break;
}
}

this.viewMode = this.startViewMode = Math.max(this.startViewMode, this.minViewMode);

this.todayBtn = (options.todayBtn||this.element.data('date-today-btn')||false);
this.todayHighlight = (options.todayHighlight||this.element.data('date-today-highlight')||false);

this.calendarWeeks = false;
if ('calendarWeeks' in options) {
this.calendarWeeks = options.calendarWeeks;
} else if ('dateCalendarWeeks' in this.element.data()) {
this.calendarWeeks = this.element.data('date-calendar-weeks');
}
if (this.calendarWeeks)
this.picker.find('tfoot th.today')
.attr('colspan', function(i, val){
return parseInt(val) + 1;
});

this._allow_update = false;

this.weekStart = ((options.weekStart||this.element.data('date-weekstart')||dates[this.language].weekStart||0) % 7);
this.weekEnd = ((this.weekStart + 6) % 7);
this.startDate = -Infinity;
this.endDate = Infinity;
this.daysOfWeekDisabled = [];
this.beforeShowDay = options.beforeShowDay || $.noop;
this.setStartDate(options.startDate||this.element.data('date-startdate'));
this.setEndDate(options.endDate||this.element.data('date-enddate'));
this.setDaysOfWeekDisabled(options.daysOfWeekDisabled||this.element.data('date-days-of-week-disabled'));
this.fillDow();
this.fillMonths();
this.setRange(options.range);

this._allow_update = true;

this.update();
this.showMode();

if(this.isInline) {
this.show();
}
};

Datepicker.prototype = {
constructor: Datepicker,

_events: [],
_secondaryEvents: [],
_applyEvents: function(evs){
for (var i=0, el, ev; i<evs.length; i++){
el = evs[i][0];
ev = evs[i][1];
el.on(ev);
}
},
_unapplyEvents: function(evs){
for (var i=0, el, ev; i<evs.length; i++){
el = evs[i][0];
ev = evs[i][1];
el.off(ev);
}
},
_buildEvents: function(){
if (this.isInput) { // single input
this._events = [
[this.element, {
focus: $.proxy(this.show, this),
keyup: $.proxy(this.update, this),
keydown: $.proxy(this.keydown, this)
}]
];
}
else if (this.component && this.hasInput){ // component: input + button
this._events = [
// For components that are not readonly, allow keyboard nav
[this.element.find('input'), {
focus: $.proxy(this.show, this),
keyup: $.proxy(this.update, this),
keydown: $.proxy(this.keydown, this)
}],
[this.component, {
click: $.proxy(this.show, this)
}]
];
}
else if (this.element.is('div')) { // inline datepicker
this.isInline = true;
}
else {
this._events = [
[this.element, {
click: $.proxy(this.show, this)
}]
];
}

this._secondaryEvents = [
[this.picker, {
click: $.proxy(this.click, this)
}],
[$(window), {
resize: $.proxy(this.place, this)
}],
[$(document), {
mousedown: $.proxy(function (e) {
// Clicked outside the datepicker, hide it
if ($(e.target).closest('.datepicker.datepicker-inline, .datepicker.datepicker-dropdown').length === 0) {
this.hide();
}
}, this)
}]
];
},
_attachEvents: function(){
this._detachEvents();
this._applyEvents(this._events);
},
_detachEvents: function(){
this._unapplyEvents(this._events);
},
_attachSecondaryEvents: function(){
this._detachSecondaryEvents();
this._applyEvents(this._secondaryEvents);
},
_detachSecondaryEvents: function(){
this._unapplyEvents(this._secondaryEvents);
},
_trigger: function(event, altdate){
var date = altdate || this.date;
date = new Date(date.getTime() + (date.getTimezoneOffset()*60000));

this.element.trigger({
type: event,
date: date,
format: $.proxy(function(altformat){
var format = this.format;
if (altformat)
format = DPGlobal.parseFormat(altformat);
return DPGlobal.formatDate(date, format, this.language);
}, this)
});
},

show: function(e) {
if (!this.isInline)
this.picker.appendTo('body');
this.picker.show();
this.height = this.component ? this.component.outerHeight() : this.element.outerHeight();
this.place();
this._attachSecondaryEvents();
if (e) {
e.preventDefault();
}
this._trigger('show');
},

hide: function(e){
if(this.isInline) return;
if (!this.picker.is(':visible')) return;
this.picker.hide().detach();
this._detachSecondaryEvents();
this.viewMode = this.startViewMode;
this.showMode();

if (
this.forceParse &&
(
this.isInput && this.element.val() ||
this.hasInput && this.element.find('input').val()
)
)
this.setValue();
this._trigger('hide');
},

remove: function() {
this.hide();
this._detachEvents();
this._detachSecondaryEvents();
this.picker.remove();
delete this.element.data().datepicker;
if (!this.isInput) {
delete this.element.data().date;
}
},

getDate: function() {
var d = this.getUTCDate();
return new Date(d.getTime() + (d.getTimezoneOffset()*60000));
},

getUTCDate: function() {
return this.date;
},

setDate: function(d) {
this.setUTCDate(new Date(d.getTime() - (d.getTimezoneOffset()*60000)));
},

setUTCDate: function(d) {
this.date = d;
this.setValue();
},

setValue: function() {
var formatted = this.getFormattedDate();
if (!this.isInput) {
if (this.component){
this.element.find('input').val(formatted);
}
} else {
this.element.val(formatted);
}
},

getFormattedDate: function(format) {
if (format === undefined)
format = this.format;
return DPGlobal.formatDate(this.date, format, this.language);
},

setStartDate: function(startDate){
this.startDate = startDate||-Infinity;
if (this.startDate !== -Infinity) {
this.startDate = DPGlobal.parseDate(this.startDate, this.format, this.language);
}
this.update();
this.updateNavArrows();
},

setEndDate: function(endDate){
this.endDate = endDate||Infinity;
if (this.endDate !== Infinity) {
this.endDate = DPGlobal.parseDate(this.endDate, this.format, this.language);
}
this.update();
this.updateNavArrows();
},

setDaysOfWeekDisabled: function(daysOfWeekDisabled){
this.daysOfWeekDisabled = daysOfWeekDisabled||[];
if (!$.isArray(this.daysOfWeekDisabled)) {
this.daysOfWeekDisabled = this.daysOfWeekDisabled.split(/,\s*/);
}
this.daysOfWeekDisabled = $.map(this.daysOfWeekDisabled, function (d) {
return parseInt(d, 10);
});
this.update();
this.updateNavArrows();
},

place: function(){
if(this.isInline) return;
var zIndex = parseInt(this.element.parents().filter(function() {
return $(this).css('z-index') != 'auto';
}).first().css('z-index'))+10;
var offset = this.component ? this.component.parent().offset() : this.element.offset();
var height = this.component ? this.component.outerHeight(true) : this.element.outerHeight(true);
this.picker.css({
top: offset.top + height,
left: offset.left,
zIndex: zIndex
});
},

_allow_update: true,
update: function(){
if (!this._allow_update) return;

var date, fromArgs = false;
if(arguments && arguments.length && (typeof arguments[0] === 'string' || arguments[0] instanceof Date)) {
date = arguments[0];
fromArgs = true;
} else {
date = this.isInput ? this.element.val() : this.element.data('date') || this.element.find('input').val();
delete this.element.data().date;
}

this.date = DPGlobal.parseDate(date, this.format, this.language);

if(fromArgs) this.setValue();

if (this.date < this.startDate) {
this.viewDate = new Date(this.startDate);
} else if (this.date > this.endDate) {
this.viewDate = new Date(this.endDate);
} else {
this.viewDate = new Date(this.date);
}
this.fill();
},

fillDow: function(){
var dowCnt = this.weekStart,
html = '<tr>';
if(this.calendarWeeks){
var cell = '<th class="cw">&nbsp;</th>';
html += cell;
this.picker.find('.datepicker-days thead tr:first-child').prepend(cell);
}
while (dowCnt < this.weekStart + 7) {
html += '<th class="dow">'+dates[this.language].daysMin[(dowCnt++)%7]+'</th>';
}
html += '</tr>';
this.picker.find('.datepicker-days thead').append(html);
},

fillMonths: function(){
var html = '',
i = 0;
while (i < 12) {
html += '<span class="month">'+dates[this.language].monthsShort[i++]+'</span>';
}
this.picker.find('.datepicker-months td').html(html);
},

setRange: function(range){
if (!range || !range.length)
delete this.range;
else
this.range = $.map(range, function(d){ return d.valueOf(); });
this.fill();
},

getClassNames: function(date){
var cls = [],
year = this.viewDate.getUTCFullYear(),
month = this.viewDate.getUTCMonth(),
currentDate = this.date.valueOf(),
today = new Date();
if (date.getUTCFullYear() < year || (date.getUTCFullYear() == year && date.getUTCMonth() < month)) {
cls.push('old');
} else if (date.getUTCFullYear() > year || (date.getUTCFullYear() == year && date.getUTCMonth() > month)) {
cls.push('new');
}
// Compare internal UTC date with local today, not UTC today
if (this.todayHighlight &&
date.getUTCFullYear() == today.getFullYear() &&
date.getUTCMonth() == today.getMonth() &&
date.getUTCDate() == today.getDate()) {
cls.push('today');
}
if (currentDate && date.valueOf() == currentDate) {
cls.push('active');
}
if (date.valueOf() < this.startDate || date.valueOf() > this.endDate ||
$.inArray(date.getUTCDay(), this.daysOfWeekDisabled) !== -1) {
cls.push('disabled');
}
if (this.range){
if (date > this.range[0] && date < this.range[this.range.length-1]){
cls.push('range');
}
if ($.inArray(date.valueOf(), this.range) != -1){
cls.push('selected');
}
}
return cls;
},

fill: function() {
var d = new Date(this.viewDate),
year = d.getUTCFullYear(),
month = d.getUTCMonth(),
startYear = this.startDate !== -Infinity ? this.startDate.getUTCFullYear() : -Infinity,
startMonth = this.startDate !== -Infinity ? this.startDate.getUTCMonth() : -Infinity,
endYear = this.endDate !== Infinity ? this.endDate.getUTCFullYear() : Infinity,
endMonth = this.endDate !== Infinity ? this.endDate.getUTCMonth() : Infinity,
currentDate = this.date && this.date.valueOf(),
tooltip;
this.picker.find('.datepicker-days thead th.datepicker-switch')
.text(dates[this.language].months[month]+' '+year);
this.picker.find('tfoot th.today')
.text(dates[this.language].today)
.toggle(this.todayBtn !== false);
this.updateNavArrows();
this.fillMonths();
var prevMonth = UTCDate(year, month-1, 28,0,0,0,0),
day = DPGlobal.getDaysInMonth(prevMonth.getUTCFullYear(), prevMonth.getUTCMonth());
prevMonth.setUTCDate(day);
prevMonth.setUTCDate(day - (prevMonth.getUTCDay() - this.weekStart + 7)%7);
var nextMonth = new Date(prevMonth);
nextMonth.setUTCDate(nextMonth.getUTCDate() + 42);
nextMonth = nextMonth.valueOf();
var html = [];
var clsName;
while(prevMonth.valueOf() < nextMonth) {
if (prevMonth.getUTCDay() == this.weekStart) {
html.push('<tr>');
if(this.calendarWeeks){
// ISO 8601: First week contains first thursday.
// ISO also states week starts on Monday, but we can be more abstract here.
var
// Start of current week: based on weekstart/current date
ws = new Date(+prevMonth + (this.weekStart - prevMonth.getUTCDay() - 7) % 7 * 864e5),
// Thursday of this week
th = new Date(+ws + (7 + 4 - ws.getUTCDay()) % 7 * 864e5),
// First Thursday of year, year from thursday
yth = new Date(+(yth = UTCDate(th.getUTCFullYear(), 0, 1)) + (7 + 4 - yth.getUTCDay())%7*864e5),
// Calendar week: ms between thursdays, div ms per day, div 7 days
calWeek = (th - yth) / 864e5 / 7 + 1;
html.push('<td class="cw">'+ calWeek +'</td>');

}
}
clsName = this.getClassNames(prevMonth);
clsName.push('day');

var before = this.beforeShowDay(prevMonth);
if (before === undefined)
before = {};
else if (typeof(before) === 'boolean')
before = {enabled: before};
else if (typeof(before) === 'string')
before = {classes: before};
if (before.enabled === false)
clsName.push('disabled');
if (before.classes)
clsName = clsName.concat(before.classes.split(/\s+/));
if (before.tooltip)
tooltip = before.tooltip;

clsName = $.unique(clsName);
html.push('<td class="'+clsName.join(' ')+'"' + (tooltip ? ' title="'+tooltip+'"' : '') + '>'+prevMonth.getUTCDate() + '</td>');
if (prevMonth.getUTCDay() == this.weekEnd) {
html.push('</tr>');
}
prevMonth.setUTCDate(prevMonth.getUTCDate()+1);
}
this.picker.find('.datepicker-days tbody').empty().append(html.join(''));
var currentYear = this.date && this.date.getUTCFullYear();

var months = this.picker.find('.datepicker-months')
.find('th:eq(1)')
.text(year)
.end()
.find('span').removeClass('active');
if (currentYear && currentYear == year) {
months.eq(this.date.getUTCMonth()).addClass('active');
}
if (year < startYear || year > endYear) {
months.addClass('disabled');
}
if (year == startYear) {
months.slice(0, startMonth).addClass('disabled');
}
if (year == endYear) {
months.slice(endMonth+1).addClass('disabled');
}

html = '';
year = parseInt(year/10, 10) * 10;
var yearCont = this.picker.find('.datepicker-years')
.find('th:eq(1)')
.text(year + '-' + (year + 9))
.end()
.find('td');
year -= 1;
for (var i = -1; i < 11; i++) {
html += '<span class="year'+(i == -1 || i == 10 ? ' old' : '')+(currentYear == year ? ' active' : '')+(year < startYear || year > endYear ? ' disabled' : '')+'">'+year+'</span>';
year += 1;
}
yearCont.html(html);
},

updateNavArrows: function() {
if (!this._allow_update) return;

var d = new Date(this.viewDate),
year = d.getUTCFullYear(),
month = d.getUTCMonth();
switch (this.viewMode) {
case 0:
if (this.startDate !== -Infinity && year <= this.startDate.getUTCFullYear() && month <= this.startDate.getUTCMonth()) {
this.picker.find('.prev').css({visibility: 'hidden'});
} else {
this.picker.find('.prev').css({visibility: 'visible'});
}
if (this.endDate !== Infinity && year >= this.endDate.getUTCFullYear() && month >= this.endDate.getUTCMonth()) {
this.picker.find('.next').css({visibility: 'hidden'});
} else {
this.picker.find('.next').css({visibility: 'visible'});
}
break;
case 1:
case 2:
if (this.startDate !== -Infinity && year <= this.startDate.getUTCFullYear()) {
this.picker.find('.prev').css({visibility: 'hidden'});
} else {
this.picker.find('.prev').css({visibility: 'visible'});
}
if (this.endDate !== Infinity && year >= this.endDate.getUTCFullYear()) {
this.picker.find('.next').css({visibility: 'hidden'});
} else {
this.picker.find('.next').css({visibility: 'visible'});
}
break;
}
},

click: function(e) {
e.preventDefault();
var target = $(e.target).closest('span, td, th');
if (target.length == 1) {
switch(target[0].nodeName.toLowerCase()) {
case 'th':
switch(target[0].className) {
case 'datepicker-switch':
this.showMode(1);
break;
case 'prev':
case 'next':
var dir = DPGlobal.modes[this.viewMode].navStep * (target[0].className == 'prev' ? -1 : 1);
switch(this.viewMode){
case 0:
this.viewDate = this.moveMonth(this.viewDate, dir);
break;
case 1:
case 2:
this.viewDate = this.moveYear(this.viewDate, dir);
break;
}
this.fill();
break;
case 'today':
var date = new Date();
date = UTCDate(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);

this.showMode(-2);
var which = this.todayBtn == 'linked' ? null : 'view';
this._setDate(date, which);
break;
}
break;
case 'span':
if (!target.is('.disabled')) {
this.viewDate.setUTCDate(1);
if (target.is('.month')) {
var day = 1;
var month = target.parent().find('span').index(target);
var year = this.viewDate.getUTCFullYear();
this.viewDate.setUTCMonth(month);
this._trigger('changeMonth', this.viewDate);
if ( this.minViewMode == 1 ) {
this._setDate(UTCDate(year, month, day,0,0,0,0));
}
} else {
var year = parseInt(target.text(), 10)||0;
var day = 1;
var month = 0;
this.viewDate.setUTCFullYear(year);
this._trigger('changeYear', this.viewDate);
if ( this.minViewMode == 2 ) {
this._setDate(UTCDate(year, month, day,0,0,0,0));
}
}
this.showMode(-1);
this.fill();
}
break;
case 'td':
if (target.is('.day') && !target.is('.disabled')){
var day = parseInt(target.text(), 10)||1;
var year = this.viewDate.getUTCFullYear(),
month = this.viewDate.getUTCMonth();
if (target.is('.old')) {
if (month === 0) {
month = 11;
year -= 1;
} else {
month -= 1;
}
} else if (target.is('.new')) {
if (month == 11) {
month = 0;
year += 1;
} else {
month += 1;
}
}
this._setDate(UTCDate(year, month, day,0,0,0,0));
}
break;
}
}
},

_setDate: function(date, which){
if (!which || which == 'date')
this.date = date;
if (!which || which == 'view')
this.viewDate = date;
this.fill();
this.setValue();
this._trigger('changeDate');
var element;
if (this.isInput) {
element = this.element;
} else if (this.component){
element = this.element.find('input');
}
if (element) {
element.change();
if (this.autoclose && (!which || which == 'date')) {
this.hide();
}
}
},

moveMonth: function(date, dir){
if (!dir) return date;
var new_date = new Date(date.valueOf()),
day = new_date.getUTCDate(),
month = new_date.getUTCMonth(),
mag = Math.abs(dir),
new_month, test;
dir = dir > 0 ? 1 : -1;
if (mag == 1){
test = dir == -1
// If going back one month, make sure month is not current month
// (eg, Mar 31 -> Feb 31 == Feb 28, not Mar 02)
? function(){ return new_date.getUTCMonth() == month; }
// If going forward one month, make sure month is as expected
// (eg, Jan 31 -> Feb 31 == Feb 28, not Mar 02)
: function(){ return new_date.getUTCMonth() != new_month; };
new_month = month + dir;
new_date.setUTCMonth(new_month);
// Dec -> Jan (12) or Jan -> Dec (-1) -- limit expected date to 0-11
if (new_month < 0 || new_month > 11)
new_month = (new_month + 12) % 12;
} else {
// For magnitudes >1, move one month at a time...
for (var i=0; i<mag; i++)
// ...which might decrease the day (eg, Jan 31 to Feb 28, etc)...
new_date = this.moveMonth(new_date, dir);
// ...then reset the day, keeping it in the new month
new_month = new_date.getUTCMonth();
new_date.setUTCDate(day);
test = function(){ return new_month != new_date.getUTCMonth(); };
}
// Common date-resetting loop -- if date is beyond end of month, make it
// end of month
while (test()){
new_date.setUTCDate(--day);
new_date.setUTCMonth(new_month);
}
return new_date;
},

moveYear: function(date, dir){
return this.moveMonth(date, dir*12);
},

dateWithinRange: function(date){
return date >= this.startDate && date <= this.endDate;
},

keydown: function(e){
if (this.picker.is(':not(:visible)')){
if (e.keyCode == 27) // allow escape to hide and re-show picker
this.show();
return;
}
var dateChanged = false,
dir, day, month,
newDate, newViewDate;
switch(e.keyCode){
case 27: // escape
this.hide();
e.preventDefault();
break;
case 37: // left
case 39: // right
if (!this.keyboardNavigation) break;
dir = e.keyCode == 37 ? -1 : 1;
if (e.ctrlKey){
newDate = this.moveYear(this.date, dir);
newViewDate = this.moveYear(this.viewDate, dir);
} else if (e.shiftKey){
newDate = this.moveMonth(this.date, dir);
newViewDate = this.moveMonth(this.viewDate, dir);
} else {
newDate = new Date(this.date);
newDate.setUTCDate(this.date.getUTCDate() + dir);
newViewDate = new Date(this.viewDate);
newViewDate.setUTCDate(this.viewDate.getUTCDate() + dir);
}
if (this.dateWithinRange(newDate)){
this.date = newDate;
this.viewDate = newViewDate;
this.setValue();
this.update();
e.preventDefault();
dateChanged = true;
}
break;
case 38: // up
case 40: // down
if (!this.keyboardNavigation) break;
dir = e.keyCode == 38 ? -1 : 1;
if (e.ctrlKey){
newDate = this.moveYear(this.date, dir);
newViewDate = this.moveYear(this.viewDate, dir);
} else if (e.shiftKey){
newDate = this.moveMonth(this.date, dir);
newViewDate = this.moveMonth(this.viewDate, dir);
} else {
newDate = new Date(this.date);
newDate.setUTCDate(this.date.getUTCDate() + dir * 7);
newViewDate = new Date(this.viewDate);
newViewDate.setUTCDate(this.viewDate.getUTCDate() + dir * 7);
}
if (this.dateWithinRange(newDate)){
this.date = newDate;
this.viewDate = newViewDate;
this.setValue();
this.update();
e.preventDefault();
dateChanged = true;
}
break;
case 13: // enter
this.hide();
e.preventDefault();
break;
case 9: // tab
this.hide();
break;
}
if (dateChanged){
this._trigger('changeDate');
var element;
if (this.isInput) {
element = this.element;
} else if (this.component){
element = this.element.find('input');
}
if (element) {
element.change();
}
}
},

showMode: function(dir) {
if (dir) {
this.viewMode = Math.max(this.minViewMode, Math.min(2, this.viewMode + dir));
}
/*
vitalets: fixing bug of very special conditions:
jquery 1.7.1 + webkit + show inline datepicker in bootstrap popover.
Method show() does not set display css correctly and datepicker is not shown.
Changed to .css('display', 'block') solve the problem.
See https://github.com/vitalets/x-editable/issues/37

In jquery 1.7.2+ everything works fine.
*/
//this.picker.find('>div').hide().filter('.datepicker-'+DPGlobal.modes[this.viewMode].clsName).show();
this.picker.find('>div').hide().filter('.datepicker-'+DPGlobal.modes[this.viewMode].clsName).css('display', 'block');
this.updateNavArrows();
}
};

var DateRangePicker = function(element, options){
this.element = $(element);
this.inputs = $.map(options.inputs, function(i){ return i.jquery ? i[0] : i; });
delete options.inputs;

$(this.inputs)
.datepicker(options)
.bind('changeDate', $.proxy(this.dateUpdated, this));

this.pickers = $.map(this.inputs, function(i){ return $(i).data('datepicker'); });
this.updateDates();
};
DateRangePicker.prototype = {
updateDates: function(){
this.dates = $.map(this.pickers, function(i){ return i.date; });
this.updateRanges();
},
updateRanges: function(){
var range = $.map(this.dates, function(d){ return d.valueOf(); });
$.each(this.pickers, function(i, p){
p.setRange(range);
});
},
dateUpdated: function(e){
var dp = $(e.target).data('datepicker'),
new_date = e.date,
i = $.inArray(e.target, this.inputs),
l = this.inputs.length;
if (i == -1) return;

if (new_date < this.dates[i]){
// Date being moved earlier/left
while (i>=0 && new_date < this.dates[i]){
this.pickers[i--].setUTCDate(new_date);
}
}
else if (new_date > this.dates[i]){
// Date being moved later/right
while (i<l && new_date > this.dates[i]){
this.pickers[i++].setUTCDate(new_date);
}
}
this.updateDates();
},
remove: function(){
$.map(this.pickers, function(p){ p.remove(); });
delete this.element.data().datepicker;
}
};

var old = $.fn.datepicker;
$.fn.datepicker = function ( option ) {
var args = Array.apply(null, arguments);
args.shift();
return this.each(function () {
var $this = $(this),
data = $this.data('datepicker'),
options = typeof option == 'object' && option;
if (!data) {
if ($this.is('.input-daterange') || options.inputs){
var opts = {
inputs: options.inputs || $this.find('input').toArray()
};
$this.data('datepicker', (data = new DateRangePicker(this, $.extend(opts, $.fn.datepicker.defaults,options))));
}
else{
$this.data('datepicker', (data = new Datepicker(this, $.extend({}, $.fn.datepicker.defaults,options))));
}
}
if (typeof option == 'string' && typeof data[option] == 'function') {
data[option].apply(data, args);
}
});
};

$.fn.datepicker.defaults = {
};
$.fn.datepicker.Constructor = Datepicker;
var dates = $.fn.datepicker.dates = {
en: {
days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
today: "Today"
}
};

var DPGlobal = {
modes: [
{
clsName: 'days',
navFnc: 'Month',
navStep: 1
},
{
clsName: 'months',
navFnc: 'FullYear',
navStep: 1
},
{
clsName: 'years',
navFnc: 'FullYear',
navStep: 10
}],
isLeapYear: function (year) {
return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
},
getDaysInMonth: function (year, month) {
return [31, (DPGlobal.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
},
validParts: /dd?|DD?|mm?|MM?|yy(?:yy)?/g,
nonpunctuation: /[^ -\/:-@\[\u3400-\u9fff-`{-~\t\n\r]+/g,
parseFormat: function(format){
// IE treats \0 as a string end in inputs (truncating the value),
// so it's a bad format delimiter, anyway
var separators = format.replace(this.validParts, '\0').split('\0'),
parts = format.match(this.validParts);
if (!separators || !separators.length || !parts || parts.length === 0){
throw new Error("Invalid date format.");
}
return {separators: separators, parts: parts};
},
parseDate: function(date, format, language) {
if (date instanceof Date) return date;
if (/^[\-+]\d+[dmwy]([\s,]+[\-+]\d+[dmwy])*$/.test(date)) {
var part_re = /([\-+]\d+)([dmwy])/,
parts = date.match(/([\-+]\d+)([dmwy])/g),
part, dir;
date = new Date();
for (var i=0; i<parts.length; i++) {
part = part_re.exec(parts[i]);
dir = parseInt(part[1]);
switch(part[2]){
case 'd':
date.setUTCDate(date.getUTCDate() + dir);
break;
case 'm':
date = Datepicker.prototype.moveMonth.call(Datepicker.prototype, date, dir);
break;
case 'w':
date.setUTCDate(date.getUTCDate() + dir * 7);
break;
case 'y':
date = Datepicker.prototype.moveYear.call(Datepicker.prototype, date, dir);
break;
}
}
return UTCDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0);
}
var parts = date && date.match(this.nonpunctuation) || [],
date = new Date(),
parsed = {},
setters_order = ['yyyy', 'yy', 'M', 'MM', 'm', 'mm', 'd', 'dd'],
setters_map = {
yyyy: function(d,v){ return d.setUTCFullYear(v); },
yy: function(d,v){ return d.setUTCFullYear(2000+v); },
m: function(d,v){
v -= 1;
while (v<0) v += 12;
v %= 12;
d.setUTCMonth(v);
while (d.getUTCMonth() != v)
d.setUTCDate(d.getUTCDate()-1);
return d;
},
d: function(d,v){ return d.setUTCDate(v); }
},
val, filtered, part;
setters_map['M'] = setters_map['MM'] = setters_map['mm'] = setters_map['m'];
setters_map['dd'] = setters_map['d'];
date = UTCDate(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
var fparts = format.parts.slice();
// Remove noop parts
if (parts.length != fparts.length) {
fparts = $(fparts).filter(function(i,p){
return $.inArray(p, setters_order) !== -1;
}).toArray();
}
// Process remainder
if (parts.length == fparts.length) {
for (var i=0, cnt = fparts.length; i < cnt; i++) {
val = parseInt(parts[i], 10);
part = fparts[i];
if (isNaN(val)) {
switch(part) {
case 'MM':
filtered = $(dates[language].months).filter(function(){
var m = this.slice(0, parts[i].length),
p = parts[i].slice(0, m.length);
return m == p;
});
val = $.inArray(filtered[0], dates[language].months) + 1;
break;
case 'M':
filtered = $(dates[language].monthsShort).filter(function(){
var m = this.slice(0, parts[i].length),
p = parts[i].slice(0, m.length);
return m == p;
});
val = $.inArray(filtered[0], dates[language].monthsShort) + 1;
break;
}
}
parsed[part] = val;
}
for (var i=0, s; i<setters_order.length; i++){
s = setters_order[i];
if (s in parsed && !isNaN(parsed[s]))
setters_map[s](date, parsed[s]);
}
}
return date;
},
formatDate: function(date, format, language){
var val = {
d: date.getUTCDate(),
D: dates[language].daysShort[date.getUTCDay()],
DD: dates[language].days[date.getUTCDay()],
m: date.getUTCMonth() + 1,
M: dates[language].monthsShort[date.getUTCMonth()],
MM: dates[language].months[date.getUTCMonth()],
yy: date.getUTCFullYear().toString().substring(2),
yyyy: date.getUTCFullYear()
};
val.dd = (val.d < 10 ? '0' : '') + val.d;
val.mm = (val.m < 10 ? '0' : '') + val.m;
var date = [],
seps = $.extend([], format.separators);
for (var i=0, cnt = format.parts.length; i < cnt; i++) {
if (seps.length)
date.push(seps.shift());
date.push(val[format.parts[i]]);
}
return date.join('');
},
headTemplate: '<thead>'+
'<tr>'+
'<th class="prev"><i class="icon-arrow-left"/></th>'+
'<th colspan="5" class="datepicker-switch"></th>'+
'<th class="next"><i class="icon-arrow-right"/></th>'+
'</tr>'+
'</thead>',
contTemplate: '<tbody><tr><td colspan="7"></td></tr></tbody>',
footTemplate: '<tfoot><tr><th colspan="7" class="today"></th></tr></tfoot>'
};
DPGlobal.template = '<div class="datepicker">'+
'<div class="datepicker-days">'+
'<table class=" table-condensed">'+
DPGlobal.headTemplate+
'<tbody></tbody>'+
DPGlobal.footTemplate+
'</table>'+
'</div>'+
'<div class="datepicker-months">'+
'<table class="table-condensed">'+
DPGlobal.headTemplate+
DPGlobal.contTemplate+
DPGlobal.footTemplate+
'</table>'+
'</div>'+
'<div class="datepicker-years">'+
'<table class="table-condensed">'+
DPGlobal.headTemplate+
DPGlobal.contTemplate+
DPGlobal.footTemplate+
'</table>'+
'</div>'+
'</div>';

$.fn.datepicker.DPGlobal = DPGlobal;


/* DATEPICKER NO CONFLICT
* =================== */

$.fn.datepicker.noConflict = function(){
$.fn.datepicker = old;
return this;
};


/* DATEPICKER DATA-API
* ================== */

$(document).on(
'focus.datepicker.data-api click.datepicker.data-api',
'[data-provide="datepicker"]',
function(e){
var $this = $(this);
if ($this.data('datepicker')) return;
e.preventDefault();
// component click requires us to explicitly show it
$this.datepicker('show');
}
);
$(function(){
$('[data-provide="datepicker-inline"]').datepicker();
});

}( window.jQuery )
/* ===================================================
 * bootstrap-transition.js v2.3.0
 * http://twitter.github.com/bootstrap/javascript.html#transitions
 * ===================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


  /* CSS TRANSITION SUPPORT (http://www.modernizr.com/)
   * ======================================================= */

  $(function () {

    $.support.transition = (function () {

      var transitionEnd = (function () {

        var el = document.createElement('bootstrap')
          , transEndEventNames = {
               'WebkitTransition' : 'webkitTransitionEnd'
            ,  'MozTransition'    : 'transitionend'
            ,  'OTransition'      : 'oTransitionEnd otransitionend'
            ,  'transition'       : 'transitionend'
            }
          , name

        for (name in transEndEventNames){
          if (el.style[name] !== undefined) {
            return transEndEventNames[name]
          }
        }

      }())

      return transitionEnd && {
        end: transitionEnd
      }

    })()

  })

}(window.jQuery);/* ==========================================================
 * bootstrap-alert.js v2.3.0
 * http://twitter.github.com/bootstrap/javascript.html#alerts
 * ==========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* ALERT CLASS DEFINITION
  * ====================== */

  var dismiss = '[data-dismiss="alert"]'
    , Alert = function (el) {
        $(el).on('click', dismiss, this.close)
      }

  Alert.prototype.close = function (e) {
    var $this = $(this)
      , selector = $this.attr('data-target')
      , $parent

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
    }

    $parent = $(selector)

    e && e.preventDefault()

    $parent.length || ($parent = $this.hasClass('alert') ? $this : $this.parent())

    $parent.trigger(e = $.Event('close'))

    if (e.isDefaultPrevented()) return

    $parent.removeClass('in')

    function removeElement() {
      $parent
        .trigger('closed')
        .remove()
    }

    $.support.transition && $parent.hasClass('fade') ?
      $parent.on($.support.transition.end, removeElement) :
      removeElement()
  }


 /* ALERT PLUGIN DEFINITION
  * ======================= */

  var old = $.fn.alert

  $.fn.alert = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('alert')
      if (!data) $this.data('alert', (data = new Alert(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  $.fn.alert.Constructor = Alert


 /* ALERT NO CONFLICT
  * ================= */

  $.fn.alert.noConflict = function () {
    $.fn.alert = old
    return this
  }


 /* ALERT DATA-API
  * ============== */

  $(document).on('click.alert.data-api', dismiss, Alert.prototype.close)

}(window.jQuery);/* ============================================================
 * bootstrap-button.js v2.3.0
 * http://twitter.github.com/bootstrap/javascript.html#buttons
 * ============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function ($) {

  "use strict"; // jshint ;_;


 /* BUTTON PUBLIC CLASS DEFINITION
  * ============================== */

  var Button = function (element, options) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.button.defaults, options)
  }

  Button.prototype.setState = function (state) {
    var d = 'disabled'
      , $el = this.$element
      , data = $el.data()
      , val = $el.is('input') ? 'val' : 'html'

    state = state + 'Text'
    data.resetText || $el.data('resetText', $el[val]())

    $el[val](data[state] || this.options[state])

    // push to event loop to allow forms to submit
    setTimeout(function () {
      state == 'loadingText' ?
        $el.addClass(d).attr(d, d) :
        $el.removeClass(d).removeAttr(d)
    }, 0)
  }

  Button.prototype.toggle = function () {
    var $parent = this.$element.closest('[data-toggle="buttons-radio"]')

    $parent && $parent
      .find('.active')
      .removeClass('active')

    this.$element.toggleClass('active')
  }


 /* BUTTON PLUGIN DEFINITION
  * ======================== */

  var old = $.fn.button

  $.fn.button = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('button')
        , options = typeof option == 'object' && option
      if (!data) $this.data('button', (data = new Button(this, options)))
      if (option == 'toggle') data.toggle()
      else if (option) data.setState(option)
    })
  }

  $.fn.button.defaults = {
    loadingText: 'loading...'
  }

  $.fn.button.Constructor = Button


 /* BUTTON NO CONFLICT
  * ================== */

  $.fn.button.noConflict = function () {
    $.fn.button = old
    return this
  }


 /* BUTTON DATA-API
  * =============== */

  $(document).on('click.button.data-api', '[data-toggle^=button]', function (e) {
    var $btn = $(e.target)
    if (!$btn.hasClass('btn')) $btn = $btn.closest('.btn')
    $btn.button('toggle')
  })

}(window.jQuery);/* ==========================================================
 * bootstrap-carousel.js v2.3.0
 * http://twitter.github.com/bootstrap/javascript.html#carousel
 * ==========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* CAROUSEL CLASS DEFINITION
  * ========================= */

  var Carousel = function (element, options) {
    this.$element = $(element)
    this.$indicators = this.$element.find('.carousel-indicators')
    this.options = options
    this.options.pause == 'hover' && this.$element
      .on('mouseenter', $.proxy(this.pause, this))
      .on('mouseleave', $.proxy(this.cycle, this))
  }

  Carousel.prototype = {

    cycle: function (e) {
      if (!e) this.paused = false
      if (this.interval) clearInterval(this.interval);
      this.options.interval
        && !this.paused
        && (this.interval = setInterval($.proxy(this.next, this), this.options.interval))
      return this
    }

  , getActiveIndex: function () {
      this.$active = this.$element.find('.item.active')
      this.$items = this.$active.parent().children()
      return this.$items.index(this.$active)
    }

  , to: function (pos) {
      var activeIndex = this.getActiveIndex()
        , that = this

      if (pos > (this.$items.length - 1) || pos < 0) return

      if (this.sliding) {
        return this.$element.one('slid', function () {
          that.to(pos)
        })
      }

      if (activeIndex == pos) {
        return this.pause().cycle()
      }

      return this.slide(pos > activeIndex ? 'next' : 'prev', $(this.$items[pos]))
    }

  , pause: function (e) {
      if (!e) this.paused = true
      if (this.$element.find('.next, .prev').length && $.support.transition.end) {
        this.$element.trigger($.support.transition.end)
        this.cycle()
      }
      clearInterval(this.interval)
      this.interval = null
      return this
    }

  , next: function () {
      if (this.sliding) return
      return this.slide('next')
    }

  , prev: function () {
      if (this.sliding) return
      return this.slide('prev')
    }

  , slide: function (type, next) {
      var $active = this.$element.find('.item.active')
        , $next = next || $active[type]()
        , isCycling = this.interval
        , direction = type == 'next' ? 'left' : 'right'
        , fallback  = type == 'next' ? 'first' : 'last'
        , that = this
        , e

      this.sliding = true

      isCycling && this.pause()

      $next = $next.length ? $next : this.$element.find('.item')[fallback]()

      e = $.Event('slide', {
        relatedTarget: $next[0]
      , direction: direction
      })

      if ($next.hasClass('active')) return

      if (this.$indicators.length) {
        this.$indicators.find('.active').removeClass('active')
        this.$element.one('slid', function () {
          var $nextIndicator = $(that.$indicators.children()[that.getActiveIndex()])
          $nextIndicator && $nextIndicator.addClass('active')
        })
      }

      if ($.support.transition && this.$element.hasClass('slide')) {
        this.$element.trigger(e)
        if (e.isDefaultPrevented()) return
        $next.addClass(type)
        $next[0].offsetWidth // force reflow
        $active.addClass(direction)
        $next.addClass(direction)
        this.$element.one($.support.transition.end, function () {
          $next.removeClass([type, direction].join(' ')).addClass('active')
          $active.removeClass(['active', direction].join(' '))
          that.sliding = false
          setTimeout(function () { that.$element.trigger('slid') }, 0)
        })
      } else {
        this.$element.trigger(e)
        if (e.isDefaultPrevented()) return
        $active.removeClass('active')
        $next.addClass('active')
        this.sliding = false
        this.$element.trigger('slid')
      }

      isCycling && this.cycle()

      return this
    }

  }


 /* CAROUSEL PLUGIN DEFINITION
  * ========================== */

  var old = $.fn.carousel

  $.fn.carousel = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('carousel')
        , options = $.extend({}, $.fn.carousel.defaults, typeof option == 'object' && option)
        , action = typeof option == 'string' ? option : options.slide
      if (!data) $this.data('carousel', (data = new Carousel(this, options)))
      if (typeof option == 'number') data.to(option)
      else if (action) data[action]()
      else if (options.interval) data.pause().cycle()
    })
  }

  $.fn.carousel.defaults = {
    interval: 5000
  , pause: 'hover'
  }

  $.fn.carousel.Constructor = Carousel


 /* CAROUSEL NO CONFLICT
  * ==================== */

  $.fn.carousel.noConflict = function () {
    $.fn.carousel = old
    return this
  }

 /* CAROUSEL DATA-API
  * ================= */

  $(document).on('click.carousel.data-api', '[data-slide], [data-slide-to]', function (e) {
    var $this = $(this), href
      , $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
      , options = $.extend({}, $target.data(), $this.data())
      , slideIndex

    $target.carousel(options)

    if (slideIndex = $this.attr('data-slide-to')) {
      $target.data('carousel').pause().to(slideIndex).cycle()
    }

    e.preventDefault()
  })

}(window.jQuery);/* =============================================================
 * bootstrap-collapse.js v2.3.0
 * http://twitter.github.com/bootstrap/javascript.html#collapse
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function ($) {

  "use strict"; // jshint ;_;


 /* COLLAPSE PUBLIC CLASS DEFINITION
  * ================================ */

  var Collapse = function (element, options) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.collapse.defaults, options)

    if (this.options.parent) {
      this.$parent = $(this.options.parent)
    }

    this.options.toggle && this.toggle()
  }

  Collapse.prototype = {

    constructor: Collapse

  , dimension: function () {
      var hasWidth = this.$element.hasClass('width')
      return hasWidth ? 'width' : 'height'
    }

  , show: function () {
      var dimension
        , scroll
        , actives
        , hasData

      if (this.transitioning || this.$element.hasClass('in')) return

      dimension = this.dimension()
      scroll = $.camelCase(['scroll', dimension].join('-'))
      actives = this.$parent && this.$parent.find('> .accordion-group > .in')

      if (actives && actives.length) {
        hasData = actives.data('collapse')
        if (hasData && hasData.transitioning) return
        actives.collapse('hide')
        hasData || actives.data('collapse', null)
      }

      this.$element[dimension](0)
      this.transition('addClass', $.Event('show'), 'shown')
      $.support.transition && this.$element[dimension](this.$element[0][scroll])
    }

  , hide: function () {
      var dimension
      if (this.transitioning || !this.$element.hasClass('in')) return
      dimension = this.dimension()
      this.reset(this.$element[dimension]())
      this.transition('removeClass', $.Event('hide'), 'hidden')
      this.$element[dimension](0)
    }

  , reset: function (size) {
      var dimension = this.dimension()

      this.$element
        .removeClass('collapse')
        [dimension](size || 'auto')
        [0].offsetWidth

      this.$element[size !== null ? 'addClass' : 'removeClass']('collapse')

      return this
    }

  , transition: function (method, startEvent, completeEvent) {
      var that = this
        , complete = function () {
            if (startEvent.type == 'show') that.reset()
            that.transitioning = 0
            that.$element.trigger(completeEvent)
          }

      this.$element.trigger(startEvent)

      if (startEvent.isDefaultPrevented()) return

      this.transitioning = 1

      this.$element[method]('in')

      $.support.transition && this.$element.hasClass('collapse') ?
        this.$element.one($.support.transition.end, complete) :
        complete()
    }

  , toggle: function () {
      this[this.$element.hasClass('in') ? 'hide' : 'show']()
    }

  }


 /* COLLAPSE PLUGIN DEFINITION
  * ========================== */

  var old = $.fn.collapse

  $.fn.collapse = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('collapse')
        , options = $.extend({}, $.fn.collapse.defaults, $this.data(), typeof option == 'object' && option)
      if (!data) $this.data('collapse', (data = new Collapse(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.collapse.defaults = {
    toggle: true
  }

  $.fn.collapse.Constructor = Collapse


 /* COLLAPSE NO CONFLICT
  * ==================== */

  $.fn.collapse.noConflict = function () {
    $.fn.collapse = old
    return this
  }


 /* COLLAPSE DATA-API
  * ================= */

  $(document).on('click.collapse.data-api', '[data-toggle=collapse]', function (e) {
    var $this = $(this), href
      , target = $this.attr('data-target')
        || e.preventDefault()
        || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '') //strip for ie7
      , option = $(target).data('collapse') ? 'toggle' : $this.data()
    $this[$(target).hasClass('in') ? 'addClass' : 'removeClass']('collapsed')
    $(target).collapse(option)
  })

}(window.jQuery);/* ============================================================
 * bootstrap-dropdown.js v2.3.0
 * http://twitter.github.com/bootstrap/javascript.html#dropdowns
 * ============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function ($) {

  "use strict"; // jshint ;_;


 /* DROPDOWN CLASS DEFINITION
  * ========================= */

  var toggle = '[data-toggle=dropdown]'
    , Dropdown = function (element) {
        var $el = $(element).on('click.dropdown.data-api', this.toggle)
        $('html').on('click.dropdown.data-api', function () {
          $el.parent().removeClass('open')
        })
      }

  Dropdown.prototype = {

    constructor: Dropdown

  , toggle: function (e) {
      var $this = $(this)
        , $parent
        , isActive

      if ($this.is('.disabled, :disabled')) return

      $parent = getParent($this)

      isActive = $parent.hasClass('open')

      clearMenus()

      if (!isActive) {
        $parent.toggleClass('open')
      }

      $this.focus()

      return false
    }

  , keydown: function (e) {
      var $this
        , $items
        , $active
        , $parent
        , isActive
        , index

      if (!/(38|40|27)/.test(e.keyCode)) return

      $this = $(this)

      e.preventDefault()
      e.stopPropagation()

      if ($this.is('.disabled, :disabled')) return

      $parent = getParent($this)

      isActive = $parent.hasClass('open')

      if (!isActive || (isActive && e.keyCode == 27)) {
        if (e.which == 27) $parent.find(toggle).focus()
        return $this.click()
      }

      $items = $('[role=menu] li:not(.divider):visible a', $parent)

      if (!$items.length) return

      index = $items.index($items.filter(':focus'))

      if (e.keyCode == 38 && index > 0) index--                                        // up
      if (e.keyCode == 40 && index < $items.length - 1) index++                        // down
      if (!~index) index = 0

      $items
        .eq(index)
        .focus()
    }

  }

  function clearMenus() {
    $(toggle).each(function () {
      getParent($(this)).removeClass('open')
    })
  }

  function getParent($this) {
    var selector = $this.attr('data-target')
      , $parent

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && /#/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
    }

    $parent = selector && $(selector)

    if (!$parent || !$parent.length) $parent = $this.parent()

    return $parent
  }


  /* DROPDOWN PLUGIN DEFINITION
   * ========================== */

  var old = $.fn.dropdown

  $.fn.dropdown = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('dropdown')
      if (!data) $this.data('dropdown', (data = new Dropdown(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  $.fn.dropdown.Constructor = Dropdown


 /* DROPDOWN NO CONFLICT
  * ==================== */

  $.fn.dropdown.noConflict = function () {
    $.fn.dropdown = old
    return this
  }


  /* APPLY TO STANDARD DROPDOWN ELEMENTS
   * =================================== */

  $(document)
    .on('click.dropdown.data-api', clearMenus)
    .on('click.dropdown.data-api', '.dropdown form', function (e) { e.stopPropagation() })
    .on('.dropdown-menu', function (e) { e.stopPropagation() })
    .on('click.dropdown.data-api'  , toggle, Dropdown.prototype.toggle)
    .on('keydown.dropdown.data-api', toggle + ', [role=menu]' , Dropdown.prototype.keydown)

}(window.jQuery);
/* =========================================================
 * bootstrap-modal.js v2.3.0
 * http://twitter.github.com/bootstrap/javascript.html#modals
 * =========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */


!function ($) {

  "use strict"; // jshint ;_;


 /* MODAL CLASS DEFINITION
  * ====================== */

  var Modal = function (element, options) {
    this.options = options
    this.$element = $(element)
      .delegate('[data-dismiss="modal"]', 'click.dismiss.modal', $.proxy(this.hide, this))
    this.options.remote && this.$element.find('.modal-body').load(this.options.remote)
  }

  Modal.prototype = {

      constructor: Modal

    , toggle: function () {
        return this[!this.isShown ? 'show' : 'hide']()
      }

    , show: function () {
        var that = this
          , e = $.Event('show')

        this.$element.trigger(e)

        if (this.isShown || e.isDefaultPrevented()) return

        this.isShown = true

        this.escape()

        this.backdrop(function () {
          var transition = $.support.transition && that.$element.hasClass('fade')

          if (!that.$element.parent().length) {
            that.$element.appendTo(document.body) //don't move modals dom position
          }

          that.$element.show()

          if (transition) {
            that.$element[0].offsetWidth // force reflow
          }

          that.$element
            .addClass('in')
            .attr('aria-hidden', false)

          that.enforceFocus()

          transition ?
            that.$element.one($.support.transition.end, function () { that.$element.focus().trigger('shown') }) :
            that.$element.focus().trigger('shown')

        })
      }

    , hide: function (e) {
        e && e.preventDefault()

        var that = this

        e = $.Event('hide')

        this.$element.trigger(e)

        if (!this.isShown || e.isDefaultPrevented()) return

        this.isShown = false

        this.escape()

        $(document).off('focusin.modal')

        this.$element
          .removeClass('in')
          .attr('aria-hidden', true)

        $.support.transition && this.$element.hasClass('fade') ?
          this.hideWithTransition() :
          this.hideModal()
      }

    , enforceFocus: function () {
        var that = this
        $(document).on('focusin.modal', function (e) {
          if (that.$element[0] !== e.target && !that.$element.has(e.target).length) {
            that.$element.focus()
          }
        })
      }

    , escape: function () {
        var that = this
        if (this.isShown && this.options.keyboard) {
          this.$element.on('keyup.dismiss.modal', function ( e ) {
            e.which == 27 && that.hide()
          })
        } else if (!this.isShown) {
          this.$element.off('keyup.dismiss.modal')
        }
      }

    , hideWithTransition: function () {
        var that = this
          , timeout = setTimeout(function () {
              that.$element.off($.support.transition.end)
              that.hideModal()
            }, 500)

        this.$element.one($.support.transition.end, function () {
          clearTimeout(timeout)
          that.hideModal()
        })
      }

    , hideModal: function () {
        var that = this
        this.$element.hide()
        this.backdrop(function () {
          that.removeBackdrop()
          that.$element.trigger('hidden')
        })
      }

    , removeBackdrop: function () {
        this.$backdrop.remove()
        this.$backdrop = null
      }

    , backdrop: function (callback) {
        var that = this
          , animate = this.$element.hasClass('fade') ? 'fade' : ''

        if (this.isShown && this.options.backdrop) {
          var doAnimate = $.support.transition && animate

          this.$backdrop = $('<div class="modal-backdrop ' + animate + '" />')
            .appendTo(document.body)

          this.$backdrop.click(
            this.options.backdrop == 'static' ?
              $.proxy(this.$element[0].focus, this.$element[0])
            : $.proxy(this.hide, this)
          )

          if (doAnimate) this.$backdrop[0].offsetWidth // force reflow

          this.$backdrop.addClass('in')

          if (!callback) return

          doAnimate ?
            this.$backdrop.one($.support.transition.end, callback) :
            callback()

        } else if (!this.isShown && this.$backdrop) {
          this.$backdrop.removeClass('in')

          $.support.transition && this.$element.hasClass('fade')?
            this.$backdrop.one($.support.transition.end, callback) :
            callback()

        } else if (callback) {
          callback()
        }
      }
  }


 /* MODAL PLUGIN DEFINITION
  * ======================= */

  var old = $.fn.modal

  $.fn.modal = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('modal')
        , options = $.extend({}, $.fn.modal.defaults, $this.data(), typeof option == 'object' && option)
      if (!data) $this.data('modal', (data = new Modal(this, options)))
      if (typeof option == 'string') data[option]()
      else if (options.show) data.show()
    })
  }

  $.fn.modal.defaults = {
      backdrop: true
    , keyboard: true
    , show: true
  }

  $.fn.modal.Constructor = Modal


 /* MODAL NO CONFLICT
  * ================= */

  $.fn.modal.noConflict = function () {
    $.fn.modal = old
    return this
  }


 /* MODAL DATA-API
  * ============== */

  $(document).on('click.modal.data-api', '[data-toggle="modal"]', function (e) {
    var $this = $(this)
      , href = $this.attr('href')
      , $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''))) //strip for ie7
      , option = $target.data('modal') ? 'toggle' : $.extend({ remote:!/#/.test(href) && href }, $target.data(), $this.data())

    e.preventDefault()

    $target
      .modal(option)
      .one('hide', function () {
        $this.focus()
      })
  })

}(window.jQuery);
/* ===========================================================
 * bootstrap-tooltip.js v2.3.0
 * http://twitter.github.com/bootstrap/javascript.html#tooltips
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ===========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* TOOLTIP PUBLIC CLASS DEFINITION
  * =============================== */

  var Tooltip = function (element, options) {
    this.init('tooltip', element, options)
  }

  Tooltip.prototype = {

    constructor: Tooltip

  , init: function (type, element, options) {
      var eventIn
        , eventOut
        , triggers
        , trigger
        , i

      this.type = type
      this.$element = $(element)
      this.options = this.getOptions(options)
      this.enabled = true

      triggers = this.options.trigger.split(' ')

      for (i = triggers.length; i--;) {
        trigger = triggers[i]
        if (trigger == 'click') {
          this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this))
        } else if (trigger != 'manual') {
          eventIn = trigger == 'hover' ? 'mouseenter' : 'focus'
          eventOut = trigger == 'hover' ? 'mouseleave' : 'blur'
          this.$element.on(eventIn + '.' + this.type, this.options.selector, $.proxy(this.enter, this))
          this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this))
        }
      }

      this.options.selector ?
        (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
        this.fixTitle()
    }

  , getOptions: function (options) {
      options = $.extend({}, $.fn[this.type].defaults, this.$element.data(), options)

      if (options.delay && typeof options.delay == 'number') {
        options.delay = {
          show: options.delay
        , hide: options.delay
        }
      }

      return options
    }

  , enter: function (e) {
      var self = $(e.currentTarget)[this.type](this._options).data(this.type)

      if (!self.options.delay || !self.options.delay.show) return self.show()

      clearTimeout(this.timeout)
      self.hoverState = 'in'
      this.timeout = setTimeout(function() {
        if (self.hoverState == 'in') self.show()
      }, self.options.delay.show)
    }

  , leave: function (e) {
      var self = $(e.currentTarget)[this.type](this._options).data(this.type)

      if (this.timeout) clearTimeout(this.timeout)
      if (!self.options.delay || !self.options.delay.hide) return self.hide()

      self.hoverState = 'out'
      this.timeout = setTimeout(function() {
        if (self.hoverState == 'out') self.hide()
      }, self.options.delay.hide)
    }

  , show: function () {
      var $tip
        , pos
        , actualWidth
        , actualHeight
        , placement
        , tp
        , e = $.Event('show')

      if (this.hasContent() && this.enabled) {
        this.$element.trigger(e)
        if (e.isDefaultPrevented()) return
        $tip = this.tip()
        this.setContent()

        if (this.options.animation) {
          $tip.addClass('fade')
        }

        placement = typeof this.options.placement == 'function' ?
          this.options.placement.call(this, $tip[0], this.$element[0]) :
          this.options.placement

        $tip
          .detach()
          .css({ top: 0, left: 0, display: 'block' })

        this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element)

        pos = this.getPosition()

        actualWidth = $tip[0].offsetWidth
        actualHeight = $tip[0].offsetHeight

        switch (placement) {
          case 'bottom':
            tp = {top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2}
            break
          case 'top':
            tp = {top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2}
            break
          case 'left':
            tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth}
            break
          case 'right':
            tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width}
            break
        }

        this.applyPlacement(tp, placement)
        this.$element.trigger('shown')
      }
    }

  , applyPlacement: function(offset, placement){
      var $tip = this.tip()
        , width = $tip[0].offsetWidth
        , height = $tip[0].offsetHeight
        , actualWidth
        , actualHeight
        , delta
        , replace

      $tip
        .offset(offset)
        .addClass(placement)
        .addClass('in')

      actualWidth = $tip[0].offsetWidth
      actualHeight = $tip[0].offsetHeight

      if (placement == 'top' && actualHeight != height) {
        offset.top = offset.top + height - actualHeight
        replace = true
      }

      if (placement == 'bottom' || placement == 'top') {
        delta = 0

        if (offset.left < 0){
          delta = offset.left * -2
          offset.left = 0
          $tip.offset(offset)
          actualWidth = $tip[0].offsetWidth
          actualHeight = $tip[0].offsetHeight
        }

        this.replaceArrow(delta - width + actualWidth, actualWidth, 'left')
      } else {
        this.replaceArrow(actualHeight - height, actualHeight, 'top')
      }

      if (replace) $tip.offset(offset)
    }

  , replaceArrow: function(delta, dimension, position){
      this
        .arrow()
        .css(position, delta ? (50 * (1 - delta / dimension) + "%") : '')
    }

  , setContent: function () {
      var $tip = this.tip()
        , title = this.getTitle()

      $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](title)
      $tip.removeClass('fade in top bottom left right')
    }

  , hide: function () {
      var that = this
        , $tip = this.tip()
        , e = $.Event('hide')

      this.$element.trigger(e)
      if (e.isDefaultPrevented()) return

      $tip.removeClass('in')

      function removeWithAnimation() {
        var timeout = setTimeout(function () {
          $tip.off($.support.transition.end).detach()
        }, 500)

        $tip.one($.support.transition.end, function () {
          clearTimeout(timeout)
          $tip.detach()
        })
      }

      $.support.transition && this.$tip.hasClass('fade') ?
        removeWithAnimation() :
        $tip.detach()

      this.$element.trigger('hidden')

      return this
    }

  , fixTitle: function () {
      var $e = this.$element
      if ($e.attr('title') || typeof($e.attr('data-original-title')) != 'string') {
        $e.attr('data-original-title', $e.attr('title') || '').attr('title', '')
      }
    }

  , hasContent: function () {
      return this.getTitle()
    }

  , getPosition: function () {
      var el = this.$element[0]
      return $.extend({}, (typeof el.getBoundingClientRect == 'function') ? el.getBoundingClientRect() : {
        width: el.offsetWidth
      , height: el.offsetHeight
      }, this.$element.offset())
    }

  , getTitle: function () {
      var title
        , $e = this.$element
        , o = this.options

      title = $e.attr('data-original-title')
        || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)

      return title
    }

  , tip: function () {
      return this.$tip = this.$tip || $(this.options.template)
    }

  , arrow: function(){
      return this.$arrow = this.$arrow || this.tip().find(".tooltip-arrow")
    }

  , validate: function () {
      if (!this.$element[0].parentNode) {
        this.hide()
        this.$element = null
        this.options = null
      }
    }

  , enable: function () {
      this.enabled = true
    }

  , disable: function () {
      this.enabled = false
    }

  , toggleEnabled: function () {
      this.enabled = !this.enabled
    }

  , toggle: function (e) {
      var self = e ? $(e.currentTarget)[this.type](this._options).data(this.type) : this
      self.tip().hasClass('in') ? self.hide() : self.show()
    }

  , destroy: function () {
      this.hide().$element.off('.' + this.type).removeData(this.type)
    }

  }


 /* TOOLTIP PLUGIN DEFINITION
  * ========================= */

  var old = $.fn.tooltip

  $.fn.tooltip = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('tooltip')
        , options = typeof option == 'object' && option
      if (!data) $this.data('tooltip', (data = new Tooltip(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.tooltip.Constructor = Tooltip

  $.fn.tooltip.defaults = {
    animation: true
  , placement: 'top'
  , selector: false
  , template: '<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
  , trigger: 'hover focus'
  , title: ''
  , delay: 0
  , html: false
  , container: false
  }


 /* TOOLTIP NO CONFLICT
  * =================== */

  $.fn.tooltip.noConflict = function () {
    $.fn.tooltip = old
    return this
  }

}(window.jQuery);
/* ===========================================================
 * bootstrap-popover.js v2.3.0
 * http://twitter.github.com/bootstrap/javascript.html#popovers
 * ===========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* POPOVER PUBLIC CLASS DEFINITION
  * =============================== */

  var Popover = function (element, options) {
    this.init('popover', element, options)
  }


  /* NOTE: POPOVER EXTENDS BOOTSTRAP-TOOLTIP.js
     ========================================== */

  Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype, {

    constructor: Popover

  , setContent: function () {
      var $tip = this.tip()
        , title = this.getTitle()
        , content = this.getContent()

      $tip.find('.popover-title')[this.options.html ? 'html' : 'text'](title)
      $tip.find('.popover-content')[this.options.html ? 'html' : 'text'](content)

      $tip.removeClass('fade top bottom left right in')
    }

  , hasContent: function () {
      return this.getTitle() || this.getContent()
    }

  , getContent: function () {
      var content
        , $e = this.$element
        , o = this.options

      content = (typeof o.content == 'function' ? o.content.call($e[0]) :  o.content)
        || $e.attr('data-content')

      return content
    }

  , tip: function () {
      if (!this.$tip) {
        this.$tip = $(this.options.template)
      }
      return this.$tip
    }

  , destroy: function () {
      this.hide().$element.off('.' + this.type).removeData(this.type)
    }

  })


 /* POPOVER PLUGIN DEFINITION
  * ======================= */

  var old = $.fn.popover

  $.fn.popover = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('popover')
        , options = typeof option == 'object' && option
      if (!data) $this.data('popover', (data = new Popover(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.popover.Constructor = Popover

  $.fn.popover.defaults = $.extend({} , $.fn.tooltip.defaults, {
    placement: 'right'
  , trigger: 'click'
  , content: ''
  , template: '<div class="popover"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
  })


 /* POPOVER NO CONFLICT
  * =================== */

  $.fn.popover.noConflict = function () {
    $.fn.popover = old
    return this
  }

}(window.jQuery);
/* =============================================================
 * bootstrap-scrollspy.js v2.3.0
 * http://twitter.github.com/bootstrap/javascript.html#scrollspy
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* SCROLLSPY CLASS DEFINITION
  * ========================== */

  function ScrollSpy(element, options) {
    var process = $.proxy(this.process, this)
      , $element = $(element).is('body') ? $(window) : $(element)
      , href
    this.options = $.extend({}, $.fn.scrollspy.defaults, options)
    this.$scrollElement = $element.on('scroll.scroll-spy.data-api', process)
    this.selector = (this.options.target
      || ((href = $(element).attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
      || '') + ' .nav li > a'
    this.$body = $('body')
    this.refresh()
    this.process()
  }

  ScrollSpy.prototype = {

      constructor: ScrollSpy

    , refresh: function () {
        var self = this
          , $targets

        this.offsets = $([])
        this.targets = $([])

        $targets = this.$body
          .find(this.selector)
          .map(function () {
            var $el = $(this)
              , href = $el.data('target') || $el.attr('href')
              , $href = /^#\w/.test(href) && $(href)
            return ( $href
              && $href.length
              && [[ $href.position().top + (!$.isWindow(self.$scrollElement.get(0)) && self.$scrollElement.scrollTop()), href ]] ) || null
          })
          .sort(function (a, b) { return a[0] - b[0] })
          .each(function () {
            self.offsets.push(this[0])
            self.targets.push(this[1])
          })
      }

    , process: function () {
        var scrollTop = this.$scrollElement.scrollTop() + this.options.offset
          , scrollHeight = this.$scrollElement[0].scrollHeight || this.$body[0].scrollHeight
          , maxScroll = scrollHeight - this.$scrollElement.height()
          , offsets = this.offsets
          , targets = this.targets
          , activeTarget = this.activeTarget
          , i

        if (scrollTop >= maxScroll) {
          return activeTarget != (i = targets.last()[0])
            && this.activate ( i )
        }

        for (i = offsets.length; i--;) {
          activeTarget != targets[i]
            && scrollTop >= offsets[i]
            && (!offsets[i + 1] || scrollTop <= offsets[i + 1])
            && this.activate( targets[i] )
        }
      }

    , activate: function (target) {
        var active
          , selector

        this.activeTarget = target

        $(this.selector)
          .parent('.active')
          .removeClass('active')

        selector = this.selector
          + '[data-target="' + target + '"],'
          + this.selector + '[href="' + target + '"]'

        active = $(selector)
          .parent('li')
          .addClass('active')

        if (active.parent('.dropdown-menu').length)  {
          active = active.closest('li.dropdown').addClass('active')
        }

        active.trigger('activate')
      }

  }


 /* SCROLLSPY PLUGIN DEFINITION
  * =========================== */

  var old = $.fn.scrollspy

  $.fn.scrollspy = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('scrollspy')
        , options = typeof option == 'object' && option
      if (!data) $this.data('scrollspy', (data = new ScrollSpy(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.scrollspy.Constructor = ScrollSpy

  $.fn.scrollspy.defaults = {
    offset: 10
  }


 /* SCROLLSPY NO CONFLICT
  * ===================== */

  $.fn.scrollspy.noConflict = function () {
    $.fn.scrollspy = old
    return this
  }


 /* SCROLLSPY DATA-API
  * ================== */

  $(window).on('load', function () {
    $('[data-spy="scroll"]').each(function () {
      var $spy = $(this)
      $spy.scrollspy($spy.data())
    })
  })

}(window.jQuery);/* ========================================================
 * bootstrap-tab.js v2.3.0
 * http://twitter.github.com/bootstrap/javascript.html#tabs
 * ========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ======================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* TAB CLASS DEFINITION
  * ==================== */

  var Tab = function (element) {
    this.element = $(element)
  }

  Tab.prototype = {

    constructor: Tab

  , show: function () {
      var $this = this.element
        , $ul = $this.closest('ul:not(.dropdown-menu)')
        , selector = $this.attr('data-target')
        , previous
        , $target
        , e

      if (!selector) {
        selector = $this.attr('href')
        selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
      }

      if ( $this.parent('li').hasClass('active') ) return

      previous = $ul.find('.active:last a')[0]

      e = $.Event('show', {
        relatedTarget: previous
      })

      $this.trigger(e)

      if (e.isDefaultPrevented()) return

      $target = $(selector)

      this.activate($this.parent('li'), $ul)
      this.activate($target, $target.parent(), function () {
        $this.trigger({
          type: 'shown'
        , relatedTarget: previous
        })
      })
    }

  , activate: function ( element, container, callback) {
      var $active = container.find('> .active')
        , transition = callback
            && $.support.transition
            && $active.hasClass('fade')

      function next() {
        $active
          .removeClass('active')
          .find('> .dropdown-menu > .active')
          .removeClass('active')

        element.addClass('active')

        if (transition) {
          element[0].offsetWidth // reflow for transition
          element.addClass('in')
        } else {
          element.removeClass('fade')
        }

        if ( element.parent('.dropdown-menu') ) {
          element.closest('li.dropdown').addClass('active')
        }

        callback && callback()
      }

      transition ?
        $active.one($.support.transition.end, next) :
        next()

      $active.removeClass('in')
    }
  }


 /* TAB PLUGIN DEFINITION
  * ===================== */

  var old = $.fn.tab

  $.fn.tab = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('tab')
      if (!data) $this.data('tab', (data = new Tab(this)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.tab.Constructor = Tab


 /* TAB NO CONFLICT
  * =============== */

  $.fn.tab.noConflict = function () {
    $.fn.tab = old
    return this
  }


 /* TAB DATA-API
  * ============ */

  $(document).on('click.tab.data-api', '[data-toggle="tab"], [data-toggle="pill"]', function (e) {
    e.preventDefault()
    $(this).tab('show')
  })

}(window.jQuery);/* =============================================================
 * bootstrap-typeahead.js v2.3.0
 * http://twitter.github.com/bootstrap/javascript.html#typeahead
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function($){

  "use strict"; // jshint ;_;


 /* TYPEAHEAD PUBLIC CLASS DEFINITION
  * ================================= */

  var Typeahead = function (element, options) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.typeahead.defaults, options)
    this.matcher = this.options.matcher || this.matcher
    this.sorter = this.options.sorter || this.sorter
    this.highlighter = this.options.highlighter || this.highlighter
    this.updater = this.options.updater || this.updater
    this.source = this.options.source
    this.$menu = $(this.options.menu)
    this.shown = false
    this.listen()
  }

  Typeahead.prototype = {

    constructor: Typeahead

  , select: function () {
      var val = this.$menu.find('.active').attr('data-value')
      this.$element
        .val(this.updater(val))
        .change()
      return this.hide()
    }

  , updater: function (item) {
      return item
    }

  , show: function () {
      var pos = $.extend({}, this.$element.position(), {
        height: this.$element[0].offsetHeight
      })

      this.$menu
        .insertAfter(this.$element)
        .css({
          top: pos.top + pos.height
        , left: pos.left
        })
        .show()

      this.shown = true
      return this
    }

  , hide: function () {
      this.$menu.hide()
      this.shown = false
      return this
    }

  , lookup: function (event) {
      var items

      this.query = this.$element.val()

      if (!this.query || this.query.length < this.options.minLength) {
        return this.shown ? this.hide() : this
      }

      items = $.isFunction(this.source) ? this.source(this.query, $.proxy(this.process, this)) : this.source

      return items ? this.process(items) : this
    }

  , process: function (items) {
      var that = this

      items = $.grep(items, function (item) {
        return that.matcher(item)
      })

      items = this.sorter(items)

      if (!items.length) {
        return this.shown ? this.hide() : this
      }

      return this.render(items.slice(0, this.options.items)).show()
    }

  , matcher: function (item) {
      return ~item.toLowerCase().indexOf(this.query.toLowerCase())
    }

  , sorter: function (items) {
      var beginswith = []
        , caseSensitive = []
        , caseInsensitive = []
        , item

      while (item = items.shift()) {
        if (!item.toLowerCase().indexOf(this.query.toLowerCase())) beginswith.push(item)
        else if (~item.indexOf(this.query)) caseSensitive.push(item)
        else caseInsensitive.push(item)
      }

      return beginswith.concat(caseSensitive, caseInsensitive)
    }

  , highlighter: function (item) {
      var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
      return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
        return '<strong>' + match + '</strong>'
      })
    }

  , render: function (items) {
      var that = this

      items = $(items).map(function (i, item) {
        i = $(that.options.item).attr('data-value', item)
        i.find('a').html(that.highlighter(item))
        return i[0]
      })

      items.first().addClass('active')
      this.$menu.html(items)
      return this
    }

  , next: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , next = active.next()

      if (!next.length) {
        next = $(this.$menu.find('li')[0])
      }

      next.addClass('active')
    }

  , prev: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , prev = active.prev()

      if (!prev.length) {
        prev = this.$menu.find('li').last()
      }

      prev.addClass('active')
    }

  , listen: function () {
      this.$element
        .on('focus',    $.proxy(this.focus, this))
        .on('blur',     $.proxy(this.blur, this))
        .on('keypress', $.proxy(this.keypress, this))
        .on('keyup',    $.proxy(this.keyup, this))

      if (this.eventSupported('keydown')) {
        this.$element.on('keydown', $.proxy(this.keydown, this))
      }

      this.$menu
        .on('click', $.proxy(this.click, this))
        .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
        .on('mouseleave', 'li', $.proxy(this.mouseleave, this))
    }

  , eventSupported: function(eventName) {
      var isSupported = eventName in this.$element
      if (!isSupported) {
        this.$element.setAttribute(eventName, 'return;')
        isSupported = typeof this.$element[eventName] === 'function'
      }
      return isSupported
    }

  , move: function (e) {
      if (!this.shown) return

      switch(e.keyCode) {
        case 9: // tab
        case 13: // enter
        case 27: // escape
          e.preventDefault()
          break

        case 38: // up arrow
          e.preventDefault()
          this.prev()
          break

        case 40: // down arrow
          e.preventDefault()
          this.next()
          break
      }

      e.stopPropagation()
    }

  , keydown: function (e) {
      this.suppressKeyPressRepeat = ~$.inArray(e.keyCode, [40,38,9,13,27])
      this.move(e)
    }

  , keypress: function (e) {
      if (this.suppressKeyPressRepeat) return
      this.move(e)
    }

  , keyup: function (e) {
      switch(e.keyCode) {
        case 40: // down arrow
        case 38: // up arrow
        case 16: // shift
        case 17: // ctrl
        case 18: // alt
          break

        case 9: // tab
        case 13: // enter
          if (!this.shown) return
          this.select()
          break

        case 27: // escape
          if (!this.shown) return
          this.hide()
          break

        default:
          this.lookup()
      }

      e.stopPropagation()
      e.preventDefault()
  }

  , focus: function (e) {
      this.focused = true
    }

  , blur: function (e) {
      this.focused = false
      if (!this.mousedover && this.shown) this.hide()
    }

  , click: function (e) {
      e.stopPropagation()
      e.preventDefault()
      this.select()
      this.$element.focus()
    }

  , mouseenter: function (e) {
      this.mousedover = true
      this.$menu.find('.active').removeClass('active')
      $(e.currentTarget).addClass('active')
    }

  , mouseleave: function (e) {
      this.mousedover = false
      if (!this.focused && this.shown) this.hide()
    }

  }


  /* TYPEAHEAD PLUGIN DEFINITION
   * =========================== */

  var old = $.fn.typeahead

  $.fn.typeahead = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('typeahead')
        , options = typeof option == 'object' && option
      if (!data) $this.data('typeahead', (data = new Typeahead(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.typeahead.defaults = {
    source: []
  , items: 8
  , menu: '<ul class="typeahead dropdown-menu"></ul>'
  , item: '<li><a href="#"></a></li>'
  , minLength: 1
  }

  $.fn.typeahead.Constructor = Typeahead


 /* TYPEAHEAD NO CONFLICT
  * =================== */

  $.fn.typeahead.noConflict = function () {
    $.fn.typeahead = old
    return this
  }


 /* TYPEAHEAD DATA-API
  * ================== */

  $(document).on('focus.typeahead.data-api', '[data-provide="typeahead"]', function (e) {
    var $this = $(this)
    if ($this.data('typeahead')) return
    $this.typeahead($this.data())
  })

}(window.jQuery);
/* ==========================================================
 * bootstrap-affix.js v2.3.0
 * http://twitter.github.com/bootstrap/javascript.html#affix
 * ==========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* AFFIX CLASS DEFINITION
  * ====================== */

  var Affix = function (element, options) {
    this.options = $.extend({}, $.fn.affix.defaults, options)
    this.$window = $(window)
      .on('scroll.affix.data-api', $.proxy(this.checkPosition, this))
      .on('click.affix.data-api',  $.proxy(function () { setTimeout($.proxy(this.checkPosition, this), 1) }, this))
    this.$element = $(element)
    this.checkPosition()
  }

  Affix.prototype.checkPosition = function () {
    if (!this.$element.is(':visible')) return

    var scrollHeight = $(document).height()
      , scrollTop = this.$window.scrollTop()
      , position = this.$element.offset()
      , offset = this.options.offset
      , offsetBottom = offset.bottom
      , offsetTop = offset.top
      , reset = 'affix affix-top affix-bottom'
      , affix

    if (typeof offset != 'object') offsetBottom = offsetTop = offset
    if (typeof offsetTop == 'function') offsetTop = offset.top()
    if (typeof offsetBottom == 'function') offsetBottom = offset.bottom()

    affix = this.unpin != null && (scrollTop + this.unpin <= position.top) ?
      false    : offsetBottom != null && (position.top + this.$element.height() >= scrollHeight - offsetBottom) ?
      'bottom' : offsetTop != null && scrollTop <= offsetTop ?
      'top'    : false

    if (this.affixed === affix) return

    this.affixed = affix
    this.unpin = affix == 'bottom' ? position.top - scrollTop : null

    this.$element.removeClass(reset).addClass('affix' + (affix ? '-' + affix : ''))
  }


 /* AFFIX PLUGIN DEFINITION
  * ======================= */

  var old = $.fn.affix

  $.fn.affix = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('affix')
        , options = typeof option == 'object' && option
      if (!data) $this.data('affix', (data = new Affix(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.affix.Constructor = Affix

  $.fn.affix.defaults = {
    offset: 0
  }


 /* AFFIX NO CONFLICT
  * ================= */

  $.fn.affix.noConflict = function () {
    $.fn.affix = old
    return this
  }


 /* AFFIX DATA-API
  * ============== */

  $(window).on('load', function () {
    $('[data-spy="affix"]').each(function () {
      var $spy = $(this)
        , data = $spy.data()

      data.offset = data.offset || {}

      data.offsetBottom && (data.offset.bottom = data.offsetBottom)
      data.offsetTop && (data.offset.top = data.offsetTop)

      $spy.affix(data)
    })
  })


}(window.jQuery);

