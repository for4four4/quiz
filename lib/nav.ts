export const routes = {
  home: "/",
  tarify: "/tarify",
  primery: "/primery",
  novosti: "/novosti",
  otzyvy: "/otzyvy",
  dokumenty: "/dokumenty",
  editor: "/editor",
  cabinet: "/cabinet",
  admin: "/admin",
  vhod: "/vhod",
} as const;

export const navLinks = [
  { label: "Тарифы", href: routes.tarify },
  { label: "Примеры квизов", href: routes.primery },
  { label: "Новости", href: routes.novosti },
  { label: "Отзывы", href: routes.otzyvy },
];

export const footerPlatform = [
  { label: "Главная", href: routes.home },
  { label: "Тарифы", href: routes.tarify },
  { label: "Примеры квизов", href: routes.primery },
  { label: "Новости", href: routes.novosti },
  { label: "Отзывы", href: routes.otzyvy },
];

export const footerDocs = [
  { label: "Договор-оферта", href: `${routes.dokumenty}#oferta` },
  { label: "Политика конфиденциальности", href: `${routes.dokumenty}#policy` },
  { label: "Согласие на обработку данных", href: `${routes.dokumenty}#consent` },
];
