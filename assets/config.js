MF = window.MF ? MF : {};

(function($) {

  var _mf = {
    silicone: {},
    acrylic: {},
    buttons: []
  };

  function color_li(product) {
    return '<li class="color" style="background:' + product.color + '" data-color="' + product.color + '" title="' + product.name + '" data-shop-id="' + product.shop_id + '"></li>';
  }

  function attach_drop_event(to, accept) {
    $(to).droppable({
      drop: drop_event_handler,
      activeClass: "ui-state-highlight",
      hoverClass: "ui-state-hover",
      accept: accept + " .color:not(.ui-sortable-helper)",
      greedy: false
    });
  }

  function drop_event_handler(event, ui) {
    apply_color_to_target(ui.draggable, $(this));
  }

  function apply_color_to_target(color_el, target) {
    if (target.is(".button") && !are_buttons_selected()) {
      return;
    }
    if (target.is(".silicone") && !is_case_selected()) {
      return;
    }
    if (target.is(".acrylic") && !is_acrylic_selected()) {
      return;
    }

    var color = color_el.attr('data-color');
    var color_name = color_el.attr('title');
    var shop_id = color_el.attr('data-shop-id');

    target.css('background', color);
    $('input[name=id[]]:first', target)
            .val(shop_id)
            .attr('data-color-name', color_name)
            .change();
  }

  function apply_product_to_target(target, mf_class, product_index) {
    if (product_index == -1) {
      target.addClass('removed').css('background', '').attr('title', '');
      target.find('input[name=id[]]:first')
              .removeAttr('name')
              .attr('data-color-name', '')
              .change();
      return;
    }

    target.css('background', product[mf_class][product_index].color);
    target.find('input[name=id[]]:first')
            .val(product[mf_class][product_index].shop_id)
            .attr('data-color-name', product[mf_class][product_index].name)
            .change();
  }

  function update_price() {
    var total = 125.00;
    $('section nav h4 input:radio:checked').each(function() {
      total += parseFloat($(this).val());
    });
    total = Math.ceil(total);
    $('aside.checkout .value').text(total);
  }

  function update_buttons() {
    $('.controller .button').each(function(i, el) {
      _mf.buttons[i] = _mf.buttons[i] ? _mf.buttons[i] : {};
      togglePresence(are_buttons_selected(), _mf.buttons[i], $(el));
    });
  }

  function update_case() {
    togglePresence(is_case_selected(), _mf.silicone, $('.controller .silicone'));
  }

  function update_acrylic() {
    togglePresence(is_acrylic_selected(), _mf.acrylic, $('.controller .acrylic'));
  }

  function togglePresence(on, obj, $el) {
    if (on) {
      if ($.isEmptyObject(obj)) {
        return;
      }

      $('input:first', $el).attr('name', 'id[]');
      $('input:first', $el).val(obj.shop_id);
      $('input:first', $el).attr('data-color-name', obj.color_name);
      $('input:first', $el).change();
      $el.removeClass('removed').css('background', obj.color).attr('title', obj.color_name);
    }
    else {
      $('input:first', $el).removeAttr('name');
      obj.shop_id = $('input:first', $el).val();
      $('input:first', $el).val('');
      obj.color_name = $('input:first', $el).attr('data-color-name');
      $('input:first', $el).attr('data-color-name', '');
      $('input:first', $el).change();
      obj.color = $el.css('background');
      $el.addClass('removed').css('background', '').attr('title', '');
    }
  }

  function is_diy_selected() {
    return $('#assembled_0').is(':checked');
  }

  function are_buttons_selected() {
    return !$('#buttons_0').is(':checked');
  }

  function is_case_selected() {
    return !$('#silicone_case_0').is(':checked');
  }

  function is_acrylic_selected() {
    return !$('#acrylic_top_0').is(':checked');
  }

  function update_controller() {
    var c = $('#controller_assembly_input');
    if (is_diy_selected()) {
      c.removeAttr('name');
    }
    else {
      c.attr('name', 'id[]').val($('nav .controller input:first').val());
    }
  }

  var self = MF.Config = {

    init: function() {

      $('nav h4 a.tooltip').tipsy({
        gravity: 'w',
        delayIn: 250,
        delayOut: 250
      });

      $.each(product.silicone, function(i, product) {
        $('nav .silicone ul').append(color_li(product));
      });

      $.each(product.acrylic, function(i, product) {
        $('nav .acrylic ul').append(color_li(product));
      });

      $.each(product.button, function(i, product) {
        $('nav .buttons ul').append(color_li(product));
      });

      $('nav .color[title="Clear"]').tipsy({
        gravity: 'e',
        delayIn: 0,
        delayOut: 250,
        trigger: 'manual'
      }).tipsy("show");
      $('div.tipsy.tipsy-e').css('z-index', 2);

      $('nav input').change(update_price);
      $('nav .buttons input').change(update_buttons);
      $('nav .silicone input').change(update_case);
      $('nav .acrylic input').change(update_acrylic);
      $('nav .controller input').change(update_controller);

      attach_drop_event('.controller .silicone', "nav .silicone");
      attach_drop_event('.controller .acrylic', "nav .acrylic");
      attach_drop_event('.controller .button', "nav .buttons");

      $('nav .color').draggable({
        helper: "clone"
      });

      $('nav .buttons .color').click(function() {
        $(this).addClass('selected').siblings().removeClass('selected');
      });

      $('form.controller .button').click(function() {
        var color = $('nav .buttons .color.selected');
        if (color) {
          self.apply_color_to_target(color, $(this));
        }
      });

      $('nav .silicone .color').click(function() {
        self.apply_color_to_target($(this), $('.controller .silicone'));
      });

      $('nav .acrylic .color').click(function() {
        self.apply_color_to_target($(this), $('.controller .acrylic'));
      });

      self.random();
      $('section nav .buttons input:eq(1)').click().change();
      $('section nav .silicone input:eq(1)').click().change();
      $('section nav .acrylic input:eq(1)').click().change();
    },

    apply_color_to_target: function (color_el, target) {
      if (target.is(".button") && !are_buttons_selected()) {
        return;
      }
      if (target.is(".silicone") && !is_case_selected()) {
        return;
      }
      if (target.is(".acrylic") && !is_acrylic_selected()) {
        return;
      }

      var color = color_el.attr('data-color');
      var color_name = color_el.attr('title');
      var shop_id = color_el.attr('data-shop-id');

      target.css('background', color);
      $('input[name=id[]]:first', target)
              .val(shop_id)
              .attr('data-color-name', color_name)
              .change();
    },

    get_note:function() {
      var c = $('.controller');

      var note = $.trim($('#note').val());

      if (note.length > 0) {
        note += "\n\n-----------------------------------------------------\n\n"
      }

      note += is_diy_selected() ? "DIY assembly" : "Pre-assembled";
      note += "\n";

      if (is_case_selected()) {
        note += to_s('.silicone input') + ", silicone\n";
      }

      if (is_acrylic_selected()) {
        note += to_s('.acrylic input') + ", acrylic\n";
      }

      note += "\n";

      $('.button input', c).each(function(i, el) {
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

      return note;

      function to_s(el) {
        return $(el, c).attr('data-color-name');
      }
    },

    submit: function() {
      Shopify.updateCartNote(self.get_note(), function() {
        $('section form.controller').submit();
      });
    },

    random:function() {
      $('section nav .buttons input:first').click().change();
      $('section nav .silicone input:first').click().change();
      $('section nav .acrylic input:first').click().change();

      $('.colorable').each(function() {
        var that = $(this);
        var mf_class = '';

        $.each(['silicone', 'acrylic', 'button'], function(i, c) {
          if (that.hasClass(c)) {
            mf_class = c;
          }
        });

        var rand = Math.floor(Math.random() * product[mf_class].length);
        apply_product_to_target(that, mf_class, rand);
      });
    },

    mouse_intro: function() {
      var $cursor = $('#cursor').fadeIn();

      $cursor.animate({
        left: '484px',
        top: '589px'
      }, {
        duration: 3000,
        queue: true,
        complete: function() {
          $(this).attr('class', 'finger');
          setTimeout(function() {
            $cursor.attr('class', 'finger_with_color');
          }, 1000);
        }
      });

      $cursor.delay(1000).animate({
        left: '565px',
        top: '303px'
      }, {
        duration: 3000,
        queue: true,
        complete: function() {
          $(this).attr('class', 'rock_on');
          setTimeout(function() {
            $cursor.hide();
          }, 2000);
          $('section .button.col_2.row_1').css('background', '#51B169');
        }
      });
    }

  };
})(jQuery);