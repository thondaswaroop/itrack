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
import FleetManagers from "../pages/fleetManagers"
import ManageAssociate from "../pages/master/associates/manage"
import NewShipment from "../pages/shipments/Newshipment";
import Arrival from "../pages/shipments/Arrival"
import ScanPackage from "../pages/shipments/ScanPackage"
import ShipmentReceiptPage from "../pages/shipments/ShipmentReceiptPage"
import LoadManagement from "../pages/load/LoadManagement"
import Containers from "../pages/load/Containers"
import Shelves from "../pages/load/Shelves"
import Reports from "../pages/Reports"
import Settings from "../pages/Settings"
import Customers from "../pages/Customers"
import AccountDiagnostics from "../pages/AccountDiagnostics"

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
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/account-diagnostics" element={<AccountDiagnostics />} />
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
          <Route path="/associates" element={<FleetManagers />} />
          <Route path="/associates/manage" element={<ManageAssociate />} />
        </Route>

        {/* Admin + Vendor + Associate (shipment operations) */}
        <Route
          element={
            <ProtectedRoute allowedRoles={[Role.ADMIN, Role.VENDOR, Role.ASSOCIATE]}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/newshipment" element={<NewShipment />} />
          <Route path="/arrival" element={<Arrival />} />
          <Route path="/scan" element={<ScanPackage />} />
          <Route path="/receipt" element={<ShipmentReceiptPage />} />
          <Route path="/load" element={<LoadManagement />} />
          <Route path="/containers" element={<Containers />} />
          <Route path="/shelves" element={<Shelves />} />
        </Route>

        <Route path="/blank" element={<Blank />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
