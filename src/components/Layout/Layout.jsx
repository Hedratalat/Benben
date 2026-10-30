import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import PageLoader from "../PageLoader/PageLoader";
import Footer from "../Footer/Footer";
import SocialRail from "../SocialRail/SocialRail";

export default function Layout() {
  const { pathname } = useLocation();
  const isDashboard = pathname.startsWith("/dashboard");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      {!isDashboard && (
        <>
          <Navbar />
          <SocialRail />
        </>
      )}
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
      {!isDashboard && <Footer />}
    </>
  );
}
