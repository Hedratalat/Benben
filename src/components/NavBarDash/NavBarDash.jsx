import { FiLogOut } from "react-icons/fi";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../../firebase";

export default function NavBarDash({ onMenuClick }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout error:");
    }
  };

  return (
    <nav className="bg-surface-dark text-primary-foreground z-40 shadow-luxury border-b border-border-dark">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16 sm:h-20">
        {/* زر القائمة للموبايل */}
        <button
          onClick={onMenuClick}
          className="lg:hidden bg-primary-hover p-2 rounded-md hover:bg-gold/20 transition text-primary-foreground"
        >
          <Menu size={22} />
        </button>

        <h2 className="text-lg sm:text-2xl font-heading font-semibold text-primary-foreground">
          Welcome Admin
        </h2>

        <button
          onClick={handleLogout}
          aria-label="Logout"
          className="flex items-center gap-2
           bg-gold text-heading px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-lg
            hover:bg-gold-hover active:bg-gold-pressed transition"
        >
          Logout
          <FiLogOut className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </nav>
  );
}
