import Navbar from "@/components/Landing/Navbar";
import Hero from "@/components/Landing/Hero";
import MetricsBar from "@/components/Landing/MetricsBar";
import ProblemSolution from "@/components/Landing/ProblemSolution";
import WhyOpus from "@/components/Landing/WhyOpus";
import Comparison from "@/components/Landing/Comparison";
import Features from "@/components/Landing/Features";
import HowItWorks from "@/components/Landing/HowItWorks";
import Pricing from "@/components/Landing/Pricing";
import Testimonials from "@/components/Landing/Testimonials";
import FAQ from "@/components/Landing/FAQ";
import CTAFinal from "@/components/Landing/CTAFinal";
import Footer from "@/components/Landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0f1923]">
      <Navbar />
      <Hero />
      <MetricsBar />
      <ProblemSolution />
      <WhyOpus />
      <Comparison />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTAFinal />
      <Footer />
    </main>
  );
}
