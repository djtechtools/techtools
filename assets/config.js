MF = window.MF ? MF : {};

(function($) {

  var _mf = {
    silicone: {},
    acrylic: {},
    buttons: []
  };

  var FIRE_CHANGES = true;

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

  function bad_target(target){
    if (target.is(".button")   && !are_buttons_selected() ){ return true; }
    if (target.is(".silicone") && !is_case_selected()     ){ return true; }
    if (target.is(".acrylic")  && !is_acrylic_selected()  ){ return true; }
    return false;
  }

  function apply_color_to_target(color_el, target) {
    if(bad_target(target)){ return; }

    var color = color_el.attr('data-color');
    var color_name = color_el.attr('title');
    var shop_id = color_el.attr('data-shop-id');

    target.css('background', color);
    var input = $('input[name=id[]]:first', target);
        input.val(shop_id).attr('data-color-name', color_name);

    if(FIRE_CHANGES){
      input.change();
    }
  }

  function apply_product_id_to_target(product_id, target) {
    $('.palette .color').each(function(i,el){
      if($(el).attr('data-shop-id') === product_id){
        apply_color_to_target($(el), $(target));
      }
    });
  }

  /**
   * Poorly named?  Probably.. matches by shop id, that's the issue
   * doesn't match on color...
   * @param target
   */
  function get_color_from_target(target){
    var color = undefined;
    var input = $('input[name=id[]]:first', target);
    $('.palette .color').each(function(i,el){
      if($(el).attr('data-shop-id') === input.val()){
        color = el;
      }
    });
    return $(color);
  }

  function update_price() {
    var total = 125.00;
    $('section nav h4 input:radio:checked').each(function() {
      total += parseFloat($(this).val());
    });
    total = Math.ceil(total);
    $('#midifighter aside.checkout .value').text(total);
  }

  function update_buttons() {
    $('.controller .button').each(function(i, el) {
      _mf.buttons[i] = _mf.buttons[i] || {};
      togglePresence(are_buttons_selected(), _mf.buttons[i], $(el));
    });
  }

  function update_case() {
    togglePresence(is_case_selected(), _mf.silicone, $('.controller .silicone'));
  }

  function update_acrylic() {
    togglePresence(is_acrylic_selected(), _mf.acrylic, $('.controller .acrylic'));
  }

  function update_controller() {
    var c = $('#controller_assembly_input');
    if (is_diy_selected()) {
      c.removeAttr('name');
    }
    else {
      c.attr('name', 'id[]').val(47673432);
    }
  }

  function update_persistence(){
    var serialized = self.serialize();
    self.cookie(serialized);

    var link = location.href.split('#')[0] + '#' + serialized;
    $('#share_link').val(link);

    var version = parseInt($.browser.version.replace(/\./g, ''));
    if(!$.browser.mozilla || !(version < 1929)) {
      location.hash = serialized;
    }
  }

  function togglePresence(on, obj, $el) {
    if (on) {
      //only update it it's currently blank
      var shop_id = $('input:first', $el).val();
      if(!$.isEmptyObject(obj) && shop_id == '') {
        $('input:first', $el).attr('name', 'id[]');
        $('input:first', $el).val(obj.shop_id);
        $('input:first', $el).attr('data-color-name', obj.color_name);
        $('input:first', $el);
        $el.removeClass('removed').css('background', obj.color).attr('title', obj.color_name);
      }
    }
    else {
      $('input:first', $el).removeAttr('name');
      obj.shop_id = $('input:first', $el).val();
      $('input:first', $el).val('');
      obj.color_name = $('input:first', $el).attr('data-color-name');
      $('input:first', $el).attr('data-color-name', '');
      $('input:first', $el);
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

  function setup_colors(){
    $.each(product.silicone, function(i, product) {
      $('nav .silicone ul').append(color_li(product));
    });

    $.each(product.acrylic, function(i, product) {
      $('nav .acrylic ul').append(color_li(product));
    });

    $.each(product.button, function(i, product) {
      $('nav .buttons ul').append(color_li(product));
    });
  }

  function setup_clicks(){
    $('nav .buttons .color').click(function() {
      $(this).addClass('selected').siblings().removeClass('selected');
    });

    $('form.controller .button').click(function() {
      var color = $('nav .buttons .color.selected');
      if (color) {
        apply_color_to_target(color, $(this));
      }
    });

    $('nav .silicone .color').click(function() {
      apply_color_to_target($(this), $('.controller .silicone'));
    });

    $('nav .acrylic .color').click(function() {
      apply_color_to_target($(this), $('.controller .acrylic'));
    });
  }

  function condenseChanges(callback) {
    FIRE_CHANGES = false;
    callback.call();
    FIRE_CHANGES = true;
    update_price();
    update_buttons();
    update_case();
    update_acrylic();
    update_controller();
    update_persistence();
  }

  var c;
  var self = MF.Config = {

    cookie:function(value){
      return $.cookie('MF.Config', value);
    },

    serialize:function(){
      var serialization = '';

      if(are_buttons_selected()) {
        serialization += "&buttons=";
        $('.button', c).each(function(i, el) {
          if(i !== 0){ serialization += ','; }
          serialization += get_color_from_target(el).attr('data-shop-id');
        });
      }

      if(is_case_selected()) {
        serialization += "&case=" + get_color_from_target($('.silicone', c)).attr('data-shop-id');
      }

      if(is_acrylic_selected()) {
        serialization += "&acrylic=" + get_color_from_target($('.acrylic', c)).attr('data-shop-id');
      }

      return serialization;
    },

    deserialize:function(hash){
      condenseChanges(function(){
        var params = hash.split('&');
        for(var key in params) {
          var value = params[key].split('=');
          var product = value[0];
          var shop_ids = value[1];
          switch(product) {
            case 'buttons':
              var ids = shop_ids.split(',');
              $('section nav .buttons input:first').click().change();
              for(var i=0; i<ids.length; i++){
                apply_product_id_to_target(ids[i], $('.button', c).get(i));
              }
              break;
            case 'case':
              $('section nav .silicone input:first').click().change();
              apply_product_id_to_target(shop_ids, $('.silicone', c));
              break;
            case 'acrylic':
              $('section nav .acrylic input:first').click().change();
              apply_product_id_to_target(shop_ids, $('.acrylic', c));
              break;
          }
        }
      });
    },

    init: function() {
      c = $('form.controller');

      setup_colors();
      setup_clicks();

      $('nav input').change(update_price);
      $('nav .buttons input').change(update_buttons);
      $('nav .silicone input').change(update_case);
      $('nav .acrylic input').change(update_acrylic);
      $('nav .controller input').change(update_controller);

      $('nav .palette input, form.controller input').change(update_persistence);

      attach_drop_event('.controller .silicone', "nav .silicone");
      attach_drop_event('.controller .acrylic', "nav .acrylic");
      attach_drop_event('.controller .button', "nav .buttons");
      $('nav .color').draggable({
        helper: "clone"
      });

      var hash = location.hash.slice(1);
      var cookie = self.cookie();

      if (hash !== '') {
        self.deserialize(hash);
      }
      else if( cookie !== '' ) {
        self.deserialize(cookie);
      }
      else {
        self.random();
        $('section nav .buttons input:eq(1)').click().change();
        $('section nav .silicone input:eq(1)').click().change();
        $('section nav .acrylic input:eq(1)').click().change();
      }
    },

    getNote:function() {
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
      var note = self.getNote();
      Shopify.updateCartNote(note, function() {
        $('section form.controller').submit();
      });
    },

    random:function() {
      $('section nav .buttons input:first').click().change();
      $('section nav .silicone input:first').click().change();
      $('section nav .acrylic input:first').click().change();

      condenseChanges(function(){
        $('.button.colorable', c).each(function(i, el){
          apply_color_to_target($('section nav .buttons .color').random(), $(el));
        });

        apply_color_to_target($('section nav .silicone .color').random(), $('.silicone.colorable', c));
        apply_color_to_target($('section nav .acrylic .color').random(), $('.acrylic.colorable', c));
      });
    }
  };

  $.fn.random = function(){
    var random_element_index = Math.floor(Math.random() * $(this).size());
    var random_element = $(this).get(random_element_index);
    return $(random_element);
  };

})(jQuery);