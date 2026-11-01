export const environment = {
  production: true,
  // Mismo dominio: el backend sirve la app y la API (rutas relativas /api/...)
  apiUrl: '',
  businessApiUrl: '',
  // Portal de clientes (/cuenta): apagado mientras no haya canal para enviar el código OTP
  customerPortalEnabled: false,
  whatsappNumber: '573228262989',
  whatsappText: 'Hola,%20quiero%20hacer%20un%20pedido',
  emailjs: {
    publicKey: 'LcNpqkRRu5LV4IhQ2',
    serviceId: 'default_service',
    templateId: 'template_igzmrne',
  },
};
