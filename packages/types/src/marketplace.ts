export type ListingType   = 'SELL' | 'BUY_REQUEST' | 'RENT';
export type ProductType   = 'AGRICULTURAL_PRODUCT' | 'SUPPLY' | 'MACHINERY';
export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'SOLD' | 'EXPIRED' | 'REMOVED';
export type OrderStatus   =
  | 'PENDING' | 'CONFIRMED' | 'IN_NEGOTIATION' | 'PAYMENT_PENDING'
  | 'PAID' | 'IN_DELIVERY' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED' | 'REFUNDED';

export interface Listing {
  id: string;
  sellerId: string;
  categoryId: string;
  title: string;
  description?: string;
  listingType: ListingType;
  productType: ProductType;
  quantity?: number;
  unit?: string;
  pricePerUnit: number;
  currency: string;
  locationDept?: string;
  locationMuni?: string;
  isOrganic: boolean;
  hasCertification: boolean;
  status: ListingStatus;
  viewsCount: number;
  createdAt: string;
  images?: { url: string; isPrimary: boolean }[];
}

export interface Order {
  id: string;
  orderNumber: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  platformFee: number;
  total: number;
  currency: string;
  status: OrderStatus;
  createdAt: string;
}

export interface PriceReference {
  id: string;
  productName: string;
  department?: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  unit?: string;
  recordedAt: string;
  category?: { name: string };
}
