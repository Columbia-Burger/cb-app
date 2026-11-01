# Columbia Burger

Una sola aplicación: el backend (Spring Boot) expone la API en `/api/...` y además sirve el
frontend (Angular) para todas las demás rutas. Se despliega como **un solo servicio** en Railway.

```
cb-app/
├── backend/     Spring Boot 3.5 · Java 21
│   └── src/main/java/com/columbiaburger/
│       ├── business/   pedidos, clientes, usuarios, facturación, reportes (esquema "business")
│       └── catalog/    productos, categorías, sabores, adiciones, zonas (esquema "public")
├── frontend/    Angular 18 (sitio público, panel /admin, /cocina, /domicilio, /cuenta)
├── Dockerfile   compila Angular, lo copia a backend/src/main/resources/static y empaqueta el .jar
└── railway.json
```

Historia: este repo une `cb-api-business`, `cb-data-api` (ahora el paquete `catalog`) y
`cb-front-end`. Sus commits se importaron con `git subtree`, así que `git log -- backend/` o
`git log -- frontend/` muestran el historial completo.

## Desarrollo local

```bash
# Backend (necesita un Postgres con el esquema "business" creado)
cd backend && ./mvnw spring-boot:run

# Frontend (apunta a la API definida en src/environments/environment.ts)
cd frontend && npm install && npx ng serve
```

Imagen completa, igual a producción:

```bash
docker build -t cb-app .
docker run -p 8080:8080 --env-file .env cb-app   # http://localhost:8080
```

## Variables de entorno (Railway)

| Variable | Uso |
|---|---|
| `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `POSTGRES_PASSWORD` | Base de datos (referenciar el servicio Postgres) |
| `JWT_SECRET`, `JWT_EXPIRATION_MS` | Sesiones (7 días = `604800000`) |
| `ADMIN_*`, `KITCHEN_*`, `DELIVERY_*` (`_EMAIL`, `_PASSWORD`) | Solo para crear los usuarios iniciales si la tabla está vacía; el correo aún se acepta para iniciar sesión |
| `FACTUS_*` | Facturación electrónica |
| `WHATSAPP_*`, `INSTAGRAM_*`, `ANTHROPIC_API_KEY` | Integraciones |
| `N8N_OTP_WEBHOOK_URL` | Envío del código OTP del portal de clientes |
| `APP_SERVER_URL`, `JAVA_TOOL_OPTIONS` | URL pública y memoria de la JVM |

Ya no se usan `CATALOG_API_URL`, `CATALOG_API_KEY` ni `API_KEY`: el catálogo es parte de la app.
`CORS_ALLOWED_ORIGINS` solo hace falta si otro dominio llama a la API.
