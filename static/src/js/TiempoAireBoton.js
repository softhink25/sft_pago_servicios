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
                /*Gui.showPopup("ErrorPopup", {
                       title: this.env._t('Payment Screen Custom Button Clicked'),
                       body: this.env._t('Welcome to OWL'),
                   });*/
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

   class CompaniaPopup extends AbstractAwaitablePopup {
        constructor() {
            super(...arguments);
            useListener('click-compania', this.clickClient);

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
                    self.trigger('close-temp-screen');

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



    class ProductoPopup extends AbstractAwaitablePopup {
        constructor() {
            super(...arguments);
            useListener('click-producto', this.clickProducto);
        }

        clickProducto(event) {
            var self = this;
            let producto = event.detail.producto;
            console.log(producto);
            self.trigger('close-temp-screen');
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
                         self.$('#registrar_ta').addClass("desactivado");
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
                            //var order = self.pos.get_order();
                            var order = self.env.pos.get_order();
                            var product_base = self.env.pos.db.get_product_by_barcode('TIEMPO_AIRE');

                            //clona producto para evitar que sobreescriba otro
                            var product = Object.create(product_base);
                            product.display_name= producto.Producto+" Tel. "+no_telefono+" No. Autorización : "+data.NUM_AUTORIZACION;
                            product.list_price = producto.Precio;
                            product.lst_price = producto.Precio;
                            product.standard_price = producto.Precio;


                            /*product.display_name= self.env.producto.Producto+" Tel. "+no_telefono+" No. Autorización : "+data.NUM_AUTORIZACION;
                            product.list_price = self.env.producto.Precio;
                            product.lst_price = self.env.producto.Precio;
                            product.standard_price = self.env.producto.Precio;*/



                            order.add_product(product);
                            var order_line = order.get_last_orderline();
                            order_line.set_description(product.display_name);
                            //order.get_last_orderline().set_descripcion(product.display_name);


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
                                    order.get_last_orderline().set_descripcion(self.gui.producto.Producto);

                                  }
                                  else if (producto.Precio < self.env.pos.config.minimo_tiempo_aire){
                                      comision_prod.display_name = "Comision tiempo aire";
                                      comision_prod.list_price = self.env.pos.config.comision_tiempo_aire;
                                      comision_prod.lst_price = self.env.pos.config.comision_tiempo_aire;
                                      comision_prod.standard_price = self.env.pos.config.comision_tiempo_aire;
                                      order.add_product(comision_prod);
                                      order.get_last_orderline().set_descripcion(self.gui.producto.Producto);

                                  }
                              }



                            self.trigger('close-temp-screen');
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


   return TiempoAireBoton;
});