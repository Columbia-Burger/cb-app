# Columbia Burger — Sitio Web

Sitio web oficial de **Columbia Burger**, una hamburguesería colombiana. Construido con Angular 18 y Bootstrap 5.

## Stack

- **Angular 18** — framework principal
- **Bootstrap 5** — estilos y layout responsivo
- **EmailJS** — envío de formulario de contacto sin backend
- **Cloudinary** — hosting de imágenes del menú
- **Vercel** — deploy en producción

## Estructura del proyecto

```
src/app/
├── pages/
│   ├── landing-page/     # Página principal
│   └── menu/             # Página del menú completo
├── components/
│   ├── header/           # Navbar
│   ├── hero-carousel/    # Carrusel principal
│   ├── special/          # Sección de especiales
│   ├── map-info/         # Ubicación y horarios
│   ├── contact-form/     # Formulario de contacto (EmailJS)
│   ├── cart/             # Carrito de pedidos
│   ├── favorites/        # Favoritos
│   ├── whatsapp-button/  # Botón flotante de WhatsApp
│   └── footer/           # Pie de página
├── data/
│   └── menu.data.ts      # Datos del menú (categorías y productos)
├── models/               # Interfaces TypeScript
└── services/             # Lógica de negocio compartida
```

## Requisitos previos

- **Node.js** v18 o superior — [descargar](https://nodejs.org)
- **npm** v9 o superior (viene incluido con Node)
- **Angular CLI** v18

```bash
npm install -g @angular/cli@18
```

## Instalación

```bash
# 1. Entrar al directorio del proyecto Angular
cd columbia-burger-angular

# 2. Instalar dependencias
npm install
```

## Correr en local

```bash
npm start
```

La app queda disponible en `http://localhost:4200`. El servidor recarga automáticamente al guardar cambios.

## Build para producción

```bash
npm run build
```

El output queda en `dist/columbia-burger/`.

## Agregar o editar productos del menú

Todos los productos y categorías están en [src/app/data/menu.data.ts](src/app/data/menu.data.ts).

Cada item tiene esta forma:

```ts
{
  name: 'Nombre del producto',
  description: 'Descripción corta',
  price: '$20.000',       // string para mostrar
  priceValue: 20000,      // número para calcular totales
  image: 'https://res.cloudinary.com/...',  // URL de Cloudinary
}
```

Para agregar imágenes, súbelas a [Cloudinary](https://cloudinary.com) y reemplaza el campo `image` con la URL generada.

## Deploy

El proyecto está configurado para Vercel (`vercel.json` en la raíz). Cada push a la rama principal despliega automáticamente.
