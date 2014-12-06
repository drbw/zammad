(function ($, window, undefined) {

/*
# mode: textonly/richtext / disable b/i/u/enter + strip on paste
# pasteOnlyText: true
# maxlength: 123
# multiline: true / disable enter + strip on paste
# placeholder: 'some placeholder'
#
*/

  var pluginName = 'textmodule',
  defaults = {}

  function Plugin( element, options ) {
    this.element    = element
    this.$element   = $(element)

    this.options    = $.extend( {}, defaults, options)

    this._defaults  = defaults
    this._name      = pluginName

    this.collection = []
    this.active = false
    this.buffer = ''

    // check if ce exists
    if ( $.data(element, 'plugin_ce') ) {
      this.ce = $.data(element, 'plugin_ce')
    }

    this.init();
  }

  Plugin.prototype.init = function () {
    this.baseTemplate()
    var _this = this

    this.$element.on('keydown', function (e) {

      // esc
      if ( e.keyCode === 27 ) {
        _this.close()
      }

      // navigate through item
      if ( _this.isActive() ) {

        // enter
        if ( e.keyCode === 13 ) {
          e.preventDefault()
          var id = _this.$widget.find('.dropdown-menu li.active a').data('id')
          _this.take(id)
        }

        // arrow keys
        if ( e.keyCode === 37 || e.keyCode === 38 || e.keyCode === 39 || e.keyCode === 40 ) {
          e.preventDefault()
        }

        // up
        if ( e.keyCode === 38 ) {
          if ( !_this.$widget.find('.dropdown-menu li.active')[0] ) {
            var top = _this.$widget.find('.dropdown-menu li').last().addClass('active').position().top
            _this.$widget.find('.dropdown-menu').scrollTop( top );
          }
          else {
            var prev = _this.$widget.find('.dropdown-menu li.active').removeClass('active').prev()
            var top = 300
            if ( prev[0] ) {
              top = prev.addClass('active').position().top
            }
            _this.$widget.find('.dropdown-menu').scrollTop( top );
          }
        }

        // down
        if ( e.keyCode === 40 ) {
          if ( !_this.$widget.find('.dropdown-menu li.active')[0] ) {
            var top = _this.$widget.find('.dropdown-menu li').first().addClass('active').position().top
            _this.$widget.find('.dropdown-menu').scrollTop( top );

          }
          else {
            var next = _this.$widget.find('.dropdown-menu li.active').removeClass('active').next()
            var top = 300
            if ( next[0] ) {
              top = next.addClass('active').position().top
            }
            _this.$widget.find('.dropdown-menu').scrollTop( top );
          }
        }

      }
    })

    // reduce buffer, in case close it
    this.$element.on('keydown', function (e) {

      // backspace
      if ( e.keyCode === 8 && _this.buffer ) {
        if ( _this.buffer === '::' ) {
          _this.close()
        }
        var length   = _this.buffer.length
        _this.buffer = _this.buffer.substr( 0, length-1 )
        console.log('BS backspace', _this.buffer)
        _this.result( _this.buffer.substr( 2, length-1 ) )
      }
    })

    // build buffer
    this.$element.on('keypress', function (e) {
      console.log('BUFF', _this.buffer, e.keyCode, String.fromCharCode(e.which) )

      // shift
      if ( e.keyCode === 16 ) {
        return
      }

      // enter
      if ( e.keyCode === 13 ) {
        return
      }

      // arrow keys
      if ( e.keyCode === 37 || e.keyCode === 38 || e.keyCode === 39 || e.keyCode === 40 ) {
        return
      }

      // enter :
      if ( String.fromCharCode(e.which) === ':' ) {
        _this.buffer = _this.buffer + ':'
      }

      if ( _this.buffer && _this.buffer.substr(0,2) === '::' ) {

        var sign = String.fromCharCode(e.which)
        if ( sign && sign !== ':' && e.which != 8 ) { // 8 == backspace
          _this.buffer = _this.buffer + sign
          //console.log('BUFF ADD', sign, this.buffer, sign.length, e.which)
        }
        console.log('BUFF HINT', _this.buffer, _this.buffer.length, e.which, String.fromCharCode(e.which))

        b = $.proxy(function() {
          this.result( this.buffer.substr(2,this.buffer.length) )
        }, _this)
        setTimeout(b, 400);

        if (!_this.isActive()) {
          _this.open()
        }

      }

    }).on('focus', function (e) {
      _this.close()
    }).on('blur', function (e) {
      // delay, to get click on text module before widget is closed
      a = $.proxy(function() {
        this.close()
      }, _this)
      setTimeout(a, 600);
    })

  };

  // create base template
  Plugin.prototype.baseTemplate = function() {
    this.$element.after('<div class="shortcut dropdown"><ul class="dropdown-menu" style="width: 360px; max-height: 200px;"><li><a>-</a></li></ul></div>')
    this.$widget = this.$element.next()
  }

  // update widget position
  Plugin.prototype.updatePosition = function() {
    console.log('uP')
    this.$widget.find('.dropdown-menu').scrollTop( 300 );
    //if ( !this.$element.is(':visible') ) return
    var position = this.$element.caret('position');
  console.log('PP', position)
    if (!position) return
    var widgetHeight = this.$widget.find('ul').height() + 85
    this.$widget.css('top', position.top - widgetHeight)
    if ( !this.isActive() ) {
      this.$widget.css('left', position.left)
    }
  }

  // open widget
  Plugin.prototype.open = function() {
    this.active = true
    if (this.ce) {
      this.ce.input('off')
    }
    b = $.proxy(function() {
      this.$widget.addClass('open')
    }, this)
    setTimeout(b, 400);
  }

  // close widget
  Plugin.prototype.close = function() {
    this.active = false
    this.cutInput()
    if (this.ce) {
      this.ce.input('on')
    }
    this.$widget.removeClass('open')
  }

  // check if widget is active/open
  Plugin.prototype.isActive = function() {
    return this.active
  }

  // select text module and insert into text
  Plugin.prototype.take = function(id) {
    if (!id) {
      this.close()
      return
    }
    for (var i = 0; i < this.collection.length; i++) {
      var item = this.collection[i]
      if ( item.id == id ) {
        var content = item.content + "\n"
        this.cutInput()
        if (document.selection) { // IE
          var range = document.selection.createRange()
          range.pasteHTML(content)
        }
        else {
          document.execCommand('insertHTML', false, content)
        }
        this.close()
        return
      }
    }
    return
  }

  // cut out search string from text
  Plugin.prototype.cutInput = function() {
    if (!this.buffer) return
    if (!this.$element.text()) return
    var sel = window.getSelection()
    if ( !sel || sel.rangeCount < 1) {
      this.buffer = ''
      return
    }
    var range = sel.getRangeAt(0)
    var clone = range.cloneRange()

    // improve error handling
    start = range.startOffset - this.buffer.length
    if (start < 0) {
      start = 0
    }
    clone.setStart(range.startContainer, start)
    clone.setEnd(range.startContainer, range.startOffset)
    clone.deleteContents()
    this.buffer = ''
  }

  // render result
  Plugin.prototype.result = function(term) {
    var _this = this
    var result = _.filter( this.collection, function(item) {
      var reg = new RegExp( term, 'i' )
      if ( item.name && item.name.match( reg ) ) {
        return item
      }
      if ( item.keywords && item.keywords.match( reg ) ) {
        return item
      }
      return
    })

    this.$widget.find('ul').html('')
    console.log('result', term, result)
    for (var i = 0; i < result.length; i++) {
      var item = result[i]
      var template = "<li><a href=\"#\" class=\"u-textTruncate\" data-id=" + item.id + ">" + item.name
      if (item.keywords) {
        template = template + " (" + item.keywords + ")"
      }
      template = template + "</a></li>"
      this.$widget.find('ul').append(template)
    }
    if ( !result[0] ) {
      this.$widget.find('ul').append("<li><a href='#'>-</a></li>")
    }
    this.$widget.find('ul li').on(
      'click',
      function(e) {
        e.preventDefault()
        var id = $(e.target).data('id')
        _this.take(id)
      }
    )
    this.updatePosition()
  }


  $.fn[pluginName] = function ( options ) {
    return this.each(function () {
      if (!$.data(this, 'plugin_' + pluginName)) {
        $.data(this, 'plugin_' + pluginName,
        new Plugin( this, options ));
      }
    });
  }

}(jQuery, window));
