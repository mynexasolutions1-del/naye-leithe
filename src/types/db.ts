// TypeScript interfaces mirroring the existing SQLAlchemy models / Supabase tables

export interface User {
  id: number;
  email: string;
  password_hash?: string;
  is_admin: boolean;
  join_date: string;
  username?: string;
  phone?: string;
  address?: string;
  city?: string;
  zipcode?: string;
  auth_uid?: string;
}

export interface Address {
  id: number;
  user_id: number;
  label?: string;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state?: string;
  pincode: string;
  country: string;
  is_default: boolean;
}

export interface Category {
  id: number;
  name: string;
  img?: string;
  bg?: string;
  count?: string;
  subcategories?: SubCategory[];
}

export interface SubCategory {
  id: number;
  name: string;
  category_id: number;
  img?: string;
  category?: Category;
}

export interface Brand {
  id: number;
  name: string;
  logo?: string;
}

export interface Attribute {
  id: number;
  name: string;
  slug?: string;
  type: string;
  image_url?: string;
  is_featured: boolean;
  values?: AttributeValue[];
}

export interface AttributeValue {
  id: number;
  attribute_id: number;
  value: string;
  image_url?: string;
  attribute?: Attribute;
}

export interface VariationOption {
  id: number;
  variation_id: number;
  attribute_value_id: number;
  attribute_value?: AttributeValue;
}

export interface ProductVariation {
  id: number;
  product_id: string;
  price?: string;
  img_url?: string;
  stock_status: string;
  options?: VariationOption[];
  product?: Product;
}

export interface ProductAttribute {
  id: number;
  product_id: string;
  attribute_id: number;
  attribute?: Attribute;
}

export interface ProductImage {
  id: number;
  product_id: string;
  attribute_value_id?: number;
  img_url: string;
  attribute_value?: AttributeValue;
}

export interface Product {
  id: string; // String primary key (slug-like)
  name: string;
  cat_name?: string;
  category_id?: number;
  sub_category_id?: number;
  brand_id?: number;
  price: string;
  orig?: string;
  badge?: string;
  img: string;
  desc?: string;
  short_desc?: string;
  sizes?: string;
  colors?: string;
  size_chart?: string;
  product_type: "simple" | "variable";
  stock_status: string;
  is_featured: boolean;
  is_new_arrival: boolean;
  category?: Category;
  subcategory?: SubCategory;
  brand?: Brand;
  images?: ProductImage[];
  attributes?: ProductAttribute[];
  variations?: ProductVariation[];
  reviews?: Review[];
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  date?: string;
  total_amount: string;
  status: string;
  payment_method: string;
  payment_status: string;
  shipping_address?: string;
  amount_paid: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  cancel_reason?: string;
  user?: User;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: string;
  quantity: number;
  price_at_time: string;
  variation_id?: number;
  variation_details?: string;
  product?: Product;
}

export interface Review {
  id: number;
  product_id?: string;
  user_id?: number;
  customer_name?: string;
  customer_location?: string;
  rating: number;
  comment?: string;
  date: string;
  status: string;
  is_featured: boolean;
  product?: Product;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  status: string;
  date: string;
}

export interface Coupon {
  id: number;
  code: string;
  type: "flat" | "percentage";
  discount: number;
  threshold: number;
  usage_limit: number;
  expiry_date?: string;
  is_active: boolean;
}

export interface AppConfig {
  id: number;
  key: string;
  value: string;
}

// Cart types
export type CartCookie = Record<string, number>; // { "var:42": 2, "prod-id": 1 }
export type WishlistCookie = string[]; // product IDs

export interface CartItem {
  id: string; // cart key
  product: Product;
  variation?: ProductVariation;
  quantity: number;
  display_price: string;
  item_total: string;
  var_img?: string;
  size?: string;
  color?: string;
  options?: { name: string; value: string }[];
}
