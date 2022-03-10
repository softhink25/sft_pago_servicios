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


    var _super_Orderline = module.Orderline.prototype;

    module.Orderline = module.Orderline.extend({
        export_as_JSON: function () {
            var json = _super_Orderline.export_as_JSON.apply(this, arguments);
            if (this.precio_servicio){
                json.precio_servicio = this.precio_servicio;
            }
            if (this.descripcion){
                json.descripcion = this.descripcion;
            }
            return json;
        },
        set_precio_servicio: function (precio_servicio) {
            this.precio_servicio = precio_servicio;
            this.trigger('change', this);
        },
        get_precio_servicio: function () {
            return this.precio_servicio;
        },
        set_descripcion: function (descripcion) {
            this.descripcion = descripcion;
            this.trigger('change', this);
        },
        get_descripcion: function () {
            return this.descripcion;
        },

    })

});
