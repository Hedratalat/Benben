import { NavLink } from "react-router-dom";
import { X } from "lucide-react";

export default function SideBarDash({ isOpen, setIsOpen }) {
  const navItems = [
    { to: "heroDashboard", label: "Hero Dashboard" },
    { to: "productsManagement", label: "Manage Products" },
    { to: "orders", label: "Orders" },
    { to: "feedback", label: "Feedback" },
    { to: "message", label: "Message" },
  ];

  return (
    <>
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 min-h-screen bg-surface-dark text-primary-foreground shadow-luxury w-64 p-6 
        flex flex-col overflow-y-auto transition-transform duration-300 z-50 border-r border-border-dark
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0`}
      >
        {/* زر الإغلاق */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-4 right-4 text-primary-foreground hover:text-gold transition"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-heading font-bold border-b border-border-dark mb-8 pb-4 text-center text-primary-foreground">
          Dashboard
        </h2>

        <nav className="flex-1">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `block text-lg font-medium rounded-xl px-4 py-2 cursor-pointer transition-all duration-200
                    ${
                      isActive
                        ? "bg-gold text-heading shadow-md"
                        : "text-primary-foreground hover:bg-primary-hover hover:text-gold"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
