import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Logo from "../components/Logo";
import JarvisCore from "../components/JarvisCore";
import { useEffect, useState } from "react";

const MOODS = ["idle", "listening", "thinking", "happy", "concerned", "speaking"];

export default function Landing() {
  const [mood, setMood] = useState("idle");

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % MOODS.length;
      setMood(MOODS[i]);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-void-950 bg-hud-grid text-bone">
      <header className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <Logo />
        <nav className="flex items-center gap-6 text-sm">
          <Link to="/signin" className="text-bone/60 hover:text-bone">
            Sign in
          </Link>
          <Link
            to="/signup"
            className="bg-amber-500 hover:bg-amber-400 text-void-950 font-semibold px-4 py-2 rounded-md text-sm"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-8 pt-10 pb-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs tracking-[0.25em] text-amber-500/80 font-mono uppercase mb-4">
            An AI console for your finances
          </p>
          <h1 className="font-display text-5xl leading-[1.05] mb-6">
            An always-on presence <span className="text-amber-400 text-glow">reading your numbers</span>
          </h1>
          <p className="text-bone/50 text-lg mb-8 max-w-md">
            Import your transaction history, and talk to it directly. VEGA answers in
            real time and visibly reacts — calm when things are steady, alert the
            moment something needs attention.
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="/signup"
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-void-950 font-semibold px-6 py-3 rounded-md shadow-glow"
            >
              Create free account <ArrowRight size={16} />
            </Link>
            <Link to="/signin" className="text-bone/60 hover:text-bone text-sm">
              I already have an account
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center relative">
          <JarvisCore mood={mood} size={380} />
          <p className="mt-2 text-[11px] font-mono tracking-[0.3em] text-amber-500/60 uppercase">
            {mood}
          </p>
        </div>
      </main>
    </div>
  );
}
