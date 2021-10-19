# -*- coding: utf-8 -*-

from odoo import fields, models,tools,api, _
from datetime import timedelta
from datetime import datetime
import logging
from odoo.tools import float_is_zero
import psycopg2

class GestoProducto(models.Model):
    _inherit = 'gestopago.producto'

    servicio = fields.Char
