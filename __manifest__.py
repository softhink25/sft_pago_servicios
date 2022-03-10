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
    'depends': ['point_of_sale'],
    'assets': {
        'point_of_sale.assets': [
            'sft_pago_servicios/static/src/js/**/*',
        ],
        'web.assets_qweb': [
            'sft_pago_servicios/static/src/xml/**/*',
        ],
    },
    # 'qweb': [
    #     'static/src/xml/pos.xml',
    # ],
    'data': [
        'views/productos_view.xml',
        "views/view_pos_config.xml"
    ],
    'installable': True,
    'application': True,
    'demo': [],
    'test': []
}
