import { Navigate, Outlet, Route, Routes } from "react-router";
import Home from "./pages/Home";
import LivestockMarketplace from "./pages/LivestockMarketplace";
import LivestockForSale from "./pages/LivestockForSale";
import RanchList from "./pages/RanchList";
import RanchProfile from "./pages/RanchProfile";
import LivestockAnimalDetail from "./pages/LivestockAnimalDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import About from "./pages/About";
import AboutOatmealAI from "./pages/AboutOatmealAI";
import ContactUs from "./pages/ContactUs";
import ContactUsConfirm from "./pages/ContactUsConfirm";
import ComingSoon from "./pages/ComingSoon";
import FeatureComingSoon from "./pages/FeatureComingSoon";
import LivestockDB from "./pages/LivestockDB";
import LivestockSpecies from "./pages/LivestockSpecies";
import LivestockBreed from "./pages/LivestockBreed";
import LivestockAbout from "./pages/LivestockAbout";
import Dashboard from "./pages/Dashboard";
import NewsFeedPage from "./pages/NewsFeedPage";
import NewsArticlePage from "./pages/NewsArticlePage";
import DirectoryList from "./Directory/pages/DirectoryList";
import DirectoryDetail from "./Directory/pages/DirectoryDetail";
import BlogList from "./pages/BlogList";
import BlogDetail from "./pages/BlogDetail";
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
import Profile from "./pages/Profile";
import AccountPlaceholder from "./pages/AccountPlaceholder";
import Phase1EventsComingSoon from "./pages/Phase1EventsComingSoon";

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

/** Guests: page Header. Signed-in: LOA top header + OFN-style left sidebar. */
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
        {/* Public: "View Ranch Profile" and "Contact Seller" on the animal
            detail page point here, so gating it bounced both to login. The
            same component is already public at /directory/business/:id, and
            every endpoint it calls is public. */}
        <Route
          path="/marketplaces/livestock/ranch/:businessId"
          element={<RanchProfile />}
        />
        {/* Public: listings link straight here, so gating it sent every
            for-sale and stud click to the login page instead of the animal.
            The detail endpoint is public and the page holds no auth-only
            data — SaveButton prompts for login on click when needed. */}
        <Route
          path="/marketplaces/livestock/animal/:id"
          element={<LivestockAnimalDetail />}
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

        {/* News Feed — public before login; AuthShell wraps it after login */}
        <Route path="/news" element={<NewsFeedPage />} />
        <Route path="/news/:id" element={<NewsArticlePage />} />
        <Route path="/app/news" element={<Navigate to="/news" replace />} />
        <Route path="/app/news/:id" element={<NewsArticlePage />} />

        <Route path="/events" element={<Phase1EventsComingSoon />} />
        <Route path="/about" element={<About />} />
        <Route path="/about/oatmeal-ai" element={<AboutOatmealAI />} />
        <Route path="/contact-us" element={<ContactUsGuest />} />
        <Route path="/contact-us/confirm" element={<ContactUsConfirmGuest />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:postId" element={<BlogDetail />} />
        <Route
          path="/directory"
          element={<DirectoryList />}
        />
        <Route path="/directory/business/:businessId" element={<RanchProfile />} />
        <Route path="/directory/business" element={<RanchProfile />} />
        <Route path="/directory/:directoryType" element={<DirectoryDetail />} />
        <Route
          path="/over-the-fence"
          element={
            <ComingSoon
              title="Over The Fence DM"
              description="Over The Fence direct messaging is coming soon to Livestock of America by Oatmeal AI."
            />
          }
        />
        <Route path="/coming-soon" element={<FeatureComingSoon />} />

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
