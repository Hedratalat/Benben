import HeroSection from "../components/HeroSection/HeroSection";
import ProductsSection from "../store/Productssection";
import Feedback from "../components/Feedback/Feedback";

export default function Home() {
  return (
    <>
      <HeroSection />
      <ProductsSection
        title="Best sellers"
        subtitle="Our most loved pieces"
        filter={(p) => p.isBestSeller}
      />
      <ProductsSection
        title="New arrivals"
        subtitle="Fresh finds, just landed"
        filter={(p) => p.isNewArrival}
      />
      <Feedback />
    </>
  );
}
