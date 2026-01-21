import { Sparkles } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
      
      <div className="container mx-auto px-6 py-32 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm text-muted-foreground mb-8">
              <Sparkles className="w-4 h-4 text-accent" />
              Super Bowl Special
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-none mb-8 animate-fade-up-delay-1">
            <div className="block whitespace-nowrap">
              Win <span className="shimmer-text">Mega Cashback</span>
            </div>
            <div className="block whitespace-nowrap">
              This Super Bowl
            </div>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 animate-fade-up-delay-2 max-w-2xl mx-auto">
            Bet more, earn bigger rewards.
            <br />
            Bet Your Team. Deposit More. Win Big Cashback!
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up-delay-3">
            <button
              className="px-8 py-4 btn-gold gold-glow font-semibold rounded-full"
              onClick={() => window.dispatchEvent(new Event("open-registration"))}
            >
              Start Betting
            </button>
            <button
              className="px-8 py-4 border border-accent/30 text-foreground font-semibold rounded-full hover:border-accent hover:text-accent transition-all hover:scale-105"
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
      
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
