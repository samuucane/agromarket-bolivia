import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsPositive,
  Min,
  Max,
  IsDateString,
  IsArray,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ListingType,
  ProductType,
  DeliveryType,
  PaymentMethod,
  OrderStatus,
} from '@prisma/client';

// ─── Create Listing ───────────────────────────────────────────────────────────

export class CreateListingDto {
  @ApiProperty({ example: 'Soya convencional - Cosecha 2025', maxLength: 250 })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ListingType, example: 'SELL' })
  @IsEnum(ListingType)
  listingType: ListingType;

  @ApiProperty({ enum: ProductType, example: 'AGRICULTURAL_PRODUCT' })
  @IsEnum(ProductType)
  productType: ProductType;

  @ApiProperty({ example: '9b6c8e1a-...' })
  @IsString()
  categoryId: string;

  @ApiPropertyOptional({ example: 5000, description: 'Cantidad disponible' })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ example: 'qq', description: 'Unidad: kg, qq, ton, litro, unidad' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ example: 45.5, description: 'Precio por unidad en BOB' })
  @IsNumber()
  @IsPositive()
  pricePerUnit: number;

  @ApiPropertyOptional({ example: 100, description: 'Pedido mínimo' })
  @IsNumber()
  @IsOptional()
  minOrder?: number;

  @ApiPropertyOptional({ example: 5000, description: 'Pedido máximo' })
  @IsNumber()
  @IsOptional()
  maxOrder?: number;

  @ApiPropertyOptional({ example: 'Santa Cruz' })
  @IsString()
  @IsOptional()
  locationDept?: string;

  @ApiPropertyOptional({ example: 'Montero' })
  @IsString()
  @IsOptional()
  locationMuni?: string;

  @ApiPropertyOptional({ example: -17.9689 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: -63.1773 })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ example: '2025-06-15' })
  @IsDateString()
  @IsOptional()
  harvestDate?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isNegotiable?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isOrganic?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  hasCertification?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  certificationType?: string;
}

// ─── List Listings (Filters) ─────────────────────────────────────────────────

export class ListListingsDto {
  @ApiPropertyOptional({ enum: ProductType })
  @IsEnum(ProductType)
  @IsOptional()
  productType?: ProductType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isOrganic?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  hasCertification?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ default: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ default: 'desc' })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';

  // Geo filter
  @ApiPropertyOptional({ description: 'Latitud del centro para búsqueda por radio' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  lat?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  lng?: number;

  @ApiPropertyOptional({ description: 'Radio en kilómetros', default: 100 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  radiusKm?: number;
}

// ─── Create Order ─────────────────────────────────────────────────────────────

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  listingId: string;

  @ApiProperty({ example: 100, description: 'Cantidad a comprar' })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ enum: DeliveryType })
  @IsEnum(DeliveryType)
  @IsOptional()
  deliveryType?: DeliveryType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deliveryAddress?: string;

  @ApiPropertyOptional({ example: '2025-06-20' })
  @IsDateString()
  @IsOptional()
  deliveryDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ default: false, description: '¿Usar crédito de plataforma?' })
  @IsBoolean()
  @IsOptional()
  usePlatformCredit?: boolean;
}

// ─── Search ──────────────────────────────────────────────────────────────────

export class SearchDto {
  @ApiProperty({ example: 'soya santa cruz orgánica' })
  @IsString()
  q: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ enum: ProductType })
  @IsEnum(ProductType)
  @IsOptional()
  productType?: ProductType;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

// ─── Review ───────────────────────────────────────────────────────────────────

export class CreateReviewDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiProperty({ enum: ['BUYER_TO_SELLER', 'SELLER_TO_BUYER'] })
  @IsString()
  reviewType: string;
}
