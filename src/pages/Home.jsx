import HeroSection from "../components/HeroSection/HeroSection";
import ProductsSection from "../store/Productssection";
import Feedback from "../components/Feedback/Feedback";
import Categories from "../components/Categories/Categories";

export default function Home() {
  return (
    <>
      <HeroSection />
      <Categories />
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
