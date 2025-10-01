export interface SubmenuItem {
  title: string;
  icon: string;
  route?: string;
}

export interface MenuItem {
  title: string;
  icon: string;
  route?: string;
  spacing?: boolean;
  submenu?: boolean;
  submenuItems?: SubmenuItem[];
  open?: boolean;
}
