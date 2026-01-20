import { useState, useEffect } from "react";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="text-lg font-bold tracking-tight">
          BIG MONEY GAMING
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#how-it-works"
            className="text-sm text-accent/80 hover:text-accent border-b-2 border-transparent hover:border-accent pb-1 transition-colors"
          >
            How It Works
          </a>
          <a
            href="#rewards"
            className="text-sm text-accent/80 hover:text-accent border-b-2 border-transparent hover:border-accent pb-1 transition-colors"
          >
            Rewards
          </a>
          <a
            href="#rules"
            className="text-sm text-accent/80 hover:text-accent border-b-2 border-transparent hover:border-accent pb-1 transition-colors"
          >
            Rules
          </a>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 text-sm font-semibold rounded-full border border-accent text-accent hover:bg-accent hover:text-background transition-colors"
            onClick={() => window.dispatchEvent(new Event("open-signin"))}
          >
            Sign In
          </button>
          <button
            className="px-5 py-2 btn-gold text-sm font-semibold rounded-full"
            onClick={() => window.dispatchEvent(new Event("open-signup"))}
          >
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
