# -*- coding: utf-8 -*-

from odoo import fields, models,tools,api, _
from datetime import timedelta
from datetime import datetime
import logging
from odoo.tools import float_is_zero
import psycopg2

class Product(models.Model):
    _inherit = 'product.template'

    tiempo_aire = fields.Boolean("Producto tiempo aire");
    gp_servicio = fields.Char("Servicio")
    gp_idservicio = fields.Integer("Id Servicio")
    gp_idproducto = fields.Integer("Id Producto")


