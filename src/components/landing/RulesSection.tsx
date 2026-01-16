import { useScrollAnimation } from "@/hooks/use-scroll-animation";

const rules = [
  {
    number: 1,
    title: "The team you want to bet on must be selected before the campaign starts.",
  },
  {
    number: 2,
    title: "Cashback is awarded only to players who bet on the winning team.",
  },
  {
    number: 3,
    title: "Cashback is calculated only on deposits made during the campaign period.",
  },
  {
    number: 4,
    title: "Top 10 depositors are ranked based on total deposited amount.",
  },
];

const RulesSection = () => {
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation();

  return (
    <section id="rules" className="py-32 relative bg-grid-pattern" ref={sectionRef}>
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-16 items-start">
            <div className={`scroll-animate-fade-up ${sectionVisible ? 'is-visible' : ''}`}>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Key <span className="text-muted-foreground">Campaign</span> Rules
              </h2>
              <p className="text-lg text-muted-foreground">
                Essential conditions for cashback and ranking
              </p>
            </div>

            <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
              {rules.map((rule, index) => (
                <div
                  key={rule.number}
                  className={`p-6 rounded-2xl bg-card border border-border glow-border cursor-pointer group hover:border-accent/40 transition-all duration-300 scroll-animate-scale scroll-animate-scale-delay-${index + 1} ${sectionVisible ? 'is-visible' : ''}`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-accent/20 text-accent text-sm font-semibold">
                      {rule.number}
                    </span>
                  </div>
                  <p className="font-medium leading-relaxed">
                    {rule.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RulesSection;
