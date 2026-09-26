import React from 'react';
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpDown,
  Info,
  Bot,
  Calendar,
  X,
  Check,
  CheckCheck,
  Layers,
  Package,
  PackageX,
  Trash2,
  Store,
  Bike,
  BadgeCheck,
  Key,
  AlertTriangle,
  AlertCircle,
  ShoppingCart,
  Coins,
  Banknote,
  Warehouse,
  TrendingUp,
  Eye,
  Send,
  SlidersHorizontal,
  Search,
  SearchX,
  Receipt,
  PlusCircle,
  PlusSquare,
  CheckCircle2,
  Save,
  Smartphone,
  MapPin,
  Boxes,
  Plus,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Download,
  ListChecks,
  LayoutGrid,
  List,
  Wallet,
  Truck,
  RotateCw,
  History,
  MoreVertical,
  Filter,
  Sparkles,
  Star,
  StarHalf,
  Heart,
  LucideProps,
  LucideIcon
} from 'lucide-react';

// Mapping from Material Symbol names or common aliases to Lucide React icons
const iconMap: Record<string, LucideIcon> = {
  // Navigation & Core
  inventory_2: Boxes,
  inventory: Package,
  boxes: Boxes,
  package: Package,
  receipt_long: Receipt,
  receipt: Receipt,
  account_balance_wallet: Wallet,
  wallet: Wallet,
  point_of_sale: Receipt,
  payments: Banknote,
  coins: Coins,

  // Ratings & Favorites
  star: Star,
  star_half: StarHalf,
  favorite: Heart,
  favorite_border: Heart,
  heart: Heart,

  // Actions & Controls
  add: Plus,
  plus: Plus,
  add_box: PlusSquare,
  add_circle: PlusCircle,
  close: X,
  x: X,
  check: Check,
  done_all: CheckCheck,
  check_circle: CheckCircle2,
  delete: Trash2,
  trash: Trash2,
  search: Search,
  search_off: SearchX,
  tune: SlidersHorizontal,
  filter: Filter,
  sort: ArrowUpDown,
  send: Send,
  send_to_mobile: Smartphone,
  download: Download,
  file_download: Download,
  sync_alt: ArrowLeftRight,
  sync_saved_locally: Save,
  save: Save,
  refresh: RotateCw,

  // Navigation Arrows & Chevrons
  arrow_forward: ArrowRight,
  arrow_right: ArrowRight,
  arrow_left: ArrowLeft,
  chevron_right: ChevronRight,
  chevron_left: ChevronLeft,
  expand_more: ChevronDown,
  chevron_down: ChevronDown,
  chevron_up: ChevronUp,

  // Views & Display
  grid_view: LayoutGrid,
  layout_grid: LayoutGrid,
  view_list: List,
  list: List,
  checklist: ListChecks,
  layers: Layers,
  visibility: Eye,
  eye: Eye,

  // Logistics & Status
  warehouse: Warehouse,
  storefront: Store,
  store: Store,
  moped: Bike,
  bike: Bike,
  truck: Truck,
  local_shipping: Truck,
  location_on: MapPin,
  map_pin: MapPin,
  production_quantity_limits: PackageX,
  package_x: PackageX,
  trending_up: TrendingUp,
  warning: AlertTriangle,
  alert_circle: AlertCircle,
  verified: BadgeCheck,
  key: Key,
  info: Info,
  history: History,
  more_vert: MoreVertical,

  // Agent & Smart features
  smart_toy: Bot,
  bot: Bot,
  sparkles: Sparkles,

  // Commerce
  shopping_bag: ShoppingBag,
  shopping_cart_checkout: ShoppingCart,
  shopping_cart: ShoppingCart,
  edit_calendar: Calendar,
  calendar: Calendar
};

export type IconName = keyof typeof iconMap | string;

export interface IconProps extends LucideProps {
  name: IconName;
  size?: number | string;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 18,
  className = '',
  strokeWidth = 2,
  ...props
}) => {
  const normalizedKey = name.trim().toLowerCase();
  const Component = iconMap[normalizedKey] || Package;

  return (
    <Component
      size={size}
      className={className}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      {...props}
    />
  );
};

export default Icon;
