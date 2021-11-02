odoo.define('sft_pago_servicios.TiempoAireBoton', function(require) {
'use strict';
   const { Gui } = require('point_of_sale.Gui');
   const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
   const PosComponent = require('point_of_sale.PosComponent');
   const { posbus } = require('point_of_sale.utils');
   const ProductScreen = require('point_of_sale.ProductScreen');
   const { useListener } = require('web.custom_hooks');
   const Registries = require('point_of_sale.Registries');
   const PaymentScreen = require('point_of_sale.PaymentScreen');

   class TiempoAireBoton extends PosComponent {
       constructor() {
           super(...arguments);
           useListener('click', this.onClick);

       }
       is_available() {
           const order = this.env.pos.get_order();
           return order
       }
       onClick() {
            Gui.showPopup("CompaniaPopup", {
               title : "Coupon Products",
               confirmText: ("Exit")
                  });
       }
   }
    TiempoAireBoton.template = 'TiempoAireBoton';
   ProductScreen.addControlButton({
       component: TiempoAireBoton,
       condition: function() {
           return this.env.pos;
       },
   });
   Registries.Component.add(TiempoAireBoton);

    class PagoServiciosButton extends PosComponent {
       constructor() {
           super(...arguments);
           useListener('click', this.onClick);

       }
       is_available() {
           const order = this.env.pos.get_order();
           return order
       }
       onClick() {
            Gui.showPopup("SelectServicioPopup", {
               title : "Coupon Products",
               confirmText: ("Exit")
                  });
       }
   }
   PagoServiciosButton.template = 'PagoServiciosButton';
   ProductScreen.addControlButton({
       component: PagoServiciosButton,
       condition: function() {
           return this.env.pos;
       },
   });
   Registries.Component.add(PagoServiciosButton);
   class CompaniaPopup extends AbstractAwaitablePopup {
        constructor() {
            super(...arguments);
            useListener('click-compania', this.clickClient);
            useListener('click-abono', this.clickAbono);
            var propiedades = {
                method: 'POST',
                async: true,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
//                'compania':this.gui.compania,
                'CodigoDispositivo': this.env.pos.config.usuario,
                'PasswordDispositivo': window.btoa(this.env.pos.config.password),
                'IdDistribuidor':this.env.pos.config.id_distribuidor,
            };
            $.ajax({
                      method: "POST",
                      url: this.env.pos.config.url+"ConsultarSaldo",
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
        }

        clickAbono(event) {
                Gui.showPopup("AbonoPopup", {
               title : "Abono",
               confirmText: ("Exit")
                  });
        }
        clickClient(event) {
            console.log("clickClient");
            console.log(event);
            let compania = event.detail.compania;
            console.log(compania);
            var self = this;
            var propiedades = {
                method: 'POST',
                async: true,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                'compania':compania,
                'CodigoDispositivo': this.env.pos.config.usuario,
                'PasswordDispositivo': window.btoa(this.env.pos.config.password),
                'IdDistribuidor':this.env.pos.config.id_distribuidor,
            };
            $.ajax({
                      method: "POST",
                      url: this.env.pos.config.url+"ConsultarServicioTelefonia",
                      data: JSON.stringify(propiedades),
                      type: "POST",
                      headers: {
                            "Content-Type":"application/json"
                      }
            }).done(function( data ) {
                    var productos = data.productos;
                    console.log(data);
                    self.trigger('close-popup');

                    Gui.showPopup("ProductoPopup", {
                       title : "Coupon Products",
                       confirmText: ("Exit"),
                       productos : productos
                          });
            });
        }

    }
    CompaniaPopup.template = 'CompaniaPopup';
    CompaniaPopup.defaultProps = {
       confirmText: 'Ok',
       cancelText: 'Cancel',
       title: 'Coupon Products',
       body: '',
    };
    Registries.Component.add(CompaniaPopup);

    class AbonoPopup extends AbstractAwaitablePopup {
        constructor() {
            super(...arguments);
            useListener('click_abonar', this.clickAbonar);
        }
        clickAbonar(event) {
            var self = this;
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
                            'CodigoDispositivo': self.env.pos.config.usuario,
                            'PasswordDispositivo': window.btoa(self.env.pos.config.password),
                            'IdDistribuidor':self.env.pos.config.id_distribuidor,
                            'Referencia':referencia,
                            'Banco':banco,
                            'Monto':monto,
                            'Fecha':fecha+" "+hora
                    };
                $.ajax({
                          method: "POST",
                          url:  self.env.pos.config.url+"NotificarAbono",
                          data: JSON.stringify(parametros),
                          type: "POST",
                          headers: {
                                "Content-Type":"application/json"
                          }
                }).done(function( data ) {
                         $('.o_loading').hide();
                         if(data!=undefined&& data.CODIGO == "01"){
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
        }
    }
    AbonoPopup.template ='AbonoPopup'
    AbonoPopup.defaultProps = {
       confirmText: 'Ok',
       cancelText: 'Cancel',
       title: 'Products',
       body: '',
    };
    class ProductoPopup extends AbstractAwaitablePopup {
        constructor() {
            super(...arguments);
            useListener('click-producto', this.clickProducto);
        }
        clickProducto(event) {
            var self = this;
            let producto = event.detail.producto;
            console.log(producto);
            self.trigger('close-popup');
            Gui.showPopup("TiempoAirePopup", {
                       title : "Tiempo aire",
                       confirmText: ("Exit"),
                       producto : producto
                          });
        }


    }
    ProductoPopup.template = 'ProductoPopup';
    ProductoPopup.defaultProps = {
       confirmText: 'Ok',
       cancelText: 'Cancel',
       title: 'Products',
       body: '',
    };
    Registries.Component.add(AbonoPopup);
    Registries.Component.add(ProductoPopup);


    //TiempoAirePopup
    class TiempoAirePopup extends AbstractAwaitablePopup {
        constructor() {
            super(...arguments);
            useListener('click-confirmar', this.clickConfirmar);

        }
        clickConfirmar(event) {
            console.log("clickConfirmar");
            var no_telefono = $(".no_telefono").val();
            var no_confirma = $(".no_confirma").val();
            console.log("no_telefono = "+no_telefono);
            console.log("no_confirma = "+no_confirma);
            var self = this;
            var producto = self.props.producto;
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
                    'CodigoDispositivo': self.env.pos.config.usuario,
                    'PasswordDispositivo': window.btoa(self.env.pos.config.password),
                    'IdDistribuidor':self.env.pos.config.id_distribuidor,
                    'Telefono':no_telefono,
                    'IdServicio':producto.IdServicio,
                    'IdProducto':producto.IdProducto
                };
                $('.cancel').addClass("desactivado");
                $('#registrar_ta').addClass("desactivado");


                $.ajax({
                          method: "POST",
                          url:  self.env.pos.config.url+"Abonar",
                          data: JSON.stringify(parametros),
                          type: "POST",
                          headers: {
                                "Content-Type":"application/json"
                          }
                }).done(function( data ) {
                         $('.o_loading').hide();
                         $('.cancel').removeClass("desactivado");
                         $('#registrar_ta').removeClass("desactivado");
                         if("82"==data.CODIGO){
                                $(".no_mensaje").val("Confirmando Transacción. Por Favor Espere.");
                                $('.cancel').addClass("desactivado");
                                $('#registrar_ta').addClass("desactivado");
                                $.ajax({
                                          method: "POST",
                                          url:  self.env.pos.config.url+"ConfirmaTransaccion",
                                          data: JSON.stringify(parametros),
                                          type: "POST",
                                          headers: {
                                                "Content-Type":"application/json"
                                          }
                                }).done(function( data ) {
                                    $('.cancel').removeClass("desactivado");
                                    $('#registrar_ta').removeClass("desactivado");
                                         $('.o_loading').hide();
                                          if("-1"!==data.NUM_AUTORIZACION&&"0"!==data.NUM_AUTORIZACION){

                                            var order = self.env.pos.get_order();
                                            var product_base = self.env.pos.db.get_product_by_barcode('TIEMPO_AIRE');

                                            //clona producto para evitar que sobreescriba otro
                                            var product_clone = Object.create(product_base);

                                            product_clone.display_name= self.env.producto.Producto+" Tel. "+no_telefono+" No. Autorización : "+data.NUM_AUTORIZACION;
                                            product_clone.list_price = self.env.producto.Precio;
                                            product_clone.lst_price = self.env.producto.Precio;
                                            product_clone.standard_price = self.env.producto.Precio;
                                            product_clone.list_price = self.env.producto.Precio;
                                            product_clone.set_descripcion(product_clone.display_name)  ;
                                            order.add_product(product_clone);
                                            /*order.get_last_orderline().set_descripcion(product_clone.display_name);*/

                                            if(self.env.pos.config.comision_tiempo_aire){
                                                  var comision_prod_base = self.env.pos.db.get_product_by_barcode('COM_PAGO_SERV');
                                                  //clona producto para evitar que sobreescriba otro
                                                  var comision_prod = Object.create(comision_prod_base);
                                                  if(!self.env.pos.config.minimo_tiempo_aire){
                                                    comision_prod.display_name = "Comision tiempo aire";

                                                    comision_prod.list_price = self.env.pos.config.comision_tiempo_aire;
                                                    comision_prod.lst_price = self.env.pos.config.comision_tiempo_aire;
                                                    comision_prod.standard_price = self.env.pos.config.comision_tiempo_aire;

                                                    order.add_product(comision_prod);
                                                    /*order.get_last_orderline().set_descripcion(self.env.producto.Producto);*/

                                                  }
                                                  else if (self.env.producto.Precio < self.env.pos.config.minimo_tiempo_aire){
                                                      comision_prod.display_name = "Comision tiempo aire";
                                                      comision_prod.list_price = self.env.pos.config.comision_tiempo_aire;
                                                      comision_prod.lst_price = self.env.pos.config.comision_tiempo_aire;
                                                      comision_prod.standard_price = self.env.pos.config.comision_tiempo_aire;
                                                      order.add_product(comision_prod);
                                                     /* order.get_last_orderline().set_descripcion(self.env.producto.Producto);*/
                                                  }
                                            }

                                            self.trigger('close-popup');
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
                            //var order = self.env.pos.get_order();
                            var order = self.env.pos.get_order();
                            var product_base = self.env.pos.db.get_product_by_barcode('TIEMPO_AIRE');

                            //clona producto para evitar que sobreescriba otro
                            var product = Object.create(product_base);
                            product.display_name= producto.Producto+" Tel. "+no_telefono+" No. Autorización : "+data.NUM_AUTORIZACION;
                            product.list_price = producto.Precio;
                            product.lst_price = producto.Precio;
                            product.standard_price = producto.Precio;
                            order.add_product(product);
                            var order_line = order.get_last_orderline();
                            order_line.set_description(product.display_name);
                            if(self.env.pos.config.comision_tiempo_aire){
                                  var comision_prod_base = self.env.pos.db.get_product_by_barcode('COM_PAGO_SERV');
                                  //clona producto para evitar que sobreescriba otro
                                  var comision_prod = Object.create(comision_prod_base);
                                  if(!self.env.pos.config.minimo_tiempo_aire){
                                    comision_prod.display_name = "Comision tiempo aire";
                                    comision_prod.list_price = self.env.pos.config.comision_tiempo_aire;
                                    comision_prod.lst_price = self.env.pos.config.comision_tiempo_aire;
                                    comision_prod.standard_price = self.env.pos.config.comision_tiempo_aire;
                                    order.add_product(comision_prod);
                                    /*order.get_last_orderline().set_descripcion(self.env.producto.Producto);*/

                                  }
                                  else if (producto.Precio < self.env.pos.config.minimo_tiempo_aire){
                                      comision_prod.display_name = "Comision tiempo aire";
                                      comision_prod.list_price = self.env.pos.config.comision_tiempo_aire;
                                      comision_prod.lst_price = self.env.pos.config.comision_tiempo_aire;
                                      comision_prod.standard_price = self.env.pos.config.comision_tiempo_aire;
                                      order.add_product(comision_prod);
                                      /*order.get_last_orderline().set_descripcion(self.env.producto.Producto);*/

                                  }
                              }
                            self.trigger('close-popup');
                            $(".no_mensaje").val(data.TEXTO);
                            $('.cancel').removeClass("desactivado");
                            $('#registrar_ta').removeClass("desactivado");
                         } else{
                            $('.cancel').removeClass("desactivado");
                            $('#registrar_ta').removeClass("desactivado");
                            $(".no_mensaje").addClass("tiene-error");
                            $(".no_mensaje").val(data.TEXTO);
                         }


                }).fail(function( data ) {

                    $('.o_loading').hide();
                    $(".no_mensaje").addClass("tiene-error");
                    $(".no_mensaje").val(data.responseText);
                    $('.cancel').removeClass("desactivado");
                    $('#registrar_ta').removeClass("desactivado");
                 });




            }else{
                self.$('.cancel').removeClass("desactivado");
                     self.$('#registrar_ta').removeClass("desactivado");
                $(".no_mensaje").addClass("tiene-error");
                $(".no_mensaje").val("El No. de Télefono y la confirmación deben ser iguales, Verifique por favor.");
            }
        }

    }

    TiempoAirePopup.template = 'TiempoAirePopup';
    TiempoAirePopup.defaultProps = {
       confirmText: 'Ok',
       cancelText: 'Cancel',
       title: 'Tiempo aire',
       body: '',
    };
    Registries.Component.add(TiempoAirePopup);


    //pago de servicios
    class SelectServicioPopup extends AbstractAwaitablePopup {

         constructor() {
            super(...arguments);

            useListener('click-siguiente', this.clickContinuar);
            var propiedades = {
                method: 'POST',
                async: true,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
//                'compania':this.gui.compania,
                'CodigoDispositivo': this.env.pos.config.usuario,
                'PasswordDispositivo': window.btoa(this.env.pos.config.password),
                'IdDistribuidor':this.env.pos.config.id_distribuidor,
            };
            $.ajax({
                      method: "POST",
                      url: this.env.pos.config.url+"ConsultarSaldo",
                      data: JSON.stringify(propiedades),
                      type: "POST",
                      headers: {
                            "Content-Type":"application/json"
                      }
            }).done(function( data ) {
                    var saldo = data.SALDO_F;
                    var contenedor = $("#saldo_disp");
                    $(contenedor).text(saldo);

            });
            var self= this
            $.ajax({
                    method: "POST",
                    url: this.env.pos.config.url+"ConsultarArticulos",
                    data: JSON.stringify(propiedades),
                    type: "POST",
                    headers: { "Content-Type":"application/json" }
                }).done(function( data ) {
                 self.props.productoss   = data // todos los productos de todos los servicios
                    $.each(self.props.productoss, function( k, v ) {
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
                        $("#combobox").css("display","block");
                    });

                });
                $(document).ready(function(){

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
                            .attr( "title", "Seleccionar Servicio" )
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
                });
        }
        clickContinuar(event) {
                var producto =this.props.productoss [$("#combobox")[0].selectedIndex];
                Gui.showPopup("DetallesDePagoPopup", {
               title : "Abono",
               "producto":producto,
               confirmText: ("Exit")
                  });
        }


    }
    SelectServicioPopup.template ='SelectServicio'
    SelectServicioPopup.defaultProps = {
       confirmText: 'Ok',
       cancelText: 'Cancel',
       title: 'Products',
       body: '',
    };
    Registries.Component.add(SelectServicioPopup);

    //detalle de servicio
    class DetallesDePagoPopup extends AbstractAwaitablePopup {
        constructor(event) {
            super(...arguments);
            let producto = this.props.producto;
           var self = this;

            $( document ).ready(function() {
            setTimeout(function(){
            self.llenarVista(producto,self);
            },200);
           });
           var propiedades = {
                method: 'POST',
                async: true,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
//                'compania':this.gui.compania,
                'CodigoDispositivo': self.env.pos.config.usuario,
                'PasswordDispositivo': window.btoa(self.env.pos.config.password),
                'IdDistribuidor':self.env.pos.config.id_distribuidor,
            };
           /*self.llenarVista(producto,self);*/
            useListener('click-siguiente', this.clickSiguente);
            $.ajax({
                      method: "POST",
                      url: self.env.pos.config.url+"ConsultarSaldo",
                      data: JSON.stringify(propiedades),
                      type: "POST",
                      headers: {
                            "Content-Type":"application/json"
                      }
            }).done(function( data ) {
                    var saldo = data.SALDO_F;
                    var contenedor = $("#saldo_disp");
                    $(contenedor).text(saldo);

            });
            $.ajax({
                    method: "POST",
                    url: self.env.pos.config.url+"ConsultarArticulos",
                    data: JSON.stringify(propiedades),
                    type: "POST",
                    headers: { "Content-Type":"application/json" }
                }).done(function( data ) {
                    var productoss = data; // todos los productos de todos los servicios
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
                        $("#combobox").css("display","block");
                    });
            });
        }
        llenarVista (producto,self){
        var comision = 0;
                var monto = 0;
            $('#input_monto').prop('disabled', false);
            if (producto != undefined){
              var tipo = producto.TipoFront;
                if (tipo == "1"){
                    $(".telefono").css("display", "block");
                    $("#label_telefono").css("display", "block");
                    $("#input_monto").text(producto.Precio);
                    $("#input_monto").val(producto.Precio);
                     $('#input_monto').prop('disabled', true);
                }
                else if (tipo == "4"){
                    $(".referencia").css("display", "block");
                    $('#input_monto').prop('disabled', true);
                }
                //referencia requerida
                // referencia y monto requeridos
                else if (tipo == "2"){
                    $(".referencia").css("display","block");
                }else {
                    comision= producto.Precio;
                    $(".telefono").css("display", "block");
                    $("#input_ref").val(producto.Precio);
                    $(".referencia").css("display","block");
                }
            }

            $('#input_monto').on('input',function(e){
                var montomascomision = parseFloat($("#input_monto").val()) || 0;
                montomascomision += parseFloat($("#input_ref").val()) || 0;

                $("#importe_a_pagar").text( " $" + montomascomision);
                $("#importe_a_pagar").val(montomascomision);
            });

            if (producto != undefined){
                // tipo front 1 y 5 agarra la comision configurada
                if(tipo == "1" || tipo == "5"){
                    if(self.env.pos.config.comision_servicio){
                        $("#input_ref").text( "$" + self.env.pos.config.comision_servicio);
                        $("#input_ref").val(self.env.pos.config.comision_servicio);
                    }
                    $("#input_monto").text(producto.Precio);
                    $("#input_monto").val(parseFloat(producto.Precio));
                    monto = parseFloat(producto.Precio);
                    if(self.env.pos.config.comision_servicio){
                        comision =self.env.pos.config.comision_servicio;
                    }
                }
                if(tipo == "2"){
                    if(self.env.pos.config.comision_servicio){
                        comision =parseFloat(self.env.pos.config.comision_servicio);
                        $("#input_ref").text( " $" + self.env.pos.config.comision_servicio);
                        $("#input_ref").val(self.env.pos.config.comision_servicio);
                    }else{
                        comision =  parseFloat(producto.Precio)
                        $("#input_ref").val(parseFloat(producto.Precio));
                    }
                }
                $("#importe_a_pagar").text("$"+(comision+monto));
		        $("#nom_producto").text(producto.Producto);
            }


        }
        clickSiguente(event){

                let producto = this.props.producto;
            	var no_telefono = $("#input_telefono").val();
            	var referencia = $("#input_ref").val();
            	var monto = $("#input_monto").val();
            	$('.o_loading').show();
                $('.cancel').removeClass("desactivado");
                $('.ok_detalles').removeClass("desactivado");
                $(".no_mensaje").val("Estamos realizando su operación, Por favor Espere.");
                $(".no_mensaje").removeClass("tiene-error");
                $('.cancel').addClass("desactivado");
                $('.ok_detalles').addClass("desactivado");
                console.log("telefono que se esta enviando");
                console.log(no_telefono);
                var self = this
                // solicitud real
                var parametros ={
                    method: 'POST',
                    async: true,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    'CodigoDispositivo': self.env.pos.config.usuario,
                    'PasswordDispositivo': window.btoa(self.env.pos.config.password),
                    'IdDistribuidor':self.env.pos.config.id_distribuidor,
                    'Telefono':no_telefono,  //Telefono
                    'Referencia': referencia,
                    'Monto': monto,
                    'IdServicio':producto.IdServicio,
                    'IdProducto':producto.IdProducto
                };
                $.ajax({
                      method: "POST",
                      url:  self.env.pos.config.url+"Abonar",
                      data: JSON.stringify(parametros),
                      type: "POST",
                      headers: {
                          "Content-Type":"application/json"
                      }
                }).done(function( data ) {
                    console.log("recicibido al confirmar");
                    console.log(data);
                    $('.o_loading').hide();
                    $('.cancel').removeClass("desactivado");
                    $('#registrar_ta').removeClass("desactivado");
                    var tel_display = "";
                    var tipo = producto.tipo;
                    if (tipo == "1"){
                        tel_display = " Tel. " + no_telefono;
                    }
                    var order = self.env.pos.get_order();
                    var product_base = self.env.pos.db.get_product_by_barcode('PAGO_SERV');
                    var product_comision_base = self.env.pos.db.get_product_by_barcode('COM_PAGO_SERV');

                    var product = Object.create(product_base);
                    var product_comision = Object.create(product_comision_base);

                    if (data.NUM_AUTORIZACION == "-1"){
                       $('.cancel').removeClass("desactivado");
                       $('.ok_detalles').removeClass("desactivado");
                       $(".no_mensaje").addClass("tiene-error");
                       $(".no_mensaje").val(data.TEXTO);
                    }
                    else{
                        product.list_price =$("#input_monto").val();
                        product.lst_price =$("#input_monto").val();
                        product.standard_price =$("#input_monto").val();

                        product.display_name = producto.Producto+ tel_display +" N° Autorización: "+data.NUM_AUTORIZACION;
                        order.add_product(product);  //      ,{ quantity:$(".input_monto").val()}                         // order.add_product(product,{ price: $("#importe_a_pagar").val() , quantity:"1"});


                        var comision_final = parseFloat($("#input_ref").val()) || 0;
                        if(comision_final > 0)  {

                            product_comision.list_price = $("#input_ref").val();
                            product_comision.lst_price = $("#input_ref").val();
                            product_comision.standard_price = $("#input_ref").val();

                            product_comision.display_name = "Comision por pago de servicio";
                            order.add_product(product_comision); //  ,{ quantity: parseFloat($(".comision").val())}       // order.add_product(product,{ price: $("#importe_a_pagar").val() , quantity:"1"});
                        }
                        self.trigger('close-popup');

                        $(".no_mensaje").val(data.TEXTO);
                        $('.cancel').removeClass("desactivado");
                        $('.ok_detalles').removeClass("desactivado");
                    }
        });
        }

        /* //TODO COMBOBOX
            $( function() { */


    }
    DetallesDePagoPopup.template ='DetallesDePago'
    DetallesDePagoPopup.defaultProps = {
       confirmText: 'Ok',
       cancelText: 'Cancel',
       title: 'Products',
       body: '',
    };
    Registries.Component.add(DetallesDePagoPopup);

   return TiempoAireBoton;
});