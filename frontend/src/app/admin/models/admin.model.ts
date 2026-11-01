export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  displayName: string;
  role: string;
}

export type StaffRole = 'ADMIN' | 'KITCHEN' | 'DELIVERY';

export interface StaffUser {
  id: number;
  username: string;
  displayName: string;
  role: StaffRole;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

/** Al editar solo se envían los campos que cambian; password vacío = no cambiarla. */
export interface StaffUserRequest {
  username?: string;
  displayName?: string;
  role?: StaffRole;
  password?: string;
  active?: boolean;
}

export type OrderStatus = 'RECEIVED' | 'PREPARING' | 'ON_THE_WAY' | 'DELIVERED' | 'CANCELLED';
export type InvoiceStatus = 'PENDING' | 'INVOICED' | 'VOID';
export type PostStatus = 'DRAFT' | 'APPROVED' | 'PUBLISHED' | 'FAILED';

export interface SocialPost {
  id: number;
  caption: string;
  hashtags: string;
  imageUrl: string | null;
  topic: string;
  status: PostStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  instagramPostId: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface GeneratePostRequest {
  topic: string;
  imageUrl?: string;
  tone?: string;
}

export interface UpdatePostRequest {
  caption?: string;
  hashtags?: string;
  imageUrl?: string;
  scheduledAt?: string;
  status?: PostStatus;
}

export interface OrderItemResponse {
  id: number;
  productId: number;
  productName: string;
  flavor: string;
  additions: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  note: string;
}

export interface OrderResponse {
  id: number;
  customerId: number;
  customerName: string;
  customerWhatsapp: string;
  status: OrderStatus;
  source: OrderSource;
  total: number;
  deliveryFee: number;
  deliveryZone: string;
  notes: string;
  customerLatitude: number | null;
  customerLongitude: number | null;
  createdAt: string;
  items: OrderItemResponse[];
  invoiceStatus: InvoiceStatus;
  invoiceNumber: string | null;
  invoicedAt: string | null;
  couponCode: string | null;
  discount: number | null;
  electronicInvoiceNumber: string | null;
  cufe: string | null;
  electronicPaymentMethodCode: '10' | '47' | '48' | null;
}

export interface UpdateOrderRequest {
  items?: OrderItemRequest[];
  deliveryFee?: number;
  deliveryZone?: string;
  notes?: string;
  discountPercentage?: number;
  discountFixed?: number;
  couponCode?: string;
}

export interface CustomerResponse {
  id: number;
  name: string;
  whatsapp: string;
  neighborhood: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

export interface DashboardStats {
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  revenueToday: number;
  revenueThisMonth: number;
  pendingOrders: number;
  onTheWayOrders: number;
  totalCustomers: number;
  averageRating: number | null;
  ratedOrdersCount: number;
}

export interface TopProduct {
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export type OrderSource = 'WEB' | 'WHATSAPP' | 'WAITER' | 'DELIVERY';

export interface OrderItemRequest {
  productId: number;
  productName: string;
  flavor?: string;
  additions?: string;
  quantity: number;
  unitPrice: number;
  note?: string;
}

export interface CreateOrderRequest {
  customerName: string;
  customerWhatsapp: string;
  customerNeighborhood?: string;
  customerAddress?: string;
  items: OrderItemRequest[];
  deliveryFee?: number;
  deliveryZone?: string;
  notes?: string;
  printAtAdmin?: boolean;
  source: OrderSource;
}

export interface FlavorItem {
  id: number;
  name: string;
}

export interface AdditionItem {
  id: number;
  name: string;
  description?: string;
  basePrice: number;
  active?: boolean;
}

export interface ProductAdditionItem {
  id: number;
  additionId: number;
  name: string;
  effectivePrice: number;
}

export interface CatalogProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  available: boolean;
  categoryId: number;
  categoryName: string;
  flavors?: FlavorItem[];
  additions?: ProductAdditionItem[];
  comboDescription?: string;
  comboPrice?: number;
}

export interface DailyStatResponse {
  date: string;
  orders: number;
  revenue: number;
}

export interface SourceStatResponse {
  source: string;
  orders: number;
}

export interface ElectronicInvoiceRequest {
  customerDocumentType?: 'CC' | 'NIT';
  paymentMethodCode?: '10' | '47' | '48';
  customerIdentification?: string;
  customerName?: string;
  customerEmail?: string;
}

export interface ElectronicInvoiceResponse {
  number: string;
  cufe: string;
  qr: string;
  pdfUrl: string;
}

export interface ElectronicInvoiceDetailResponse {
  number: string;
  referenceCode: string;
  cufe: string;
  documentName: string;
  operationTypeName: string;
  validated: boolean;
  validatedAt: string;
  createdAt: string;
  observation: string;
  sendEmail: boolean;
  qrUrl: string;
  publicUrl: string;
  payment: {
    formCode: string;
    formName: string;
    methodCode: string;
    methodName: string;
  };
  customer: {
    documentCode: string;
    documentName: string;
    identification: string;
    dv: string;
    company: string;
    names: string;
    email: string;
    phone: string;
    address: string;
    legalOrganizationCode: string;
    legalOrganizationName: string;
    tributeCode: string;
    tributeName: string;
    municipality: string;
    department: string;
  };
  totals: {
    grossValue: string;
    taxableAmount: string;
    taxAmount: string;
    discountAmount: string;
    total: string;
  };
  items: Array<{
    codeReference: string;
    name: string;
    quantity: string;
    price: string;
    total: string;
    discountRate: string;
    taxSummary: string;
  }>;
  errors: Record<string, string>;
}

export interface HourlyStatResponse {
  hour: number;
  orders: number;
  revenue: number;
}

export interface ShiftResponse {
  id: number;
  openedAt: string;
  closedAt: string | null;
  active: boolean;
  initialCash: number | null;
  finalCash: number | null;
  totalOrders: number | null;
  totalRevenue: number | null;
  expectedCash: number | null;
  difference: number | null;
}

export interface CatalogCategory {
  id: number;
  name: string;
  products: CatalogProduct[];
}

export interface CategoryItem {
  id: number;
  name: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: number;
}

export interface CreateAdditionRequest {
  name: string;
  description?: string;
  basePrice: number;
}

export interface DeliveryZone {
  id: number;
  name: string;
  deliveryFee: number;
  active: boolean;
}

export interface CreateDeliveryZoneRequest {
  name: string;
  deliveryFee: number;
}

export interface TrackingItem {
  productName: string;
  flavor: string;
  quantity: number;
}

export interface OrderTrackingResponse {
  id: number;
  customerFirstName: string;
  status: OrderStatus;
  total: number;
  deliveryFee: number;
  deliveryZone: string;
  createdAt: string;
  items: TrackingItem[];
}

// ── Reportes por rango ──────────────────────────────────────────
export interface ReportGroupRow { key: string; orders: number; revenue: number; }
export interface ReportDayRow { date: string; orders: number; revenue: number; }
export interface ReportHourRow { hour: number; orders: number; revenue: number; }
export interface ReportProductRow { name: string; quantity: number; revenue: number; }
export interface ReportCouponRow { code: string; uses: number; discount: number; }
export interface ReportShiftRow {
  id: number;
  openedAt: string | null;
  closedAt: string | null;
  active: boolean;
  orders: number;
  revenue: number;
  initialCash: number | null;
  finalCash: number | null;
  expectedCash: number | null;
  difference: number | null;
}

export interface ReportResponse {
  from: string;
  to: string;
  summary: {
    orders: number;
    revenue: number;
    averageTicket: number;
    discounts: number;
    deliveryFees: number;
    itemsSold: number;
    ordersWithDiscount: number;
    cancelledOrders: number;
    cancelledAmount: number;
    electronicInvoices: number;
    electronicInvoicedAmount: number;
    averageRating: number | null;
    ratedOrders: number;
    bestDay: string | null;
    bestDayRevenue: number | null;
  };
  previous: { from: string; to: string; orders: number; revenue: number; averageTicket: number; };
  daily: ReportDayRow[];
  bySource: ReportGroupRow[];
  byStatus: ReportGroupRow[];
  byHour: ReportHourRow[];
  byWeekday: ReportGroupRow[];
  topProducts: ReportProductRow[];
  electronicByPaymentMethod: ReportGroupRow[];
  coupons: ReportCouponRow[];
  shifts: ReportShiftRow[];
}
