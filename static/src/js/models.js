odoo.define('sft_pago_servicios.models', function (require) {
"use strict";

var module = require('point_of_sale.models');
var chrome = require('point_of_sale.chrome');
var core = require('web.core');
var gui = require('point_of_sale.gui');
var rpc = require('web.rpc');
var screens = require('point_of_sale.screens');
var _t = core._t;


    module.load_fields("product.product", ['tiempo_aire', 'gp_servicio', 'gp_idservicio', 'gp_idproducto']);

     module.load_models({
        model:  'pos.config',
        fields: ['comision_servicio'],
        loaded: function(self, comision_servicio){
            self.comision_servicio = comision_servicio;
            }
    });

});
