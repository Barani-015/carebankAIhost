// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { ArrowRight } from "lucide-react";
// import Logo from "../components/Logo";
// import JarvisCore from "../components/JarvisCore";
// import { useAuth } from "../context/AuthContext";

// export default function SignIn() {
//   const { signIn } = useAuth();
//   const navigate = useNavigate();
//   const [form, setForm] = useState({ email: "", password: "" });
//   const [error, setError] = useState("");
//   const [mood, setMood] = useState("idle");

//  function handleSubmit(e) {
//   e.preventDefault();
//   setMood("thinking");
//   setError(null);

//   // fetch(`${process.env.REACT_APP_API_BASE_URL}/api/auth/login`, {
//   fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(form),
//   })
//     .then((res) => {
//       if (!res.ok) {
//         return res.json().then(data => {
//           throw new Error(data.error || 'Login failed');
//         });
//       }
//       return res.json();
//     })
//     .then((data) => {
//       console.log("Login successful:", data);
//       setMood("happy");
//       navigate("/app/dashboard");
      
//       // Store token if returned
//       if (data.token) {
//         localStorage.setItem('authToken', data.token);
//       }
      
//       setTimeout(() => navigate("/app/dashboard"), 500);
//     })
//     .catch((err) => {
//       console.error("Error during sign-in:", err);
//       setError(err.message || "An unexpected error occurred. Please try again.");
//       setMood("concerned");
//       setTimeout(() => setMood("idle"), 1400);
//     });
// }

//   return (
//     <div className="min-h-screen grid lg:grid-cols-2 bg-void-950">
//       <div className="hidden lg:flex flex-col items-center justify-center relative bg-hud-grid border-r border-void-700/60 overflow-hidden">
//         <div className="absolute top-8 left-8">
//           <Logo />
//         </div>
//         <JarvisCore mood={mood} size={380} />
//         <p className="absolute bottom-10 text-center text-bone/40 text-sm font-mono tracking-wide max-w-xs">
//           {error ? "AUTHENTICATION FAILED" : "AWAITING CREDENTIALS"}
//         </p>
//       </div>

//       <div className="flex items-center justify-center px-6 py-16">
//         <div className="w-full max-w-sm animate-fadeUp">
//           <div className="lg:hidden mb-10">
//             <Logo />
//           </div>
//           <p className="text-xs tracking-[0.25em] text-amber-500/80 font-mono uppercase mb-2">
//             Welcome back
//           </p>
//           <h1 className="font-display text-3xl text-bone mb-8">Sign in to CAREBANK</h1>

//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <label className="block text-xs text-bone/50 mb-1.5 font-mono uppercase tracking-wide">
//                 Email
//               </label>
//               <input
//                 type="email"
//                 required
//                 value={form.email}
//                 onChange={(e) => setForm({ ...form, email: e.target.value })}
//                 className="w-full bg-void-900 border border-void-600 rounded-md px-3.5 py-2.5 text-sm text-bone focus-ring placeholder:text-bone/30"
//                 placeholder="you@company.com"
//               />
//             </div>
//             <div>
//               <label className="block text-xs text-bone/50 mb-1.5 font-mono uppercase tracking-wide">
//                 Password
//               </label>
//               <input
//                 type="password"
//                 required
//                 value={form.password}
//                 onChange={(e) => setForm({ ...form, password: e.target.value })}
//                 className="w-full bg-void-900 border border-void-600 rounded-md px-3.5 py-2.5 text-sm text-bone focus-ring placeholder:text-bone/30"
//                 placeholder="••••••••"
//               />
//             </div>

//             {error && <p className="text-ember-500 text-xs">{error}</p>}

//             <button
//               type="submit"
//               className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-void-950 font-semibold text-sm py-2.5 rounded-md transition-colors shadow-glow"
//             >
//               Sign in <ArrowRight size={15} />
//             </button>
//           </form>

//           <p className="text-sm text-bone/40 mt-8">
//             No account yet?{" "}
//             <Link to="/signup" className="text-amber-400 hover:text-amber-300">
//               Create one
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }



import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Logo from "../components/Logo";
import JarvisCore from "../components/JarvisCore";
import { useAuth } from "../context/AuthContext";

export default function SignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [mood, setMood] = useState("idle");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMood("thinking");
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      console.log("Login successful:", data);

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }

      // ✅ Call signIn with the API response data
      const result = signIn(data);
      
      if (!result.ok) {
        throw new Error(result.error || "Authentication failed");
      }

      setMood("happy");
      
      // ✅ Navigate to dashboard
      navigate("/app/dashboard");

    } catch (err) {
      console.error("Error during sign-in:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
      setMood("concerned");
      setTimeout(() => setMood("idle"), 1400);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-void-950">
      <div className="hidden lg:flex flex-col items-center justify-center relative bg-hud-grid border-r border-void-700/60 overflow-hidden">
        <div className="absolute top-8 left-8">
          <Logo />
        </div>
        <JarvisCore mood={mood} size={380} />
        <p className="absolute bottom-10 text-center text-bone/40 text-sm font-mono tracking-wide max-w-xs">
          {error ? "AUTHENTICATION FAILED" : "AWAITING CREDENTIALS"}
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm animate-fadeUp">
          <div className="lg:hidden mb-10">
            <Logo />
          </div>
          <p className="text-xs tracking-[0.25em] text-amber-500/80 font-mono uppercase mb-2">
            Welcome back
          </p>
          <h1 className="font-display text-3xl text-bone mb-8">Sign in to CAREBANK</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-bone/50 mb-1.5 font-mono uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-void-900 border border-void-600 rounded-md px-3.5 py-2.5 text-sm text-bone focus-ring placeholder:text-bone/30"
                placeholder="you@company.com"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-xs text-bone/50 mb-1.5 font-mono uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-void-900 border border-void-600 rounded-md px-3.5 py-2.5 text-sm text-bone focus-ring placeholder:text-bone/30"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            {error && <p className="text-ember-500 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-void-950 font-semibold text-sm py-2.5 rounded-md transition-colors shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign in"} 
              <ArrowRight size={15} />
            </button>
          </form>

          <p className="text-sm text-bone/40 mt-8">
            No account yet?{" "}
            <Link to="/signup" className="text-amber-400 hover:text-amber-300">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}