import { useEffect, useState } from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import TimelineSection from "@/components/landing/TimelineSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import CashbackSection from "@/components/landing/CashbackSection";
import TopDepositorsSection from "@/components/landing/TopDepositorsSection";
import RulesSection from "@/components/landing/RulesSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import RegistrationModal from "@/components/landing/RegistrationModal";

const Index = () => {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <TimelineSection />
      <HowItWorksSection />
      <CashbackSection />
      <TopDepositorsSection />
      <RulesSection />
      <CTASection />
      <Footer />
      <RegistrationModal />
      <div
        className="fixed pointer-events-none z-50"
        style={{ left: pos.x - 6, top: pos.y - 6 }}
      >
        <div className="w-3 h-3 rounded-full bg-accent shadow-lg" />
      </div>
    </div>
  );
};

export default Index;
