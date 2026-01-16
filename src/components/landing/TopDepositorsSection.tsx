import { Trophy, Clock, Banknote } from "lucide-react";

const rewards = [
  {
    icon: Trophy,
    title: "The Top 10 players with the highest total deposits during the campaign will receive a 25% deposit bonus on every deposit.",
    subtitle: "Awarded to the top 10 players by total deposits after the campaign.",
  },
  {
    icon: Clock,
    title: "The 25% deposit bonus is valid for 24 hours after the campaign ends.",
    subtitle: "Bonus duration: 24 hours after campaign end.",
  },
  {
    icon: Banknote,
    title: "This bonus is in addition to the cashback.",
    subtitle: "Players receive both the deposit bonus and cashback rewards.",
  },
];

const TopDepositorsSection = () => {
  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Extra Reward:{" "}
                <span className="text-muted-foreground">Top 10 Depositors</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Exclusive 25% deposit bonus for the highest depositors
              </p>
            </div>

            <div className="space-y-6">
              {rewards.map((reward, index) => (
                <div
                  key={index}
                  className="p-6 rounded-2xl bg-card border border-accent/10 glow-border glow-border-gold hover-lift cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <reward.icon className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold leading-relaxed">
                        {reward.title}
                      </p>
                      <p className="text-muted-foreground mt-2 text-sm">
                        {reward.subtitle}
                      </p>
                    </div>
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

export default TopDepositorsSection;
