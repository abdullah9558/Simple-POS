export const IPC = {
  PRODUCT_GET_ALL:       'product:getAll',
  PRODUCT_GET_BY_ID:     'product:getById',
  PRODUCT_GET_BY_BARCODE:'product:getByBarcode',
  PRODUCT_CREATE:        'product:create',
  PRODUCT_UPDATE:        'product:update',
  PRODUCT_DELETE:        'product:delete',
  PRODUCT_LOW_STOCK:     'product:lowStock',
  PRODUCT_COUNT:         'product:count',

  SALE_GET_ALL:          'sale:getAll',
  SALE_GET_BY_ID:        'sale:getById',
  SALE_CREATE:           'sale:create',
  SALE_REFUND:           'sale:refund',
  SALE_TODAY_SUMMARY:    'sale:todaySummary',
  SALE_COUNT:            'sale:count',

  CUSTOMER_GET_ALL:      'customer:getAll',
  CUSTOMER_GET_BY_ID:    'customer:getById',
  CUSTOMER_CREATE:       'customer:create',
  CUSTOMER_UPDATE:       'customer:update',
  CUSTOMER_DELETE:       'customer:delete',
  CUSTOMER_COUNT:        'customer:count',
  CUSTOMER_PURCHASE_HISTORY: 'customer:purchaseHistory',

  REPORT_DAILY_SALES:    'report:dailySales',
  REPORT_WEEKLY_SALES:   'report:weeklySales',
  REPORT_MONTHLY_SALES:  'report:monthlySales',
  REPORT_PROFIT:         'report:profit',
  REPORT_INVENTORY:      'report:inventory',
  REPORT_FAST_MOVING:    'report:fastMoving',
  REPORT_SLOW_MOVING:    'report:slowMoving',

  INVENTORY_GET_MOVEMENTS:    'inventory:getMovements',
  INVENTORY_PRODUCT_HISTORY:  'inventory:productHistory',
  INVENTORY_ADJUST:           'inventory:adjust',
  INVENTORY_BULK_ADJUST:      'inventory:bulkAdjust',
  INVENTORY_LOW_STOCK:        'inventory:lowStock',
  INVENTORY_LOW_STOCK_COUNT:  'inventory:lowStockCount',

  SUPPLIER_GET_ALL:      'supplier:getAll',
  SUPPLIER_GET_BY_ID:    'supplier:getById',
  SUPPLIER_CREATE:       'supplier:create',
  SUPPLIER_UPDATE:       'supplier:update',
  SUPPLIER_DELETE:       'supplier:delete',
  SUPPLIER_COUNT:        'supplier:count',

  PURCHASE_ORDER_GET_ALL:    'purchaseOrder:getAll',
  PURCHASE_ORDER_GET_BY_ID:  'purchaseOrder:getById',
  PURCHASE_ORDER_CREATE:     'purchaseOrder:create',
  PURCHASE_ORDER_RECEIVE:    'purchaseOrder:receive',
  PURCHASE_ORDER_CANCEL:     'purchaseOrder:cancel',
  PURCHASE_ORDER_COUNT:      'purchaseOrder:count',

  SETTINGS_GET:          'settings:get',
  SETTINGS_SET:          'settings:set',
  SETTINGS_GET_ALL:      'settings:getAll',
  SETTINGS_UPDATE_ALL:   'settings:updateAll',

  USER_GET_ALL:          'user:getAll',
  USER_GET_BY_ID:        'user:getById',
  USER_CREATE:           'user:create',
  USER_UPDATE:           'user:update',
  USER_DELETE:           'user:delete',
  USER_COUNT:            'user:count',

  DB_INFO:               'db:info',
  DB_BACKUP:             'db:backup',
  DB_RESTORE:            'db:restore',

  PRINT_LIST_PRINTERS:         'print:listPrinters',
  PRINT_RECEIPT:               'print:receipt',
  PRINT_RECEIPT_PREVIEW_HTML:  'print:receiptPreviewHtml',
  PRINT_RECEIPT_ESCPOS:        'print:receiptEscpos',
  PRINT_RECEIPT_THERMAL:       'print:receiptThermal',

  INVOICE_GENERATE_PDF:  'invoice:generatePdf',
  INVOICE_DELIVER:       'invoice:deliver',
  COMMUNICATION_TEST_EMAIL: 'communication:testEmail',
  COMMUNICATION_TEST_WHATSAPP: 'communication:testWhatsApp',
  COMMUNICATION_STATUS: 'communication:status',

  CATEGORY_GET_ALL:      'category:getAll',
  CATEGORY_GET_BY_ID:    'category:getById',
  CATEGORY_CREATE:       'category:create',
  CATEGORY_UPDATE:       'category:update',
  CATEGORY_DELETE:       'category:delete',
  CATEGORY_COUNT:        'category:count',

  STORE_LIST:            'store:list',
  STORE_GET_ACTIVE:      'store:getActive',
  STORE_SET_ACTIVE:      'store:setActive',
  STORE_CREATE:          'store:create',

  STOCK_TRANSFER_LIST:   'stockTransfer:list',
  STOCK_TRANSFER_CREATE: 'stockTransfer:create',

  SYNC_STATUS:           'sync:status',
  SYNC_NOW:              'sync:now',

  AUTH_LOGIN:            'auth:login',
  AUTH_LOGOUT:           'auth:logout',
  AUTH_ME:               'auth:me',
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]

export const ALL_CHANNELS: string[] = Object.values(IPC)
