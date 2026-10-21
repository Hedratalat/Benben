import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";

import Layout from "./components/Layout/Layout";
import About from "./pages/About";
import Login from "./pages/Login";
import DashBoardLayout from "./components/DashboardLayout/DashboardLayout";
import HeroDashboard from "./pages/HeroDashboard";
import MessageDashboard from "./pages/MessageDashboard";
import ProductsManagement from "./pages/ProductsManagement";
import Feedbackdashboard from "./pages/Feedbackdashboard";

const Home = lazy(() => import("./pages/Home"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const Shop = lazy(() => import("./pages/Shop"));
const Cart = lazy(() => import("./pages/Cart"));
const Favorites = lazy(() => import("./pages/Favorites"));
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<ContactUs />} />
        <Route path="shop" element={<Shop />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="cart" element={<Cart />} />
        <Route path="*" element={<NotFound />} />

        <Route
          path="/dashboard"
          element={
            // <ProtectedRoute>
            <DashBoardLayout />
            // </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="HeroDashboard" replace />} />
          <Route path="heroDashboard" element={<HeroDashboard />} />
          <Route path="productsManagement" element={<ProductsManagement />} />
          <Route path="Feedback" element={<Feedbackdashboard />} />
          <Route path="message" element={<MessageDashboard />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
