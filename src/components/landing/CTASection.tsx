import { useScrollAnimation } from "@/hooks/use-scroll-animation";

const CTASection = () => {
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation();

  return (
    <section className="py-32 relative" ref={sectionRef}>
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center gap-6">
            <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight scroll-animate-fade-up ${sectionVisible ? 'is-visible' : ''}`}>
              Ready to <span className="shimmer-text">Win?</span>
            </h2>
            <p className={`text-xl text-muted-foreground max-w-2xl leading-relaxed scroll-animate-fade-up-delay-1 ${sectionVisible ? 'is-visible' : ''}`}>
              Choose your team and start depositing.
              <br />
              Make this Super Bowl even more rewarding — place your bets and enjoy the game.
            </p>
            <button
              className={`px-8 py-4 btn-gold gold-glow font-semibold rounded-full pulse-glow scroll-animate-fade-up-delay-2 ${sectionVisible ? 'is-visible' : ''}`}
              onClick={() => window.dispatchEvent(new Event("open-registration"))}
            >
              Start Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
