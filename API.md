# API Docs — cb-api-business

Base URL: `https://cb-api-business.up.railway.app`

## Autenticación

Todas las rutas protegidas requieren header:
```
Authorization: Bearer <jwt_token>
```

Los tokens se obtienen via login de admin o verificación OTP de cliente.

---

## Auth

### POST /api/auth/login
Login administrador con email y contraseña.

**Body:**
```json
{ "email": "admin@columbiaburger.com", "password": "..." }
```
**Response `200`:**
```json
{ "token": "<jwt>", "role": "ADMIN" }
```

### POST /api/auth/otp/send
Envía código OTP al WhatsApp del cliente.

**Body:** `{ "whatsapp": "3001234567" }`
**Response `200`:** vacío

### POST /api/auth/otp/verify
Verifica el código OTP y devuelve token CUSTOMER.

**Body:** `{ "whatsapp": "3001234567", "code": "123456" }`
**Response `200`:** `{ "token": "<jwt>", "role": "CUSTOMER" }`

---

## Clientes

### GET /api/customers
Lista todos los clientes. **Requiere ADMIN.**

### GET /api/customers/{id}
Cliente por ID. **Requiere ADMIN.**

### GET /api/customers/whatsapp/{number}
Cliente por número de WhatsApp. **Público.**

### PATCH /api/customers/whatsapp/{number}/location
Actualiza coordenadas GPS del cliente.

**Body:** `{ "latitude": 4.123, "longitude": -74.456 }`

### GET /api/customers/me
Perfil del cliente autenticado. **Requiere CUSTOMER.**

### GET /api/customers/me/orders
Pedidos del cliente autenticado. **Requiere CUSTOMER.**

### POST /api/customers
Crea o actualiza cliente. **Público.**

**Body:**
```json
{
  "name": "Juan García",
  "whatsapp": "3001234567",
  "neighborhood": "Chapinero",
  "address": "Calle 50 #10-20"
}
```

---

## Pedidos

### POST /api/orders
Crea un nuevo pedido. **Público** (usado por el agente WhatsApp y el frontend).

**Body:**
```json
{
  "customerName": "Juan García",
  "customerWhatsapp": "3001234567",
  "customerNeighborhood": "Chapinero",
  "customerAddress": "Calle 50 #10-20",
  "items": [
    {
      "productId": 1,
      "productName": "Classic Burger",
      "flavor": "Normal",
      "additions": "Queso extra",
      "quantity": 2,
      "unitPrice": 18000
    }
  ],
  "deliveryZone": "Zona Centro",
  "deliveryFee": 5000,
  "notes": "Sin cebolla",
  "source": "WEB"
}
```
**Response `201`:** `OrderResponse`

### GET /api/orders
Lista todos los pedidos. Soporta filtros opcionales:
- `?status=RECEIVED` — filtra por estado
- `?from=2026-05-01T00:00:00` — desde fecha ISO
**Requiere autenticación.**

### GET /api/orders/{id}
Pedido por ID. **Requiere autenticación.**

### GET /api/orders/{id}/tracking
Estado del pedido para el cliente (sin autenticación). **Público.**

### GET /api/orders/kitchen
Pedidos en RECEIVED y PREPARING para la cocina. **Requiere ADMIN o KITCHEN.**

### GET /api/orders/delivery
Pedidos en ON_THE_WAY para el domiciliario. **Requiere ADMIN o DELIVERY.**

### GET /api/orders/events
SSE stream de eventos de pedidos en tiempo real. **Público.**

Emite eventos `data: {...OrderResponse...}` al crear o actualizar un pedido.

### PATCH /api/orders/{id}/status
Cambia el estado de un pedido. **Requiere ADMIN, KITCHEN o DELIVERY.**

**Body:** `{ "status": "PREPARING" }`

Estados válidos: `RECEIVED → PREPARING → ON_THE_WAY → DELIVERED | CANCELLED`

### PUT /api/orders/{id}
Actualiza ítems, domicilio y notas de un pedido. **Requiere ADMIN.**

