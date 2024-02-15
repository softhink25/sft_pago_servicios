odoo.define('pos_button.Custom', function(require) {
'use strict';
  const { Gui } = require('point_of_sale.Gui');
  const PosComponent = require('point_of_sale.PosComponent');
  const { identifyError } = require('point_of_sale.utils');
  const ProductScreen = require('point_of_sale.ProductScreen');
  const { useListener } = require("@web/core/utils/hooks");
  const Registries = require('point_of_sale.Registries');
  const PaymentScreen = require('point_of_sale.PaymentScreen');
  const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
  const ajax = require('web.ajax');
  class TiempoAireButton extends PosComponent {
      setup() {
          super.setup();
          useListener('click', this.onClick);
      }
     async onClick() {
               const { confirmed} = await
                this.showPopup("CompaniaPopup", {
                  });
     }
  };
   var producto_sel ={};
  class ProductoPopup extends AbstractAwaitablePopup {
      setup() {
          super.setup();
          var self = this;
          this.props.productos =[];
          var propiedades = {
                    method: 'POST',
                    async: true,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    'compania':event.currentTarget.attributes.compania.value,
                    'CodigoDispositivo':this.env.pos.config.usuario,
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
                        self.props.productos = data.productos;
                        var productos =self.props.productos;
                        var contenedor = $("#contenedor_producto");
                        var producto_base = $("#producto_base");
                        $(productos).each( function( k, v ) {
                               var producto =$(producto_base).clone();
                               $(producto).attr("id",v.IdProducto);
                               $(producto).attr("precio",v.Precio);
                               $(producto).removeClass("invisible");
                               $(producto).click(function (){
                                    producto_sel = v;
                                    Gui.showPopup('TiempoAirePopup', { });
                               });
                               if(v.Producto.includes("$")){
                                    $(producto).text(v.Producto);
                               }else{
                                    $(producto).text(v.Producto+ " $"+v.Precio);
                               }

                               $(contenedor).append(producto);
                        });
                });
                $('.producto').click(function(){
                    alert($(this).attr("id"));
                });
      }
      async onSeleccionarCompania (event){
                 this.closePopup();
                 this.openProductPopup();

    }
    async openTaPopup(){
                this.showPopup('TiempoAirePopup', { });
    }
    async closePopup(){
          this.confirm();
    }
  }
  class CompaniaPopup extends AbstractAwaitablePopup {
      setup() {
          super.setup();
           /* const { confirmed} = await*/
                    const propiedades = {
                    method: 'POST',
                    async: true,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    'CodigoDispositivo':this.env.pos.config.usuario,
                    'PasswordDispositivo': window.btoa(this.env.pos.config.password),
                    'IdDistribuidor':this.env.pos.config.id_distribuidor,
                };
                $.ajax({
                          method: "POST",
                          url:this.env.pos.config.url+"ConsultarSaldo",
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
          /*useListener('click', this.onClick);*/
      }
      async onSeleccionarCompania (event){
                Gui.compania =event.currentTarget.attributes.compania.value;
                 this.closePopup();
                 this.openProductPopup();

    }
        async openProductPopup(){
                    const { confirmed} = await
                    this.showPopup('ProductoPopup', { });
        }
        async closePopup(){
              this.confirm();

        }
     async onClick() {
             $('#registar_abono').click(function(){
                Gui.show_popup('sft-abonar-popup');
                $("#abono_abonar").removeClass("invisible");
                });
            $('.compania').click(function(){
                Gui.compania=$(this).attr("compania");
                if(Gui.compania =="2"){
                    $("#titulo_producto").text("Telcel");
                }else if(Gui.compania =="2"){
                }
                Gui.show_popup('sft-producto-popup');
		    });
                 /*}*/
  }
  }
  class TiempoAirePopup extends AbstractAwaitablePopup {

      setup() {
          super.setup();
		    if(producto_sel!=undefined){
		        $("#titulo_producto").text(producto_sel.Producto);
		    }
      }
        getOrder() {
            return this.env.pos.get_order();
        }
         async _getAddProductOptions(product, code) {
            let price_extra = 0.0;
            let draftPackLotLines, weight, description, packLotLinesToEdit;

            if (_.some(product.attribute_line_ids, (id) => id in this.env.pos.attributes_by_ptal_id)) {
                let attributes = _.map(product.attribute_line_ids, (id) => this.env.pos.attributes_by_ptal_id[id])
                                  .filter((attr) => attr !== undefined);
                let { confirmed, payload } = await this.showPopup('ProductConfiguratorPopup', {
                    product: product,
                    attributes: attributes,
                });

                if (confirmed) {
                    description = payload.selected_attributes.join(', ');
                    price_extra += payload.price_extra;
                } else {
                    return;
                }
            }

            // Gather lot information if required.
            if (['serial', 'lot'].includes(product.tracking) && (this.env.pos.picking_type.use_create_lots || this.env.pos.picking_type.use_existing_lots)) {
                const isAllowOnlyOneLot = product.isAllowOnlyOneLot();
                if (isAllowOnlyOneLot) {
                    packLotLinesToEdit = [];
                } else {
                    const orderline = this.currentOrder
                        .get_orderlines()
                        .filter(line => !line.get_discount())
                        .find(line => line.product.id === product.id);
                    if (orderline) {
                        packLotLinesToEdit = orderline.getPackLotLinesToEdit();
                    } else {
                        packLotLinesToEdit = [];
                    }
                }
                // if the lot information exists in the barcode, we don't need to ask it from the user.
                if (code && code.type === 'lot') {
                    // consider the old and new packlot lines
                    const modifiedPackLotLines = Object.fromEntries(
                        packLotLinesToEdit.filter(item => item.id).map(item => [item.id, item.text])
                    );
                    const newPackLotLines = [
                        { lot_name: code.code },
                    ];
                    draftPackLotLines = { modifiedPackLotLines, newPackLotLines };
                } else {
                    const { confirmed, payload } = await this.showPopup('EditListPopup', {
                        title: this.env._t('Lot/Serial Number(s) Required'),
                        isSingleItem: isAllowOnlyOneLot,
                        array: packLotLinesToEdit,
                    });
                    if (confirmed) {
                        // Segregate the old and new packlot lines
                        const modifiedPackLotLines = Object.fromEntries(
                            payload.newArray.filter(item => item.id).map(item => [item.id, item.text])
                        );
                        const newPackLotLines = payload.newArray
                            .filter(item => !item.id)
                            .map(item => ({ lot_name: item.text }));

                        draftPackLotLines = { modifiedPackLotLines, newPackLotLines };
                    } else {
                        // We don't proceed on adding product.
                        return;
                    }
                }
            }

            // Take the weight if necessary.
            if (product.to_weight && this.env.pos.config.iface_electronic_scale) {
                // Show the ScaleScreen to weigh the product.
                if (this.isScaleAvailable) {
                    const { confirmed, payload } = await this.showTempScreen('ScaleScreen', {
                        product,
                    });
                    if (confirmed) {
                        weight = payload.weight;
                    } else {
                        // do not add the product;
                        return;
                    }
                } else {
                    await this._onScaleNotAvailable();
                }
            }

            if (code && this.env.pos.db.product_packaging_by_barcode[code.code]) {
                weight = this.env.pos.db.product_packaging_by_barcode[code.code].qty;
            }

            return { draftPackLotLines, quantity: weight, description, price_extra };
        }
         async _add_product(prd) {
            try{
                 const options = await this._getAddProductOptions(prd);
                 await this.getOrder().add_product(prd,options);
                 this.closePopup();
            }catch(e){
                e = e;
            }

        }
         add_product(product, options) {
            super.add_product(...arguments);
            this._updateRewards();
        }
       async onConfirmarTa (event){
                  var self =this;
                var producto = producto_sel;
            	var no_telefono = $(".no_telefono").val();
            	var no_confirma = $(".no_confirma").val();
                $('.o_loading').show();
                $('.cancel').removeClass("desactivado");
                $('#registrar_ta').removeClass("desactivado");
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
                            'CodigoDispositivo': this.env.pos.config.usuario,
                            'PasswordDispositivo': window.btoa(this.env.pos.config.password),
                            'IdDistribuidor':this.env.pos.config.id_distribuidor,
                            'Telefono':no_telefono,
                            'IdServicio':producto.IdServicio,
                            'IdProducto':producto.IdProducto
                        };

                    $('.cancel').addClass("desactivado");
                    $('#registrar_ta').addClass("desactivado");
                    $.ajax({
                          method: "POST",
                          url:  this.env.pos.config.url+"Abonar",
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
                                          url:  this.env.pos.config.url+"ConfirmaTransaccion",
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
                                            var order = getOrder();
                                            var product_base = self.env.pos.db.get_product_by_barcode('TIEMPO_AIRE');
                                            //clona producto para evitar que sobreescriba otro
                                            var product_clone = Object.create(product_base);
                                            product_clone.display_name= producto.Producto+" Tel. "+no_telefono+" No. Autorización : "+data.NUM_AUTORIZACION;
                                            product_clone.list_price = producto.Precio;
                                            product_clone.lst_price = producto.Precio;
                                            product_clone.standard_price = producto.Precio;
                                            product_clone.list_price = producto.Precio;
                                             self._add_product(product_clone);
                                            if(self.env.pos.config.comision_tiempo_aire){
                                                  var comision_prod_base = self.env.pos.db.get_product_by_barcode('COM_PAGO_SERV');
                                                  //clona producto para evitar que sobreescriba otro
                                                  var comision_prod = Object.create(comision_prod_base);
                                                  if(!self.env.pos.config.minimo_tiempo_aire){
                                                    comision_prod.display_name = "Comision tiempo aire";

                                                    comision_prod.list_price = self.env.pos.config.comision_tiempo_aire;
                                                    comision_prod.lst_price = self.env.pos.config.comision_tiempo_aire;
                                                    comision_prod.standard_price = self.env.pos.config.comision_tiempo_aire;

                                                     self._add_product(comision_prod,options);
                                                    order.get_last_orderline().set_descripcion(producto.Producto);

                                                  }
                                                  else if (producto.Precio < self.env.pos.config.minimo_tiempo_aire){
                                                      comision_prod.display_name = "Comision tiempo aire";
                                                      comision_prod.list_price = self.env.pos.config.comision_tiempo_aire;
                                                      comision_prod.lst_price = self.env.pos.config.comision_tiempo_aire;
                                                      comision_prod.standard_price = self.env.pos.config.comision_tiempo_aire;
                                                       self._add_product(comision_prod);
                                                      order.get_last_orderline().set_descripcion(producto.Producto);
                                                  }
                                            }
                                            $(".no_mensaje").val(data.TEXTO);
                                         } else{
                                            $(".no_mensaje").addClass("tiene-error");
                                            $(".no_mensaje").val(data.TEXTO);
                                         }


                                }).fail(function( data ) {
                                    $('.cancel').removeClass("desactivado");
                                    $('#registrar_ta').removeClass("desactivado");
                                    $('.o_loading').hide();
                                    $(".no_mensaje").addClass("tiene-error");
                                    $(".no_mensaje").val(data.responseText);
                                 });
                         }else if("-1"!==data.NUM_AUTORIZACION&&"0"!==data.NUM_AUTORIZACION){
                            var order = self.getOrder();
                            var product_base = self.env.pos.db.get_product_by_barcode('TIEMPO_AIRE');

                            //clona producto para evitar que sobreescriba otro
                            var product = Object.create(product_base);
                            product.display_name= producto.Producto+" Tel. "+no_telefono+" No. Autorización : "+data.NUM_AUTORIZACION;
                            product.list_price = producto.Precio;
                            product.lst_price = producto.Precio;
                            product.standard_price = producto.Precio;

                            self._add_product(product);


                            if(self.env.pos.config.comision_tiempo_aire){
                                  var comision_prod_base = self.env.pos.db.get_product_by_barcode('COM_PAGO_SERV');
                                  //clona producto para evitar que sobreescriba otro
                                  var comision_prod = Object.create(comision_prod_base);
                                  if(!self.env.pos.config.minimo_tiempo_aire){
                                    comision_prod.display_name = "Comision tiempo aire";
                                    comision_prod.list_price = self.env.pos.config.comision_tiempo_aire;
                                    comision_prod.lst_price = self.env.pos.config.comision_tiempo_aire;
                                    comision_prod.standard_price = self.env.pos.config.comision_tiempo_aire;
                                    self._add_product(comision_prod);

                                  }
                                  else if (producto.Precio < self.env.pos.config.minimo_tiempo_aire){
                                      comision_prod.display_name = "Comision tiempo aire";
                                      comision_prod.list_price = self.env.pos.config.comision_tiempo_aire;
                                      comision_prod.lst_price = self.env.pos.config.comision_tiempo_aire;
                                      comision_prod.standard_price = self.env.pos.config.comision_tiempo_aire;
                                      self._add_product(comision_prod);

                                  }
                              }



                            self.closePopup();
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
                    $('.cancel').removeClass("desactivado");
                         $('#registrar_ta').removeClass("desactivado");
                    $(".no_mensaje").addClass("tiene-error");
	            	$(".no_mensaje").val("El No. de Télefono y la confirmación deben ser iguales, Verifique por favor.");
	            }
                 /*this.closePopup();
                 this.openProductPopup();*/

        }
        async closePopup(){
              this.confirm();

        }

  }
  CompaniaPopup.template = "CompaniaPopup";
  ProductoPopup.template ="ProductoPopup";


  class PagoServicioButton extends PosComponent {
     setup() {
          super.setup();
          useListener('click', this.onClick);
     }
     async onClick() {
               const { confirmed} = await
                this.showPopup("ProductoPopup", { });
     }
  }
  PagoServicioButton.template = 'PagoServicioButton';
  TiempoAireButton.template = 'TiempoAireButton';
  TiempoAirePopup.template = 'TiempoAirePopup';
  ProductScreen.addControlButton({
      component: PagoServicioButton,
      condition: function() {
          return this.env.pos;
      },
  });
  ProductScreen.addControlButton({
      component: TiempoAireButton,
      condition: function() {
          return this.env.pos;
      },
  })
  Registries.Component.add(PagoServicioButton);
  Registries.Component.add(TiempoAireButton);
  Registries.Component.add(TiempoAirePopup);
  Registries.Component.add(CompaniaPopup);
  Registries.Component.add(ProductoPopup);
  return PagoServicioButton;
});