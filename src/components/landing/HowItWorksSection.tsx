import { useScrollAnimation } from "@/hooks/use-scroll-animation";

const steps = [
  {
    number: 1,
    title: "Place Your Bet",
    description:
      "Before the campaign starts, players must place a bet on one of the two Super Bowl teams.",
  },
  {
    number: 2,
    title: "Deposit During Campaign",
    description:
      "During the campaign period (February 8th, 9:00 PM EST – February 9th, 9:00 PM EST), players can make unlimited deposits and higher deposits yield higher rewards.",
  },
  {
    number: 3,
    title: "Receive Cashback if You Win",
    description:
      "After the match ends, if your selected team wins, you will receive 10% cashback on your total deposits made during the campaign period.",
  },
];

const HowItWorksSection = () => {
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation();

  return (
    <section id="how-it-works" className="py-32 relative" ref={sectionRef}>
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className={`text-center mb-20 scroll-animate-fade-up ${sectionVisible ? 'is-visible' : ''}`}>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              How the <span className="text-muted-foreground">Campaign</span> Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Simple steps to bet, deposit, and earn cashback
            </p>
          </div>

          {/* Mobile Step Details with integrated numbers */}
          <div className="md:hidden space-y-8 mb-16">
            {steps.map((step, index) => (
              <div 
                key={step.number} 
                className={`flex gap-4 items-start scroll-animate-fade-up-delay-${index + 1} ${sectionVisible ? 'is-visible' : ''}`}
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center border border-accent/40">
                    <span className="text-lg font-bold text-accent">
                      {step.number}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-accent transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Chevron Steps */}
          <div className={`hidden md:flex md:flex-row gap-0 mb-16 scroll-animate-fade-up-delay-1 ${sectionVisible ? 'is-visible' : ''}`}>
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`flex-1 h-24 bg-gradient-to-r from-accent/20 to-accent/10 flex items-center justify-center ${
                  index === 0
                    ? "chevron-step-first"
                    : index === steps.length - 1
                    ? "chevron-step-last"
                    : "chevron-step"
                } ${index > 0 ? "md:-ml-5" : ""}`}
              >
                <span className="text-5xl font-bold text-accent">{step.number}</span>
              </div>
            ))}
          </div>

          {/* Desktop Step Details */}
          <div className="hidden md:grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div 
                key={step.number} 
                className={`group scroll-animate-fade-up-delay-${index + 2} ${sectionVisible ? 'is-visible' : ''}`}
              >
                <h3 className="text-xl font-bold mb-3 group-hover:text-accent transition-colors">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
