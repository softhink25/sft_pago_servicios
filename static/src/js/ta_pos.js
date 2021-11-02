odoo.define('pos_ta.pos_ta',   function (require) {
"use strict";
var module = require('point_of_sale.models');
var chrome = require('point_of_sale.chrome');
var core = require('web.core');
var PosPopWidget = require('point_of_sale.popups');

var PosBaseWidget = require('point_of_sale.BaseWidget');
var gui = require('point_of_sale.gui');
var screens = require('point_of_sale.screens');
var ajax = require('web.ajax');
    var TiempoAireButton = screens.ActionButtonWidget.extend({
        template: 'TiempoAireButton',
        button_click: function(){
        	this.gui.show_popup('sft-compania-popup');
        },
    });
    screens.define_action_button({
        'name': 'TiempoAireButton',
        'widget': TiempoAireButton,
    });


    var PagoServiciosButton = screens.ActionButtonWidget.extend({
        template: 'PagoServiciosButton',
        button_click: function(){
        	this.gui.show_popup('popup_select_servicio');
        },
    });
    screens.define_action_button({
        'name': 'PagoServiciosButton',
        'widget': PagoServiciosButton,
    });


    var TiempoAirePopup = PosPopWidget.extend({
        template: 'TiempoAirePopup',
        renderElement: function(){
            var self = this;
            this._super();
            var producto = self.gui.producto;

            this.$('#registrar_ta').click(function(){

            	var no_telefono = $(".no_telefono").val();
            	var no_confirma = $(".no_confirma").val();
                self.gui.pos;
                $('.o_loading').show();
                self.$('.cancel').removeClass("desactivado");
                self.$('#registrar_ta').removeClass("desactivado");
                $(".no_mensaje").val("Estamos realizando su operación, Por favor Espere.");
                $(".no_mensaje").removeClass("tiene-error");
            	if(no_telefono.length != 10){
                    $(".no_mensaje").addClass("tiene-error");
            	    $(".no_mensaje").val("Favor de introducir el No. de teléfono con clave lada(10 dígitos).");
            	}else if(no_telefono == no_confirma){
            	var parametros ={
                        method: 'POST',
                        async: true,
                        headers: {
                            'Access-Control-Allow-Origin': '*'
                        },
                        'CodigoDispositivo': self.gui.pos.config.usuario,
                        'PasswordDispositivo': window.btoa(self.gui.pos.config.password),
                        'IdDistribuidor':self.gui.pos.config.id_distribuidor,
                        'Telefono':no_telefono,
                        'IdServicio':producto.IdServicio,
                        'IdProducto':producto.IdProducto
                    };

                    self.$('.cancel').addClass("desactivado");
                    self.$('#registrar_ta').addClass("desactivado");
                    $.ajax({
                          method: "POST",
                          url:  self.gui.pos.config.url+"Abonar",
                          data: JSON.stringify(parametros),
                          type: "POST",
                          headers: {
                                "Content-Type":"application/json"
                          }
                }).done(function( data ) {
                         $('.o_loading').hide();
                         self.$('.cancel').removeClass("desactivado");
                         self.$('#registrar_ta').removeClass("desactivado");
                         if("82"==data.CODIGO){
                                $(".no_mensaje").val("Confirmando Transacción. Por Favor Espere.");
                                self.$('.cancel').addClass("desactivado");
                         self.$('#registrar_ta').addClass("desactivado");
                                $.ajax({
                                          method: "POST",
                                          url:  self.gui.pos.config.url+"ConfirmaTransaccion",
                                          data: JSON.stringify(parametros),
                                          type: "POST",
                                          headers: {
                                                "Content-Type":"application/json"
                                          }
                                }).done(function( data ) {
                                    self.$('.cancel').removeClass("desactivado");
                                    self.$('#registrar_ta').removeClass("desactivado");
                                         $('.o_loading').hide();
                                          if("-1"!==data.NUM_AUTORIZACION&&"0"!==data.NUM_AUTORIZACION){

                                            var order = self.pos.get_order();
                                            var product_base = self.pos.db.get_product_by_barcode('TIEMPO_AIRE');

                                            //clona producto para evitar que sobreescriba otro
                                            var product_clone = Object.create(product_base);

                                            product_clone.display_name= self.gui.producto.Producto+" Tel. "+no_telefono+" No. Autorización : "+data.NUM_AUTORIZACION;
                                            product_clone.list_price = self.gui.producto.Precio;
                                            product_clone.lst_price = self.gui.producto.Precio;
                                            product_clone.standard_price = self.gui.producto.Precio;
                                            product_clone.list_price = self.gui.producto.Precio;

                                            order.add_product(product_clone);
                                            order.get_last_orderline().set_descripcion(product_clone.display_name);

                                            if(self.pos.config.comision_tiempo_aire){
                                                  var comision_prod_base = self.pos.db.get_product_by_barcode('COM_PAGO_SERV');
                                                  //clona producto para evitar que sobreescriba otro
                                                  var comision_prod = Object.create(comision_prod_base);
                                                  if(!self.pos.config.minimo_tiempo_aire){
                                                    comision_prod.display_name = "Comision tiempo aire";

                                                    comision_prod.list_price = self.pos.config.comision_tiempo_aire;
                                                    comision_prod.lst_price = self.pos.config.comision_tiempo_aire;
                                                    comision_prod.standard_price = self.pos.config.comision_tiempo_aire;

                                                    order.add_product(comision_prod);
                                                    order.get_last_orderline().set_descripcion(self.gui.producto.Producto);

                                                  }
                                                  else if (self.gui.producto.Precio < self.pos.config.minimo_tiempo_aire){
                                                      comision_prod.display_name = "Comision tiempo aire";
                                                      comision_prod.list_price = self.pos.config.comision_tiempo_aire;
                                                      comision_prod.lst_price = self.pos.config.comision_tiempo_aire;
                                                      comision_prod.standard_price = self.pos.config.comision_tiempo_aire;
                                                      order.add_product(comision_prod);
                                                      order.get_last_orderline().set_descripcion(self.gui.producto.Producto);
                                                  }
                                            }

                                            self.gui.close_popup('sft-producto-popup');
                                            $(".no_mensaje").val(data.TEXTO);
                                         } else{
                                            $(".no_mensaje").addClass("tiene-error");
                                            $(".no_mensaje").val(data.TEXTO);
                                         }


                                }).fail(function( data ) {
                                    self.$('.cancel').removeClass("desactivado");
                                    self.$('#registrar_ta').removeClass("desactivado");
                                    $('.o_loading').hide();
                                    $(".no_mensaje").addClass("tiene-error");
                                    $(".no_mensaje").val(data.responseText);
                                 });
                         }else if("-1"!==data.NUM_AUTORIZACION&&"0"!==data.NUM_AUTORIZACION){
                            var order = self.pos.get_order();
                            var product_base = self.pos.db.get_product_by_barcode('TIEMPO_AIRE');

                            //clona producto para evitar que sobreescriba otro
                            var product = Object.create(product_base);
                            product.display_name= self.gui.producto.Producto+" Tel. "+no_telefono+" No. Autorización : "+data.NUM_AUTORIZACION;
                            product.list_price = self.gui.producto.Precio;
                            product.lst_price = self.gui.producto.Precio;
                            product.standard_price = self.gui.producto.Precio;

                            order.add_product(product);
                            order.get_last_orderline().set_descripcion(product.display_name);


                            if(self.pos.config.comision_tiempo_aire){
                                  var comision_prod_base = self.pos.db.get_product_by_barcode('COM_PAGO_SERV');
                                  //clona producto para evitar que sobreescriba otro
                                  var comision_prod = Object.create(comision_prod_base);
                                  if(!self.pos.config.minimo_tiempo_aire){
                                    comision_prod.display_name = "Comision tiempo aire";
                                    comision_prod.list_price = self.pos.config.comision_tiempo_aire;
                                    comision_prod.lst_price = self.pos.config.comision_tiempo_aire;
                                    comision_prod.standard_price = self.pos.config.comision_tiempo_aire;
                                    order.add_product(comision_prod);
                                    order.get_last_orderline().set_descripcion(self.gui.producto.Producto);

                                  }
                                  else if (self.gui.producto.Precio < self.pos.config.minimo_tiempo_aire){
                                      comision_prod.display_name = "Comision tiempo aire";
                                      comision_prod.list_price = self.pos.config.comision_tiempo_aire;
                                      comision_prod.lst_price = self.pos.config.comision_tiempo_aire;
                                      comision_prod.standard_price = self.pos.config.comision_tiempo_aire;
                                      order.add_product(comision_prod);
                                      order.get_last_orderline().set_descripcion(self.gui.producto.Producto);

                                  }
                              }



                            self.gui.close_popup('sft-producto-popup');
                            $(".no_mensaje").val(data.TEXTO);
                            self.$('.cancel').removeClass("desactivado");
                            self.$('#registrar_ta').removeClass("desactivado");
                         } else{
                            self.$('.cancel').removeClass("desactivado");
                         self.$('#registrar_ta').removeClass("desactivado");
                            $(".no_mensaje").addClass("tiene-error");
                            $(".no_mensaje").val(data.TEXTO);
                         }


                }).fail(function( data ) {

                    $('.o_loading').hide();
                    $(".no_mensaje").addClass("tiene-error");
                    $(".no_mensaje").val(data.responseText);
                    self.$('.cancel').removeClass("desactivado");
                         self.$('#registrar_ta').removeClass("desactivado");
                 });
                }else{
                    self.$('.cancel').removeClass("desactivado");
                         self.$('#registrar_ta').removeClass("desactivado");
                    $(".no_mensaje").addClass("tiene-error");
	            	$(".no_mensaje").val("El No. de Télefono y la confirmación deben ser iguales, Verifique por favor.");
	            }
		    });
		    if(producto!=undefined){
		        $("#titulo_producto").text(producto.Producto);
		    }

        },
        show: function(options){
            this.options = options || {};
            var self = this;
            this._super(options);
            this.renderElement();
        },
    });
    gui.define_popup({
        'name': 'sft-pos-popup',
        'widget': TiempoAirePopup,
    });
    var CompaniaPopup = PosPopWidget.extend({
        template: 'CompaniaPopup' ,
        renderElement: function(){
            var self = this;
            this._super();
            var propiedades = {
                    method: 'POST',
                    async: true,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    'compania':self.gui.compania,
                    'CodigoDispositivo': self.gui.pos.config.usuario,
                    'PasswordDispositivo': window.btoa(self.gui.pos.config.password),
                    'IdDistribuidor':self.gui.pos.config.id_distribuidor,
                };
                $.ajax({
                          method: "POST",
                          url: self.gui.pos.config.url+"ConsultarSaldo",
                          data: JSON.stringify(propiedades),
                          type: "POST",
                          headers: {
                                "Content-Type":"application/json"
                          }
                }).done(function( data ) {
                        var saldo = data.SALDO_F;
                        var contenedor = $("#saldospan");
                        $(contenedor).text(saldo);

                });
             this.$('#registar_abono').click(function(){
                self.gui.show_popup('sft-abonar-popup');
                $("#abono_abonar").removeClass("invisible");
                });
            this.$('.compania').click(function(){
                self.gui.compania=$(this).attr("compania");
                if(self.gui.compania =="2"){
                    $("#titulo_producto").text("Telcel");
                }else if(self.gui.compania =="2"){
                }
                self.gui.show_popup('sft-producto-popup');
		    });
        },
        show: function(options){
            this.options = options || {};
            var self = this;
            this._super(options);
            this.renderElement();
        },
    });

    gui.define_popup({
        'name': 'sft-compania-popup',
        'widget': CompaniaPopup,
    });
    var ProductoPopup = PosPopWidget.extend({
        template: 'ProductoPopup' ,
        renderElement: function(){
            var self = this;
            this._super();
            if(self.gui.compania==undefined){
             return;
            }
            var propiedades = {
                    method: 'POST',
                    async: true,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    'compania':self.gui.compania,
                    'CodigoDispositivo': self.gui.pos.config.usuario,
                    'PasswordDispositivo': window.btoa(self.gui.pos.config.password),
                    'IdDistribuidor':self.gui.pos.config.id_distribuidor,
                };
                $.ajax({
                          method: "POST",
                          url: self.gui.pos.config.url+"ConsultarServicioTelefonia",
                          data: JSON.stringify(propiedades),
                          type: "POST",
                          headers: {
                                "Content-Type":"application/json"
                          }
                }).done(function( data ) {
                        var productos = data.productos;
                        var contenedor = $("#contenedor_producto");
                        var producto_base = $("#producto_base");
                        $.each(productos, function( k, v ) {
                               var producto =$(producto_base).clone();
                               $(producto).attr("id",v.IdProducto);
                               $(producto).attr("precio",v.Precio);
                               $(producto).removeClass("invisible");
                               $(producto).click(function (){
                                    self.gui.producto = v;
                                    self.gui.show_popup('sft-pos-popup');
                               });
                               if(v.Producto.includes("$")){
                                    $(producto).text(v.Producto);
                               }else{
                                    $(producto).text(v.Producto+ " $"+v.Precio);
                               }

                               $(contenedor).append(producto);
                        });
                });
                self.$('.producto').click(function(){
                    alert($(this).attr("id"));
                });
        },
        show: function(options){
            this.options = options || {};
            var self = this;
            this._super(options);
            this.renderElement();

        },
    });

     var TiempoAireAbonar = PosPopWidget.extend(    {
        template: 'AbonoPopup' ,
        renderElement: function(){
            var self = this;
            this._super();

             this.$('#abono_abonar').click(function(){
                $('.o_loading').show();
            	var banco = $("#abono_banco").val();
            	var monto= $("#abono_monto").val();
            	var referencia= $("#abono_referencia").val();
            	var fecha= $("#abono_fecha").val();
            	var hora= $("#abono_hora").val();
                $("#abono_mensaje").val("");
                $("#abono_mensaje").removeClass("tiene-error");
            	if(monto ==undefined|| referencia==undefined||fecha==undefined||monto.length ==0||referencia.length==0||fecha.length!=10 ||hora==undefined||hora.length!=5){
                    $("#abono_mensaje").addClass("tiene-error");
            	    $("#abono_mensaje").val("Favor de llenar todos los campos.");
            	}else {
            	var parametros ={
                        method: 'POST',
                        async: true,
                        headers: {
                            'Access-Control-Allow-Origin': '*'
                        },
                        'CodigoDispositivo': self.gui.pos.config.usuario,
                        'PasswordDispositivo': window.btoa(self.gui.pos.config.password),
                        'IdDistribuidor':self.gui.pos.config.id_distribuidor,
                        'Referencia':referencia,
                        'Banco':banco,
                        'Monto':monto,
                        'Fecha':fecha+" "+hora
                    };
                    $.ajax({
                          method: "POST",
                          url:  self.gui.pos.config.url+"NotificarAbono",
                          data: JSON.stringify(parametros),
                          type: "POST",
                          headers: {
                                "Content-Type":"application/json"
                          }
                }).done(function( data ) {
                         $('.o_loading').hide();
                         if(data!=undefined&& data.CODIGO == "01"){
                            var order = self.pos.get_order();
                            $("#abono_mensaje").val(data.TEXTO);
                            $("#abono_abonar").addClass("invisible");
                            $("#abono_cancel").text("Cerrar");
                         } else{
                            $("#abono_mensaje").addClass("tiene-error");
                            $("#abono_mensaje").val(data==undefined?"Ha ocurrido un Error": data.TEXTO);
                         }

                 }).fail(function( data ) {
                    $('.o_loading').hide();
                    $("#abono_mensaje").addClass("tiene-error");
                    $("#abono_mensaje").val(data.responseText);
                 });
                }
            });

        },
        show: function(options){
            this.options = options || {};
            var self = this;
            this._super(options);
            this.renderElement();

        },
    });
     gui.define_popup({
        'name': 'sft-abonar-popup',
        'widget': TiempoAireAbonar,
    });
     gui.define_popup({
        'name': 'sft-producto-popup',
        'widget': ProductoPopup,
    });



// *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-* PAGO SERVICIOS *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*

    // POPUP select selectServicio
    var SelectServicio = PosPopWidget.extend({
        template: 'SelectServicio' ,
        renderElement: function(){
            var self = this;
            this._super();

            // Consulta saldo disponible
            var propiedades = {
                   method: 'POST',
                   async: true,
                   headers: {
                       'Access-Control-Allow-Origin': '*'
                   },
                   'compania':self.gui.compania,
                   'CodigoDispositivo': self.gui.pos.config.usuario,
                   'PasswordDispositivo': window.btoa(self.gui.pos.config.password),
                   'IdDistribuidor':self.gui.pos.config.id_distribuidor,
                };
            $.ajax({
                 method: "POST",
                 url: self.gui.pos.config.url+"ConsultarSaldo",
                 data: JSON.stringify(propiedades),
                 type: "POST",
                 headers: {
                    "Content-Type":"application/json"
                 }
            }).done(function( data ) {
                var saldo = data.SALDO_F;
                var contenedor = $("#saldo_disp");
                $(contenedor).text(saldo);

                // Consulta productos
                var propiedades = {
                    method: 'POST',
                    async: true,
                    headers: { 'Access-Control-Allow-Origin': '*' },
                    'compania':self.gui.compania,
                    'CodigoDispositivo': self.gui.pos.config.usuario,
                    'PasswordDispositivo': window.btoa(self.gui.pos.config.password),
                    'IdDistribuidor':self.gui.pos.config.id_distribuidor,
                };
                $.ajax({
                    method: "POST",
                    url: self.gui.pos.config.url+"ConsultarArticulos",
                    data: JSON.stringify(propiedades),
                    type: "POST",
                    headers: { "Content-Type":"application/json" }
                }).done(function( data ) {

                    var productoss = data; // todos los productos de todos los servicios
                    //console.log("todos productos");
                    //console.log(productoss);

                    $.each(productoss, function( k, v ) {
                        var new_option = new Option(v.Servicio + " - " + v.Producto, v);
                        $(new_option).attr("value",k);
                        $(new_option).data('my_data',v);  // importante
                        $(new_option).attr("id",v.IdProducto);
                        $(new_option).attr("precio",v.Precio);
                        $(new_option).attr("style","max-width: 500px;");

                        var optionExists = ($('#combobox option[value=' + $(new_option).val() + ']').length > 0);

                        if(!optionExists){
                            $("#combobox").append(new_option);
                        }
                    });

                });

            });


            self.$('.ok_selected').click(function(){
                self.gui.producto = $('#combobox option:selected').data("my_data");

                console.log("producto seleccionado");
                console.log(self.gui.producto);

                if (self.gui.producto != undefined){
                   self.gui.show_popup('popup_detalles_de_pago');
                }
            });


            //TODO COMBOBOX
            $( function() {
                $.widget( "custom.combobox", {
                    _create: function() {
                        this.wrapper = $( "<span>" )
                            .addClass( "custom-combobox" )
                            .insertAfter( this.element );

                        this.element.hide();
                        this._createAutocomplete();
                        this._createShowAllButton();
                    },

                    _createAutocomplete: function() {
                        var selected = this.element.children( ":selected" ),
                            value = selected.val() ? selected.text() : "";

                        this.input = $( "<input>" )
                            .appendTo( this.wrapper )
                            .val( value )
                            .attr( "title", "" )
                            .addClass( "custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left" )
                            .autocomplete({
                                delay: 0,
                                minLength: 0,
                                source: $.proxy( this, "_source" )
                            })
                            .tooltip({
                                classes: {
                                    "ui-tooltip": "ui-state-highlight"
                                }
                            });

                        this._on( this.input, {
                            autocompleteselect: function( event, ui ) {
                                ui.item.option.selected = true;
                                this._trigger( "select", event, {
                                    item: ui.item.option
                                });
                            },

                            autocompletechange: "_removeIfInvalid"
                        });
                    },

                    _createShowAllButton: function() {
                        var input = this.input,
                            wasOpen = false;

                        $( "<a>" )
                            .attr( "tabIndex", -1 )
                            .attr( "title", "Show All Items" )
                            .tooltip()
                            .appendTo( this.wrapper )
                            .button({
                                icons: {
                                    primary: "ui-icon-triangle-1-s"
                                },
                                text: false
                            })
                            .removeClass( "ui-corner-all" )
                            .addClass( "custom-combobox-toggle ui-corner-right" )
                            .on( "mousedown", function() {
                                wasOpen = input.autocomplete( "widget" ).is( ":visible" );
                            })
                            .on( "click", function() {
                                input.trigger( "focus" );

                                // Close if already visible
                                if ( wasOpen ) {
                                    return;
                                }

                                // Pass empty string as value to search for, displaying all results
                                input.autocomplete( "search", "" );
                            });
                    },

                    _source: function( request, response ) {
                        var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
                        response( this.element.children( "option" ).map(function() {
                            var text = $( this ).text();
                            if ( this.value && ( !request.term || matcher.test(text) ) )
                                return {
                                    label: text,
                                    value: text,
                                    option: this
                                };
                        }) );
                    },

                    _removeIfInvalid: function( event, ui ) {

                        // Selected an item, nothing to do
                        if ( ui.item ) {
                            return;
                        }

                        // Search for a match (case-insensitive)
                        var value = this.input.val(),
                            valueLowerCase = value.toLowerCase(),
                            valid = false;
                        this.element.children( "option" ).each(function() {
                            if ( $( this ).text().toLowerCase() === valueLowerCase ) {
                                this.selected = valid = true;
                                return false;
                            }
                        });

                        // Found a match, nothing to do
                        if ( valid ) {
                            return;
                        }

                        // Remove invalid value
                        this.input
                            .val( "" )
                            .attr( "title", value + " didn't match any item" )
                            .tooltip( "open" );
                        this.element.val( "" );
                        this._delay(function() {
                            this.input.tooltip( "close" ).attr( "title", "" );
                        }, 2500 );
                        this.input.autocomplete( "instance" ).term = "";
                    },

                    _destroy: function() {
                        this.wrapper.remove();
                        this.element.show();
                    }
                });

                $( "#combobox" ).combobox();
                $( "#toggle" ).on( "click", function() {
                    $( "#combobox" ).toggle();
                });
            } );



        },
        show: function(options){
            this.options = options || {};
            var self = this;
            this._super(options);
            this.renderElement();
        },
    });
    gui.define_popup({
        'name': 'popup_select_servicio',
        'widget': SelectServicio,
    });


    // POPUP detalles_de_pago   TODO new
    var DetallesDePago = PosPopWidget.extend({
        template: 'DetallesDePago' ,
        renderElement: function(){
            var self = this;
            this._super();

            var producto = self.gui.producto;
            var tipo;

            if (self.gui.producto != undefined){
              tipo = self.gui.producto.TipoFront;
                // telefono requerido
                if (tipo == "1"){
                    this.$(".input_telefono").css("display", "flex");
                    this.$(".label_telefono").css("display", "flex");
                    this.$(".input_monto").text(producto.Precio);
                    this.$(".input_monto").val(producto.Precio);
                }
                else if (tipo == "4"){
                    this.$(".label_ref").css("display", "flex");
                    this.$(".input_ref").css("display", "flex");

                }
                //referencia requerida
                // referencia y monto requeridos
                else if (tipo == "2"){
                    this.$(".label_ref").css("display","flex");
                    this.$(".input_ref").css("display", "flex");
                    this.$('.input_monto').prop('disabled', false);
                }
                else {
                    this.$(".input_telefono").css("display", "flex");
                    this.$(".label_telefono").css("display", "flex");
                    this.$(".input_monto").text(producto.Precio);
                    this.$(".input_monto").val(producto.Precio);
                    this.$(".label_ref").css("display","flex");
                    this.$(".input_ref").css("display", "flex");
                    this.$('.input_monto').prop('disabled', false);
                }
            }

            $('.input_monto').on('input',function(e){
                var montomascomision = parseFloat($('.input_monto').val()) || 0;
                montomascomision += parseFloat($(".comision").val()) || 0;

                $("#importe_a_pagar").text( " $" + montomascomision);
                $("#importe_a_pagar").val(montomascomision);
            });

            if (producto != undefined){
                // tipo front 1 y 5 agarra la comision configurada
                if(tipo == "1" || tipo == "5"){
                    if(self.pos.config.comision_servicio){
                        $(".comision").text( "Comision: $" + self.pos.config.comision_servicio);
                        $(".comision").val(self.pos.config.comision_servicio);
                    }
                    $(".input_monto").text(producto.Precio);
                    $(".input_monto").val(parseFloat(producto.Precio));
                }
                if(tipo == "2"){
                    if(self.pos.config.comision_servicio){
                        $(".comision").text( "Comision: $" + self.pos.config.comision_servicio);
                        $(".comision").val(self.pos.config.comision_servicio);
                    }
                    else{
                        $(".comision").text( "Comision: $" + producto.Precio);
                        $(".comision").val(parseFloat(producto.Precio));
                    }
                }
                var comision = parseFloat($(".comision").val()) || 0 ;
                var monto = parseFloat($(".input_monto").val()) || 0;

                $("#importe_a_pagar").text( " $" + String(comision+monto));
                $("#importe_a_pagar").val(comision+monto);

            }



            this.$('.ok_detalles').click(function(){
            	var no_telefono = $(".input_telefono").val();
            	var referencia = $(".input_ref").val();
            	var monto = $(".input_monto").val();


            	$('.o_loading').show();
                self.$('.cancel').removeClass("desactivado");
                self.$('.ok_detalles').removeClass("desactivado");
                $(".no_mensaje").val("Estamos realizando su operación, Por favor Espere.");
                $(".no_mensaje").removeClass("tiene-error");

                self.$('.cancel').addClass("desactivado");
                self.$('.ok_detalles').addClass("desactivado");


            	/*var no_confirma = $(".no_confirma").val();

            	if(no_telefono.length != 10){
            	    alert("Favor de introducir el No. de teléfono con clave lada.");
            	}else if(no_telefono == no_confirma){
            	*/

                console.log("telefono que se esta enviando");
                console.log(no_telefono);

                // solicitud real
                var parametros ={
                    method: 'POST',
                    async: true,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    'CodigoDispositivo': self.gui.pos.config.usuario,
                    'PasswordDispositivo': window.btoa(self.gui.pos.config.password),
                    'IdDistribuidor':self.gui.pos.config.id_distribuidor,
                    'Telefono':no_telefono,  //Telefono
                    'Referencia': referencia,
                    'Monto': monto,
                    'IdServicio':producto.IdServicio,
                    'IdProducto':producto.IdProducto
                };
                $.ajax({
                      method: "POST",
                      url:  self.gui.pos.config.url+"Abonar",
                      data: JSON.stringify(parametros),
                      type: "POST",
                      headers: {
                          "Content-Type":"application/json"
                      }
                }).done(function( data ) {
                    console.log("recicibido al confirmar");
                    console.log(data);

                    $('.o_loading').hide();
                    self.$('.cancel').removeClass("desactivado");
                    self.$('#registrar_ta').removeClass("desactivado");

                    var tel_display = "";
                    if (tipo == "1"){
                        tel_display = " Tel. " + no_telefono;
                    }

                    var order = self.pos.get_order();
                    var product_base = self.pos.db.get_product_by_barcode('PAGO_SERV');
                    var product_comision_base = self.pos.db.get_product_by_barcode('COM_PAGO_SERV');

                    var product = Object.create(product_base);
                    var product_comision = Object.create(product_comision_base);

                    if (data.NUM_AUTORIZACION == "-1"){
                       self.$('.cancel').removeClass("desactivado");
                       self.$('.ok_detalles').removeClass("desactivado");
                       $(".no_mensaje").addClass("tiene-error");
                       $(".no_mensaje").val(data.TEXTO);
                    }
                    else{
                        product.list_price =$(".input_monto").val();
                        product.lst_price =$(".input_monto").val();
                        product.standard_price =$(".input_monto").val();

                        product.display_name = self.gui.producto.Producto+ tel_display +" N° Autorización: "+data.NUM_AUTORIZACION;
                        product.set_descripcion = product.display_name;
                        order.add_product(product);  //      ,{ quantity:$(".input_monto").val()}                         // order.add_product(product,{ price: $("#importe_a_pagar").val() , quantity:"1"});
                        /*order.get_last_orderline().set_descripcion(product.display_name);*/
                        //order.get_last_orderline().set_unit_price($(".input_monto").val());


                        var comision_final = parseFloat($(".comision").val()) || 0;
                        if(comision_final > 0)  {

                            product_comision.list_price = $(".comision").val();
                            product_comision.lst_price = $(".comision").val();
                            product_comision.standard_price = $(".comision").val();

                            product_comision.display_name = "Comision por pago de servicio";
                            order.add_product(product_comision); //  ,{ quantity: parseFloat($(".comision").val())}       // order.add_product(product,{ price: $("#importe_a_pagar").val() , quantity:"1"});
                            order.get_last_orderline().set_descripcion(self.gui.producto.Producto);
                          //  order.get_last_orderline().set_unit_price($(".comision").val());
                        }
                        // guarda en el backend
                        //order.get_last_orderline().set_precio_servicio(parseFloat($("#importe_a_pagar").val()));
                        //order.get_last_orderline().set_description(product.display_name);

                        self.gui.close_popup('popup_select_servicio');

                        $(".no_mensaje").val(data.TEXTO);
                        self.$('.cancel').removeClass("desactivado");
                        self.$('.ok_detalles').removeClass("desactivado");
                    }
                 });
                 // fin solicitud real


                /*
                }else{
	            	alert("El No. de Télefono y la confirmación deben ser iguales, Verifique por favor.");
	            }
	            */
		    });
		    if(producto!=undefined){
		        $("#nom_producto").text(producto.Producto);
		    }



        },
        show: function(options){
            this.options = options || {};
            var self = this;
            this._super(options);
            this.renderElement();
        },
    });
    gui.define_popup({
        'name': 'popup_detalles_de_pago',
        'widget': DetallesDePago,
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

