import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  UploadCloud,
  Sparkles,
  CreditCard,
  LogOut,
  Lamp,
  PieChart,
} from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/app/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/app/import", label: "Import data", icon: UploadCloud },
  { to: "/app/smart-budgetting", label: "Smart Budgetting", icon: PieChart },
  // { to: "/app/chat/ai-wellness", label: "AI Assistant", icon: Sparkles },
  { to: "/app/chat", label: "AI Wellness", icon: Sparkles },
  { to: "/app/subscription", label: "Plan", icon: CreditCard },
  {to : "/app/summary", label: "Financial Summary", icon: Lamp}
];

export default function AppShell({ children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-void-950 bg-hud-grid">
      <aside className="w-60 shrink-0 border-r border-void-700/70 flex flex-col justify-between py-6 px-4">
        <div>
          <Logo className="px-2 mb-8" />
          <nav className="flex flex-col gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      : "text-bone/60 hover:text-bone hover:bg-void-800 border border-transparent"
                  }`
                }
              >
                <Icon size={16} strokeWidth={1.75} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="px-2">
          <div className="flex items-center gap-2.5 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-void-700 flex items-center justify-center text-xs font-mono text-amber-400 border border-void-600">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-bone truncate">{user?.name || "Operator"}</p>
              <p className="text-[11px] text-bone/40 truncate font-mono">
                {(user?.plan || "starter").toUpperCase()} TIER
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              signOut();
              navigate("/signin");
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-bone/50 hover:text-ember-500 hover:bg-void-800 rounded-md transition-colors"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
