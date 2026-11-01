# API Docs — cb-data-api

Base URL: `https://cb-data-api-production.up.railway.app`

Todos los endpoints de escritura requieren **ADMIN** (token JWT de cb-api-business).
Los endpoints de lectura del catálogo son **públicos**.

---

## Categorías

### GET /api/categories
Lista todas las categorías activas con sus productos.

**Response `200`:**
```json
[
  {
    "id": 1,
    "name": "Hamburguesas",
    "products": [ { "id": 10, "name": "Classic Burger", "price": 18000, ... } ]
  }
]
```

### GET /api/categories/{id}
Categoría por ID.

### POST /api/categories
Crea una categoría. **Requiere ADMIN.**

**Body:** `{ "name": "Hamburguesas" }`

### PUT /api/categories/{id}
Actualiza nombre de categoría. **Requiere ADMIN.**

### PATCH /api/categories/{id}/toggle-active
Activa o desactiva una categoría. **Requiere ADMIN.**

---

## Productos

### GET /api/products
Lista productos. **Público.**
- `?available=true` — solo productos disponibles
- `?categoryId=1` — filtrar por categoría

**Response `200`:**
```json
[
  {
    "id": 10,
    "categoryId": 1,
    "categoryName": "Hamburguesas",
    "name": "Classic Burger",
    "description": "Carne 100% res, lechuga, tomate, queso americano",
    "price": 18000,
    "available": true,
    "imageUrl": "https://res.cloudinary.com/...",
    "comboDescription": "+bebida 350ml",
    "flavors": [
      { "id": 1, "name": "Normal" },
      { "id": 2, "name": "Spicy" }
    ],
    "additions": [
      { "id": 1, "name": "Queso extra", "price": 2000, "effectivePrice": 2000 }
    ]
  }
]
```

### GET /api/products/{id}
Producto por ID.

### POST /api/products
Crea un producto. **Requiere ADMIN.**

**Body:**
```json
{
  "categoryId": 1,
  "name": "Classic Burger",
  "description": "...",
  "price": 18000,
  "available": true,
  "imageUrl": "https://res.cloudinary.com/...",
  "comboDescription": "+bebida 350ml"
}
```

### PUT /api/products/{id}
Actualiza un producto. **Requiere ADMIN.**

### PATCH /api/products/{id}/toggle-available
Cambia disponibilidad (visible en el menú). **Requiere ADMIN.**

### PATCH /api/products/{id}/flavors
Asigna los sabores de un producto. **Requiere ADMIN.**

**Body:** `{ "flavorIds": [1, 2, 3] }`

### PATCH /api/products/{id}/additions
Asigna adiciones a un producto con precio personalizado opcional. **Requiere ADMIN.**

**Body:**
```json
[
  { "additionId": 1, "customPrice": null },
  { "additionId": 2, "customPrice": 1500 }
]
```

### PATCH /api/products/{id}/combo
Define descripción de combo del producto. **Requiere ADMIN.**

**Body:** `{ "comboDescription": "+bebida 350ml" }`

### DELETE /api/products/{id}/combo
Elimina el combo de un producto. **Requiere ADMIN.**

---

## Sabores

### GET /api/flavors
Lista todos los sabores.

### GET /api/flavors/{id}
Sabor por ID.

### POST /api/flavors
Crea un sabor. **Requiere ADMIN.**

**Body:** `{ "name": "Spicy" }`

### PUT /api/flavors/{id}
Actualiza nombre. **Requiere ADMIN.**

### PATCH /api/flavors/{id}/toggle-active
Activa o desactiva. **Requiere ADMIN.**

---

## Adiciones

### GET /api/additions
Lista todas las adiciones activas.

### GET /api/additions/{id}
Adición por ID.

### POST /api/additions
Crea una adición global. **Requiere ADMIN.**

**Body:** `{ "name": "Queso extra", "price": 2000 }`

### PUT /api/additions/{id}
Actualiza nombre y precio. **Requiere ADMIN.**

### PATCH /api/additions/{id}/toggle-active
Activa o desactiva. **Requiere ADMIN.**

---

## Adiciones por producto

### GET /api/product-additions
Lista todas las relaciones producto-adición.

### POST /api/product-additions
Asocia una adición a un producto con precio personalizado opcional. **Requiere ADMIN.**

**Body:**
```json
{ "productId": 10, "additionId": 1, "customPrice": null }
```

### DELETE /api/product-additions/{id}
Elimina la relación. **Requiere ADMIN.**

---

## Zonas de domicilio

### GET /api/delivery-zones
Lista todas las zonas activas con su tarifa.

**Response `200`:**
```json
[
  { "id": 1, "name": "Zona Centro", "deliveryFee": 3000, "active": true },
  { "id": 2, "name": "Zona Norte", "deliveryFee": 5000, "active": true }
]
```

### GET /api/delivery-zones/{id}
Zona por ID.

### POST /api/delivery-zones
Crea una zona. **Requiere ADMIN.**

**Body:** `{ "name": "Zona Sur", "deliveryFee": 4000 }`

### PUT /api/delivery-zones/{id}
Actualiza nombre y tarifa. **Requiere ADMIN.**

### PATCH /api/delivery-zones/{id}/toggle-active
Activa o desactiva una zona. **Requiere ADMIN.**

---

## Especiales de temporada

### GET /api/seasonal-specials
Lista los especiales activos. **Público.**

**Response `200`:**
```json
[
  {
    "id": 1,
    "title": "Burger del mes",
    "description": "Descripción especial...",
    "imageUrl": "https://res.cloudinary.com/...",
    "active": true
  }
]
```

### GET /api/seasonal-specials/{id}
Especial por ID.

### POST /api/seasonal-specials
Crea un especial. **Requiere ADMIN.**

**Body:**
```json
{
  "title": "Burger del mes",
  "description": "...",
  "imageUrl": "https://res.cloudinary.com/..."
}
```

### PUT /api/seasonal-specials/{id}
Actualiza un especial. **Requiere ADMIN.**

### PATCH /api/seasonal-specials/{id}/toggle-active
Activa o desactiva. **Requiere ADMIN.**
