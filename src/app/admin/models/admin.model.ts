export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  email: string;
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
}

export interface UpdateOrderRequest {
  items?: OrderItemRequest[];
  deliveryFee?: number;
  deliveryZone?: string;
  notes?: string;
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
}

export interface TopProduct {
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export type OrderSource = 'WEB' | 'WHATSAPP' | 'WAITER';

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
