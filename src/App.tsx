import { Navigate, Route, Routes } from "react-router-dom";
import LivestockMarketplace from "./pages/LivestockMarketplace";
import LivestockForSale from "./pages/LivestockForSale";
import RanchList from "./pages/RanchList";
import RanchProfile from "./pages/RanchProfile";
import LivestockAnimalDetail from "./pages/LivestockAnimalDetail";
import Phase1EventsComingSoon from "./pages/Phase1EventsComingSoon";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import About from "./pages/About";
import ContactUs from "./pages/ContactUs";
import ContactUsConfirm from "./pages/ContactUsConfirm";
import ComingSoon from "./pages/ComingSoon";
import LivestockDB from "./pages/LivestockDB";
import LivestockSpecies from "./pages/LivestockSpecies";
import LivestockBreed from "./pages/LivestockBreed";
import LivestockAbout from "./pages/LivestockAbout";
import Knowledgebases from "./pages/Knowledgebases";
import Dashboard from "./pages/Dashboard";
import AccountPlaceholder from "./pages/AccountPlaceholder";
import RequireAuth from "./components/RequireAuth";
import AnimalsHome from "./pages/seller/AnimalsHome";
import AnimalAdd from "./pages/seller/AnimalAdd";
import AnimalEdit from "./pages/seller/AnimalEdit";
import HerdHealthDashboard from "./pages/herd-health/HerdHealthDashboard";
import HerdHealthEvents from "./pages/herd-health/HerdHealthEvents";
import SaigeWidget from "./components/SaigeWidget";
import { SAIGE_API_URL } from "./config/api";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LivestockMarketplace />} />
        <Route path="/animals" element={<LivestockMarketplace />} />
        <Route path="/marketplaces/livestock" element={<LivestockMarketplace />} />
        <Route path="/marketplaces/livestock/studs/:slug" element={<LivestockForSale />} />
        <Route path="/marketplaces/livestock/ranches/:slug" element={<RanchList />} />
        <Route path="/marketplaces/livestock/ranch/:businessId" element={<RanchProfile />} />
        <Route path="/marketplaces/livestock/animal/:id" element={<LivestockAnimalDetail />} />
        <Route path="/marketplaces/livestock/:slug" element={<LivestockForSale />} />

        <Route path="/knowledgebase" element={<Knowledgebases />} />
        <Route path="/knowledgebases" element={<Navigate to="/knowledgebase" replace />} />

        <Route path="/livestock" element={<LivestockDB />} />
        <Route path="/livestock/:species/about" element={<LivestockAbout />} />
        <Route path="/livestock/:species/breed/:breedId" element={<LivestockBreed />} />
        <Route path="/livestock/:species" element={<LivestockSpecies />} />

        <Route path="/plant-knowledgebase/*" element={<Navigate to="/livestock" replace />} />
        <Route path="/ingredient-knowledgebase/*" element={<Navigate to="/livestock" replace />} />
        <Route path="/news" element={<Navigate to="/" replace />} />
        <Route path="/news/:id" element={<Navigate to="/" replace />} />
        <Route path="/app/news/*" element={<Navigate to="/" replace />} />

        <Route path="/events" element={<Phase1EventsComingSoon />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/contact-us/confirm" element={<ContactUsConfirm />} />
        <Route
          path="/blog"
          element={
            <ComingSoon
              title="Blog"
              description="The Livestock of America blog is coming soon."
            />
          }
        />
        <Route
          path="/directory"
          element={
            <ComingSoon
              title="Directory"
              description="The industry directory is coming soon. Browse ranches from the marketplace today."
            />
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route
          path="/account"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route path="/dashboard" element={<Navigate to="/account" replace />} />

        <Route
          path="/seller/animals"
          element={
            <RequireAuth>
              <AnimalsHome />
            </RequireAuth>
          }
        />
        <Route
          path="/seller/animals/add"
          element={
            <RequireAuth>
              <AnimalAdd />
            </RequireAuth>
          }
        />
        <Route
          path="/seller/animals/edit"
          element={
            <RequireAuth>
              <AnimalEdit />
            </RequireAuth>
          }
        />

        <Route
          path="/herd-health"
          element={
            <RequireAuth>
              <HerdHealthDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/herd-health/dashboard"
          element={
            <RequireAuth>
              <HerdHealthDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/herd-health/events"
          element={
            <RequireAuth>
              <HerdHealthEvents />
            </RequireAuth>
          }
        />

        <Route
          path="/accounts/new"
          element={
            <AccountPlaceholder
              title="Add Account"
              description="Create a new business account. This flow is coming soon on Livestock of America."
            />
          }
        />
        <Route
          path="/account/users"
          element={
            <AccountPlaceholder
              title="Team"
              description="Manage team members for this account. Coming soon on Livestock of America."
            />
          }
        />
        <Route
          path="/account/profile"
          element={
            <AccountPlaceholder
              title="Edit Account"
              description="Edit account profile details. Coming soon on Livestock of America."
            />
          }
        />
        <Route
          path="/account/associations"
          element={
            <AccountPlaceholder
              title="Associations"
              description="Manage association memberships. Coming soon on Livestock of America."
            />
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {SAIGE_API_URL ? <SaigeWidget /> : null}
    </>
  );
}
