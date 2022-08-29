
from odoo import models, fields, api, _
from odoo.tools import float_is_zero


class PosConfig(models.Model):
    _inherit = 'pos.config'

    url = fields.Char(string='URL de Servicio')
    usuario = fields.Char(string='Usuario')
    password = fields.Char(string='Password')
    id_distribuidor = fields.Char(string='Id distribuidor')

    comision_servicio = fields.Float(string='Comision PAGO DE SERVICIOS')
    minimo_tiempo_aire = fields.Float(string='Monto minimo para omitir comision TA')
    comision_tiempo_aire = fields.Float(string='Comision TIEMPO AIRE')


class PosOrderLine(models.Model):
    _inherit = 'pos.order.line'

    descripcion = fields.Char(string="Descripcion")
    precio_servicio = fields.Float()

    @api.model
    def _order_fields(self, ui_order):
        order_fields = super(PosOrderLine, self)._order_fields(ui_order)

        order_fields['precio_servicio'] = ui_order.get('precio_servicio', False)
        order_fields['descripcion'] = ui_order.get('descripcion', False)

        return order_fields

    '''
    @api.model
    def create(self, vals):
        if "precio_servicio" in vals:
            vals['price_unit'] = vals['precio_servicio']
        return super(PosOrderLine, self).create(vals)

    '''


class AutocreateProdPagoServicios(models.Model):
    _name = 'autocreate.prod.pago.servicios'

    def init(self):
        existe_template = self.env['product.template'].search([('default_code', '=', 'PAGO_SERV')], count=True)
        existe_template_comision = self.env['product.template'].search([('default_code', '=', 'COM_PAGO_SERV')], count=True)
        existe_template_tiempo_aire = self.env['product.template'].search([('default_code', '=', 'TIEMPO_AIRE')], count=True)

        taxes = False
        iva_ta = self.env['account.tax'].search([('name', '=', 'IVA(16%) TA')], count=True)
        if iva_ta == 0:

            existe_grupo_imp_ta = self.env['account.tax.group'].search([('name', '=', 'IVA 16% TA')], count=True)
            if existe_grupo_imp_ta == 0:
                grupo_de_impuestos = self.env['account.tax.group'].create({'name': 'IVA 16% TA', 'sequence': 99})
            else:
                grupo_de_impuestos = self.env['account.tax.group'].search([('name', '=', 'IVA 16% TA')], limit=1)

            taxes = self.env['account.tax'].create({'name': 'IVA(16%) TA',
                                                    'type_tax_use': 'sale',
                                                    'amount_type': 'division',
                                                    # 'Porcentaje sobre el precio, impuestos incuidos'
                                                    'price_include': True,
                                                    'amount': 16,
                                                    'description': 'IVA(16%)',
                                                    'tax_group_id': grupo_de_impuestos.id})
        else:
            taxes = self.env['account.tax'].search([('name', '=', 'IVA(16%) TA')])



        if existe_template == 0:
            prod_univ_created = self.env['product.template']
            prod_univ_created.create({'name': 'Pago servicios',
                                      'type': 'service',
                                      'default_code': 'PAGO_SERV',
                                      'barcode': 'PAGO_SERV',
                                      'taxes_id': False,
                                      'supplier_taxes_id': False,
                                      'list_price': 1,
                                      'available_in_pos': True})

        if existe_template_comision == 0:
            prod_univ_created = self.env['product.template']
            prod_univ_created.create({'name': 'Comision pago servicio',
                                      'type': 'service',
                                      'default_code': 'COM_PAGO_SERV',
                                      'barcode': 'COM_PAGO_SERV',
                                      'taxes_id': False,
                                      'supplier_taxes_id': False,
                                      'list_price': 1,
                                      'available_in_pos': True})

        if existe_template_tiempo_aire == 0:



            prod_univ_created = self.env['product.template']
            prod_ta = prod_univ_created.create({'name': 'Tiempo aire',
                                      'type': 'service',
                                      'default_code': 'TIEMPO_AIRE',
                                      'barcode': 'TIEMPO_AIRE',
                                      'taxes_id': [(4, taxes.ids[0])],
                                      'supplier_taxes_id': False,
                                      'list_price': 1,
                                      'available_in_pos': True})




        # agregar en diferentes lineas los productos en pos
        self.env['uom.category'].search([('name', '=', 'Unit')], limit=1).is_pos_groupable = False
