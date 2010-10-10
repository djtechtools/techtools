MF = window.MF ? MF : {};

(function($) {

  var nav;
  var controller;
  var URL = /http:\/\//i;
  var PREVENT_CHANGES = false;

  function css(color) {
    return URL.test(color) ? "url(" + color + ")" : color;
  }

  function setupPalettesAndColorables() {
    $().add($('.palette', nav)).
        add($('.colorable', controller)).
    each(function() {
      $(this).addClass($(this).attr('data-ref'));
    });
  }

  function createPalette(products) {
    function createColor(product) {
      return $("<li/>").addClass('color').applyStyle(product);
    }

    $.each({
      'silicone': products['silicone-case'],
      'acrylic': products['acrylic-top-plate'],
      'button': products['arcade-buttons']
    }, function(selector, products) {
      $.each(products, function(i, product) {
        $('.' + selector + " ul", nav).append(createColor(product));
      });
    });
  }

  function toProduct(color) {
    return {
      "name":     $(color).attr('data-title'),
      "color":    $(color).attr('data-color'),
      "shop_id":  $(color).attr('data-shop-id'),
      "price":    $(color).attr('data-price')
    };
  }

  function bindDragAndDrop() {
    $('.palette .color', nav).draggable({
                        helper: "clone"
                      });

    $('.colorable', controller).each(function() {
      var referenced = $(this).attr('data-ref');

      $(this).droppable({
        drop: function(event, ui) {
          $(this).apply(toProduct(ui.draggable));
          update();
        },
        accept: "nav ." + referenced + " .color",
        greedy: true
      });
    });
  }

  function bindClicks() {
    $('.button .color', nav).click(function() {
      $(this).addClass('selected').siblings().removeClass('selected');
    });

    $('.button', controller).click(function() {
      var color = $('.button .color.selected', nav).get(0);
      if (color) {
        $(this).apply(toProduct(color));
        update();
      }
    });

    $.each(['silicone', 'acrylic'], function(i, ref) {
      $('.' + ref + ' .color', nav).click(function() {
        $('.' + ref, controller).apply(toProduct(this));
        update();
      });
    });
  }

  function withoutChanges(callback){
    PREVENT_CHANGES = true;
    callback.call();
    PREVENT_CHANGES = false;
  }

  function bindChanges() {
    $('.palette input', nav).change(function() {
      if(PREVENT_CHANGES) { return }
      var ref = $(this).closest('.palette').attr('data-ref');
      $('.' + ref, controller).setVisibility($(this).isSelected());
    });

    $('.assembly input', nav).change(update);
  }

  function cookie(value) {
    return $.cookie('MF.Config', value)
  }

  function getNote() {
    var note = $.trim($('#note').val());

    if( $('.assembly', nav).size() > 0 ) {
      note += $('.assembly', nav).isSelected() ? "DIY assembly" : "Pre-assembled";
      note += "\n";
    }

    note += $('.silicone', nav).isSelected() ? to_s('.silicone', nav) + ", silicone\n" : "";
    note += $('.acrylic', nav).isSelected() ? to_s('.acrylic', nav) + ", acrylic\n" : "";
    if($('.button', nav).isSelected()) {
      $('.button', controller).each(function(i, el) {
        var desc = to_s(el);
        note += desc + "\t";

        if (((i + 1) % 4) === 0) {
          note += "\n";
        } else {
          if (desc.length <= 4) {
            note += "\t";
          }
        }
      });
    }

    return note;

    function to_s(el) {
      var input = $(el,controller);
      return input.attr('data-title');
    }
  }

  function serialize() {
    var serialization = '';

    if ($('.button', nav).isSelected()) {
      serialization += "&buttons=";
      $('.button', controller).each(function(i, el) {
        if (i !== 0) {
          serialization += ',';
        }
        serialization += $(el).attr('data-shop-id');
      });
    }

    if ($('.silicone', nav).isSelected()) {
      serialization += "&case=" + $('.silicone', controller).attr('data-shop-id');
    }

    if ($('.acrylic', nav).isSelected()) {
      serialization += "&acrylic=" + $('.acrylic', controller).attr('data-shop-id');
    }

    return serialization;
  }

  function deserialize(hash) {
    $.fn.applyProductById = function(product_id) {
      var target = $(this);
      $('.palette .color', nav).each(function(i, el) {
        if ($(el).attr('data-shop-id') === product_id) {
          $(target).apply( toProduct(el) );
          return false;
        }
      });
    };

    withoutChanges(function(){
      // everything off -- blank slate
      $('.palette', nav).find('input:last').click().change();

      var params = hash.split('&');
      for (var key in params) {
        var value = params[key].split('=');
        var product = value[0];
        var shop_ids = value[1];
        switch (product) {
          case 'buttons':
            var ids = shop_ids.split(',');
            $('.button input:first', nav).click().change();
            $.each(ids, function(i, id) {
              $($('.button', controller).get(i)).applyProductById(id)
            });
            break;
          case 'case':
            $('.silicone input:first', nav).click().change();
            $('.silicone', controller).applyProductById(shop_ids);
            break;
          case 'acrylic':
            $('.acrylic input:first', nav).click().change();
            $('.acrylic', controller).applyProductById(shop_ids);
            break;
        }
      }
    });
    update();
  }

  function update() {
    if(PREVENT_CHANGES) { return }

    function price() {
      var total = 0;
      $('input[data-price]', controller).each(function() {
        total += parseInt( $(this).attr('data-price') );
      });
      return Math.floor(total/100);
    }

    $('.checkout .value', controller).text(price());

    var serialized = serialize();
    cookie(serialized);

    var link = location.href.split('#')[0] + '#' + serialized;
    $('#share_link').val(link);

    var version = parseInt($.browser.version.replace(/\./g, ''));
    if (!$.browser.mozilla || !(version < 1929)) {
      location.hash = serialized;
    }
  }

  $.fn.apply = function(product) {
    var ref = $(this).attr('data-ref');
    if ($('.' + ref, nav).isSelected()) {
      $(this).applyStyle(product).addToForm(product);
    }
  };

  $.fn.applyStyle = function(product) {
    return $(this).
            css('background', css(product.color)).
            attr('data-title', product.name).
            attr('data-color', product.color).
            attr('data-shop-id', product.shop_id).
            attr('data-price', product.price).
            removeClass('removed');
  };

  $.fn.addToForm = function(product, type) {
    var referenced = type || $(this).attr('data-ref');
    var cartProduct = $('<input/>').
            attr('class', referenced + "_input").
            attr('type', 'hidden').
            attr('name', 'id[]').
            val(product.shop_id).
            attr('data-price', product.price);
    var input = $("input." + referenced + "_input", this);
    input.size() == 0 ? $(this).prepend(cartProduct) : input.replaceWith(cartProduct);
    return $(this);
  };

  $.fn.isSelected = function() {
    return !$(this).closest('.palette, .option').find('input[value="0"]').is(':checked');
  };

  $.fn.setVisibility = function(on) {
    $(this).each(function() {
      if (on) {
        var product = toProduct(this);
        $(this).apply(product);
      } else {
        var ref = $(this).attr('data-ref');
        $(this).addClass('removed').css('background', '').find('input.'+ref+'_input').remove();
      }
    });

    update();
    return $(this);
  };

  $.fn.random = function() {
    var random_element_index = Math.floor(Math.random() * $(this).size());
    var random_element = $(this).get(random_element_index);
    return $(random_element);
  };

  MF.Config = function(product) {

    var hash = location.hash.slice(1);
    var hashFromCookie = cookie();

    nav = $('#midifighter nav');
    $('.assembly input', nav).change(function(){
      if($(this).isSelected()){
        controller.addToForm(product['midi-fighter-assembly'], 'assembly');
      } else {
        $('input.assembly_input', controller).remove();
      }
    });

    controller = $('#midifighter form.controller');
    controller.addToForm(product['midifighter-diy-kit'], 'controller');

    setupPalettesAndColorables();
    createPalette(product);

    random();

    bindDragAndDrop();
    bindClicks();
    bindChanges();

    $('.palette, .option', nav).find('input:last').click().change();

    if (hash !== '') {
      deserialize(hash);
    }
    else if( hashFromCookie !== '' ) {
      deserialize(hashFromCookie);
    }

    function random() {
      $('.button', controller).each(function(i, el) {
        $(el).apply(toProduct($('.button .color', nav).random()));
      });

      $('.silicone', controller).apply(toProduct($('.silicone .color', nav).random()));
      $('.acrylic', controller).apply(toProduct($('.acrylic .color', nav).random()));
      update();
    }

    function submit() {
      Shopify.updateCartNote(getNote(), function() {
        $(controller).submit();
      });
    }

    // expose public methods
    return {
      "random": random,
      "submit": submit,

      // for testing
      "serialize": serialize,
      "deserialize": deserialize,
      "getNote": getNote
    };
  };

})(jQuery);