**Body:**
```json
{
  "items": [
    { "productId": 1, "productName": "Classic Burger", "quantity": 1, "unitPrice": 18000 }
  ],
  "deliveryFee": 5000,
  "deliveryZone": "Zona Norte",
  "notes": "Pago con efectivo"
}
```
**Response `200`:** `OrderResponse` con total recalculado.

---

## Facturas

Todos los endpoints requieren **ADMIN**.

### GET /api/invoices
Lista todos los pedidos con sus datos de factura (todos los estados).

**Response `200`:** `List<OrderResponse>`

### POST /api/invoices/{orderId}/generate
Genera una factura interna para el pedido. Asigna número `CB-YYYY-NNNN` secuencial.

- Solo aplica si `invoiceStatus == PENDING`
- Devuelve `409 Conflict` si ya fue facturado

**Response `200`:** `OrderResponse` con `invoiceStatus: INVOICED`, `invoiceNumber: "CB-2026-0001"`

### PATCH /api/invoices/{orderId}/void
Anula una factura emitida.

- Solo aplica si `invoiceStatus == INVOICED`
- Devuelve `400 Bad Request` si no está facturado

**Response `200`:** `OrderResponse` con `invoiceStatus: VOID`

---

## Dashboard y Estadísticas

Todos los endpoints requieren **ADMIN**.

### GET /api/admin/stats
Estadísticas del día actual.

**Response `200`:**
```json
{
  "ordersToday": 12,
  "revenueToday": 216000,
  "avgOrderValue": 18000,
  "deliveredToday": 9
}
```

### GET /api/admin/products/top
Top 5 productos más vendidos.

**Response `200`:** `[{ "productName": "Classic Burger", "totalSold": 45 }]`

### GET /api/admin/stats/daily
Estadísticas diarias de los últimos 7 días.

**Response `200`:** `[{ "date": "2026-05-01", "orders": 12, "revenue": 216000 }]`

### GET /api/admin/stats/by-source
Desglose de pedidos por canal (WEB, WHATSAPP, WAITER).

### GET /api/admin/stats/by-hour
Distribución de pedidos por hora del día.

---

## Catálogo (proxy)

Estos endpoints proxean la respuesta de `cb-data-api` y la cachean en Redis.

### GET /api/categories
Categorías del menú con productos, sabores y adiciones activas. **Público.**

### GET /api/products
Productos del catálogo. **Público.**
- `?available=true` — solo disponibles

### GET /api/seasonal-specials
Especiales de temporada activos. **Público.**

---

## Modelos de respuesta

### OrderResponse
```json
{
  "id": 123,
  "customerId": 45,
  "customerName": "Juan García",
  "customerWhatsapp": "3001234567",
  "customerLatitude": 4.123,
  "customerLongitude": -74.456,
  "status": "ON_THE_WAY",
  "source": "WEB",
  "total": 41000,
  "deliveryFee": 5000,
  "deliveryZone": "Zona Centro",
  "notes": "Sin cebolla",
  "createdAt": "2026-05-01T20:30:00",
  "invoiceStatus": "PENDING",
  "invoiceNumber": null,
  "invoicedAt": null,
  "items": [
    {
      "id": 1,
      "productId": 10,
      "productName": "Classic Burger",
      "flavor": "Normal",
      "additions": "Queso extra",
      "quantity": 2,
      "unitPrice": 18000,
      "subtotal": 36000,
      "note": null
    }
  ]
}
```

### CustomerResponse
```json
{
  "id": 45,
  "name": "Juan García",
  "whatsapp": "3001234567",
  "neighborhood": "Chapinero",
  "address": "Calle 50 #10-20",
  "latitude": 4.123,
  "longitude": -74.456,
  "createdAt": "2026-01-15T10:00:00"
}
```

---

## Códigos de error comunes

| Código | Significado |
|--------|-------------|
| `401`  | Token ausente o expirado |
| `403`  | Rol insuficiente |
| `404`  | Recurso no encontrado |
| `409`  | Conflicto (ej. pedido ya facturado) |
| `400`  | Validación o estado inválido |
