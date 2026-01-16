import { Sparkles, Calendar } from "lucide-react";

const TimelineSection = () => {
  return (
    <section className="py-32 relative bg-grid-pattern">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-2 text-gold mb-4">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium tracking-wide uppercase">Timeline</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Campaign{" "}
                <span className="text-muted-foreground">Timing</span>
                <br />
                and Window
              </h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-lg text-muted-foreground">Key start and end schedule</p>
                  <p className="text-xl font-semibold mt-1">
                    Start: February 8th – 9:00 PM EST
                  </p>
                  <p className="text-xl font-semibold">
                    End: February 9th – 9:00 PM EST
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TimelineSection;
