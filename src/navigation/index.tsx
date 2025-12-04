// src/routes/Navigation.tsx
import { Routes, Route, Navigate } from "react-router-dom"
import SignIn from "../pages/auth/SignIn"
import ProtectedRoute from "./ProtectedRoute"
import AppLayout from "../components/layout/AppLayout"
import Home from "../pages/dashboard/Home"
import NotFound from "../pages/404"
import Blank from "../pages/Blank"
import { ScrollToTop } from "../components/common/ScrollToTop"
import { Role } from "../constants/common"
import Countries from "../pages/master/countries/list"
import Vendors from "../pages/master/vendors/list"
import LocationsList from "../pages/master/locations/list"
import Hubs from "../pages/master/hubs/list"
import NewShipment from "../pages/shipments/Newshipment";
import ScanPackage from "../pages/shipments/ScanPackage"

export default function Navigation() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/signIn" element={<SignIn />} />
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Logged-in routes (any role) */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/home" element={<Home />} />
        </Route>

        {/* Admin + Vendor only */}
        <Route
          element={
            <ProtectedRoute allowedRoles={[Role.ADMIN, Role.VENDOR]}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/countries" element={<Countries />} />
          <Route path="/locations" element={<LocationsList />} />
          <Route path="/hubs" element={<Hubs />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/newshipment" element={<NewShipment />} />
          <Route path="/scan" element={<ScanPackage />} />
        </Route>

        <Route path="/blank" element={<Blank />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
