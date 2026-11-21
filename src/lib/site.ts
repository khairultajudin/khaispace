export type NavItem = { label: string; href: string };

export const siteConfig = {
  name: "Khai Space",
  url: "https://khaispace.com",
  brandHeadline: "Ideas into Digital Solutions.",
  positioning: "Interactive Digital Studio",
  tagline: "AI & Automation · Web Applications · IoT & Engineering",
  description:
    "Khai Space is an interactive digital studio turning ideas into practical web applications, AI workflows, IoT prototypes, and custom digital solutions.",
  contactEmail: "hello@khaispace.com",
  contactPhone: "+60 18-760 4289",
  whatsappNumber: "+60 18-760 4289",
  whatsappE164: "60187604289",
  whatsappUrl: "https://wa.me/message/5T5FYRRLKN57O1",
  whatsappQrImage: "/images/whatsapp-qr-clean.png",
  location: "Malaysia",
} as const;

export const mainNav: readonly NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Projects", href: "/projects" },
  { label: "Lab", href: "/lab" },
  { label: "About", href: "/about" },
];

export const ctaNav: NavItem = {
  label: "Start a Project",
  href: "/start-a-project",
};
