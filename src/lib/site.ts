export type NavItem = { label: string; href: string };

export const siteConfig = {
  name: "Khai Space",
  url: "https://khaispace.com",
  tagline: "Technology · Engineering · Digital Solutions",
  positioning: "Independent Technology & Innovation Studio",
  description:
    "Khai Space is an independent technology studio exploring and building solutions across software, engineering, and digital innovation.",
  contactEmail: "hello@khaispace.com",
  contactPhone: "+60 18-760 4289",
  whatsappNumber: "+60 18-760 4289",
  whatsappUrl: "https://wa.me/message/5T5FYRRLKN57O1",
  whatsappQrImage: "/images/whatsapp-qr-clean.png",
} as const;

export const mainNav: readonly NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
];

export const ctaNav: NavItem = { label: "Let's Talk", href: "/contact" };
