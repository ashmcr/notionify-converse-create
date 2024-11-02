import { Link, useLocation } from "react-router-dom";

export function MainNav() {
  const location = useLocation();
  
  const links = [
    { href: "/templates", label: "Templates" },
    { href: "/history", label: "History" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {links.map((link) => (
        <Link
          key={link.href}
          to={link.href}
          className={`text-sm font-medium transition-colors hover:text-primary ${
            location.pathname === link.href
              ? "text-primary"
              : "text-notion-600"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}