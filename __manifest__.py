# coding: utf-8

{
    'name': 'SFT-Pago servicios',
    'version': '11.0.1.0.0',
    'author': 'Softhink',
    'maintainer': 'Softhink',
    'website': 'http://www.sft.com.mx',
    'license': 'AGPL-3',
    'category': 'Point of sale',
    'summary': 'Pago de servicios',
    'depends': ['base_setup', 'point_of_sale'],
    'assets': {
        'point_of_sale.assets': [
            'sft_pago_servicios/static/src/js/**/*',
            'sft_pago_servicios/static/src/xml/tiempo_aire_template.xml',
            'sft_pago_servicios/static/src/xml/pos.xml',
        ],
        'web.assets_qweb': [
            'sft_pago_servicios/static/src/xml/**/*',
        ],
    },
    'data': [
        'views/productos_view.xml',
        "views/pos_config_settings.xml",
    ],
    'installable': True,
    'application': True,
    'demo': [],
    'test': []
}
