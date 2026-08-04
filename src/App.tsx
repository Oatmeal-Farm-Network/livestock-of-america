import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
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
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import AccountPlaceholder from "./pages/AccountPlaceholder";
import RequireAuth from "./components/RequireAuth";
import AnimalsHome from "./pages/seller/AnimalsHome";
import AnimalAdd from "./pages/seller/AnimalAdd";
import AnimalEdit from "./pages/seller/AnimalEdit";
import HerdHealthDashboard from "./pages/herd-health/HerdHealthDashboard";
import HerdHealthEvents, {
  HerdHealthVaccinations,
  HerdHealthTreatments,
  HerdHealthQuarantine,
  HerdHealthMedications,
  HerdHealthVetVisits,
  HerdHealthWeights,
  HerdHealthParasites,
  HerdHealthMortality,
  HerdHealthLabResults,
  HerdHealthBiosecurity,
  HerdHealthVetContacts,
  HerdHealthReproduction,
} from "./pages/herd-health/HerdHealthModules";
import SaigeWidget from "./components/SaigeWidget";
import AuthShell from "./components/AuthShell";
import { isLoggedIn } from "./lib/auth";
import { SavedItemsProvider } from "./lib/savedItems";

/** Guests see the marketing homepage; signed-in users land on the dashboard. */
function HomeGate() {
  if (isLoggedIn()) {
    return <Navigate to="/account" replace />;
  }
  return <Home />;
}

/** Contact Us is guest-only; signed-in users use the workspace instead. */
function ContactUsGuest() {
  if (isLoggedIn()) {
    return <Navigate to="/account" replace />;
  }
  return <ContactUs />;
}

function ContactUsConfirmGuest() {
  if (isLoggedIn()) {
    return <Navigate to="/account" replace />;
  }
  return <ContactUsConfirm />;
}

/** Left sidebar workspace chrome when signed in; public chrome when guest. */
function AppChrome() {
  const outlet = <Outlet />;
  if (isLoggedIn()) {
    return <AuthShell>{outlet}</AuthShell>;
  }
  return (
    <>
      {outlet}
      <SaigeWidget />
    </>
  );
}

export default function App() {
  return (
    <SavedItemsProvider>
    <Routes>
      {/* Auth pages stay outside the logged-in shell */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<AppChrome />}>
        <Route path="/" element={<HomeGate />} />
        <Route path="/animals" element={<LivestockMarketplace />} />
        <Route path="/marketplaces/livestock" element={<LivestockMarketplace />} />
        <Route path="/marketplaces/livestock/studs/:slug" element={<LivestockForSale />} />
        <Route
          path="/marketplaces/livestock/ranches/:slug"
          element={
            <RequireAuth>
              <RanchList />
            </RequireAuth>
          }
        />
        <Route
          path="/marketplaces/livestock/ranch/:businessId"
          element={
            <RequireAuth>
              <RanchProfile />
            </RequireAuth>
          }
        />
        <Route
          path="/marketplaces/livestock/animal/:id"
          element={
            <RequireAuth>
              <LivestockAnimalDetail />
            </RequireAuth>
          }
        />
        <Route path="/marketplaces/livestock/:slug" element={<LivestockForSale />} />

        <Route path="/knowledgebase" element={<Navigate to="/livestock" replace />} />
        <Route path="/knowledgebases" element={<Navigate to="/livestock" replace />} />

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
        <Route path="/contact-us" element={<ContactUsGuest />} />
        <Route path="/contact-us/confirm" element={<ContactUsConfirmGuest />} />
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
          path="/herd-health/vaccinations"
          element={
            <RequireAuth>
              <HerdHealthVaccinations />
            </RequireAuth>
          }
        />
        <Route
          path="/herd-health/treatments"
          element={
            <RequireAuth>
              <HerdHealthTreatments />
            </RequireAuth>
          }
        />
        <Route
          path="/herd-health/quarantine"
          element={
            <RequireAuth>
              <HerdHealthQuarantine />
            </RequireAuth>
          }
        />
        <Route
          path="/herd-health/medications"
          element={
            <RequireAuth>
              <HerdHealthMedications />
            </RequireAuth>
          }
        />
        <Route
          path="/herd-health/vet-visits"
          element={
            <RequireAuth>
              <HerdHealthVetVisits />
            </RequireAuth>
          }
        />
        <Route
          path="/herd-health/weights"
          element={
            <RequireAuth>
              <HerdHealthWeights />
            </RequireAuth>
          }
        />
        <Route
          path="/herd-health/parasites"
          element={
            <RequireAuth>
              <HerdHealthParasites />
            </RequireAuth>
          }
        />
        <Route
          path="/herd-health/mortality"
          element={
            <RequireAuth>
              <HerdHealthMortality />
            </RequireAuth>
          }
        />
        <Route
          path="/herd-health/lab-results"
          element={
            <RequireAuth>
              <HerdHealthLabResults />
            </RequireAuth>
          }
        />
        <Route
          path="/herd-health/biosecurity"
          element={
            <RequireAuth>
              <HerdHealthBiosecurity />
            </RequireAuth>
          }
        />
        <Route
          path="/herd-health/vet-contacts"
          element={
            <RequireAuth>
              <HerdHealthVetContacts />
            </RequireAuth>
          }
        />
        <Route
          path="/herd-health/reproduction"
          element={
            <RequireAuth>
              <HerdHealthReproduction />
            </RequireAuth>
          }
        />

        <Route
          path="/account/settings"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route
          path="/accounts/new"
          element={
            <RequireAuth>
              <AccountPlaceholder
                title="Add Account"
                description="Create a new business account. This flow is coming soon on Livestock of America."
              />
            </RequireAuth>
          }
        />
        <Route
          path="/account/users"
          element={
            <RequireAuth>
              <AccountPlaceholder
                title="Team"
                description="Manage team members for this account. Coming soon on Livestock of America."
              />
            </RequireAuth>
          }
        />
        <Route
          path="/account/profile"
          element={
            <RequireAuth>
              <AccountPlaceholder
                title="Edit Account"
                description="Edit account profile details. Coming soon on Livestock of America."
              />
            </RequireAuth>
          }
        />
        <Route
          path="/account/associations"
          element={
            <RequireAuth>
              <AccountPlaceholder
                title="Associations"
                description="Manage association memberships. Coming soon on Livestock of America."
              />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    </SavedItemsProvider>
  );
}
