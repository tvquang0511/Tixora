export const siteName = "Tixora";

export const siteNavigation = [
  { label: "Explore", href: "/" },
  { label: "My Tickets", href: "/my-tickets" },
  { label: "Profile", href: "/profile" },
  { label: "Support", href: "/support" },
] as const;

export const routeLabels = {
  home: "/",
  concert: "/concerts/sonic-pulse",
  seats: "/concerts/sonic-pulse/seats",
  checkout: "/checkout/order-2048",
  processing: "/checkout/order-2048/processing",
  confirmed: "/orders/order-2048/confirmed",
  tickets: "/my-tickets",
  profile: "/profile",
  support: "/support",
} as const;
