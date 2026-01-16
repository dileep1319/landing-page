import { LayoutGrid, Gift, Award } from "lucide-react";

const features = [
  {
    icon: LayoutGrid,
    title: "Cashback Percentage",
    value: "10%",
  },
  {
    icon: Gift,
    title: "Eligible Deposits",
    description: "Only deposits made during the campaign period",
  },
  {
    icon: Award,
    title: "Cashback Credited",
    description: "After February 9th, 9:00 PM EST",
  },
];

const CashbackSection = () => {
  return (
    <section id="rewards" className="py-32 relative bg-grid-pattern">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Get <span className="shimmer-text">10% Cashback</span> on
                <br />
                Eligible Deposits
              </h2>
              <p className="text-lg text-muted-foreground">
                Credited after February 9th, 9:00 PM EST
              </p>
            </div>

            <div className="space-y-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-6 group cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                    <feature.icon className="w-7 h-7 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">
                      {feature.title}
                      {feature.value && (
                        <span className="text-muted-foreground">: {feature.value}</span>
                      )}
                    </p>
                    {feature.description && (
                      <p className="text-muted-foreground">{feature.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CashbackSection;
