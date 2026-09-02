import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router";

// Only what the first paint needs is imported eagerly: the chrome, the auth
// helpers, and the landing page. Every other route is a dynamic import, so a
// visitor downloads the herd-health suite or the seller tools only if they
// actually navigate there. Statically importing all 34 routes put the whole
// app in one 677 kB chunk that had to parse before anything rendered.
import Home from "./pages/Home";
import RequireAuth from "./components/RequireAuth";
import AuthShell from "./components/AuthShell";
import { isLoggedIn } from "./lib/auth";
import { SavedItemsProvider } from "./lib/savedItems";

const LivestockMarketplace = lazy(() => import("./pages/LivestockMarketplace"));
const LivestockForSale = lazy(() => import("./pages/LivestockForSale"));
const RanchList = lazy(() => import("./pages/RanchList"));
const RanchProfile = lazy(() => import("./pages/RanchProfile"));
const LivestockAnimalDetail = lazy(() => import("./pages/LivestockAnimalDetail"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const About = lazy(() => import("./pages/About"));
const AboutOatmealAI = lazy(() => import("./pages/AboutOatmealAI"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const ContactUsConfirm = lazy(() => import("./pages/ContactUsConfirm"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const FeatureComingSoon = lazy(() => import("./pages/FeatureComingSoon"));
const LivestockDB = lazy(() => import("./pages/LivestockDB"));
const LivestockSpecies = lazy(() => import("./pages/LivestockSpecies"));
const LivestockBreed = lazy(() => import("./pages/LivestockBreed"));
const LivestockAbout = lazy(() => import("./pages/LivestockAbout"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NewsFeedPage = lazy(() => import("./pages/NewsFeedPage"));
const NewsArticlePage = lazy(() => import("./pages/NewsArticlePage"));
const DirectoryList = lazy(() => import("./Directory/pages/DirectoryList"));
const DirectoryDetail = lazy(() => import("./Directory/pages/DirectoryDetail"));
const BlogList = lazy(() => import("./pages/BlogList"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const AnimalsHome = lazy(() => import("./pages/seller/AnimalsHome"));
const AnimalAdd = lazy(() => import("./pages/seller/AnimalAdd"));
const AnimalEdit = lazy(() => import("./pages/seller/AnimalEdit"));
const HerdHealthDashboard = lazy(() => import("./pages/herd-health/HerdHealthDashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const AccountNew = lazy(() => import("./pages/AccountNew"));
const AccountProfile = lazy(() => import("./pages/AccountProfile"));
const AccountAssociations = lazy(() => import("./pages/AccountAssociations"));
const AccountTeamMembers = lazy(() => import("./pages/AccountTeamMembers"));
const Phase1EventsComingSoon = lazy(() => import("./pages/Phase1EventsComingSoon"));
const Permissions = lazy(() => import("./pages/Permissions"));
const AccountChangeType = lazy(() => import("./pages/AccountChangeType"));
const AccountSubscription = lazy(() => import("./pages/AccountSubscription"));
const AccountDelete = lazy(() => import("./pages/AccountDelete"));

// HerdHealthModules exports one default plus twelve named components. lazy()
// only understands a default export, so each is unwrapped here; they all
// resolve to the same dynamic import and therefore share a single chunk.
const HERD_HEALTH = () => import("./pages/herd-health/HerdHealthModules");
const HerdHealthEvents = lazy(HERD_HEALTH);
const HerdHealthVaccinations = lazy(() => HERD_HEALTH().then((m) => ({ default: m.HerdHealthVaccinations })));
const HerdHealthTreatments = lazy(() => HERD_HEALTH().then((m) => ({ default: m.HerdHealthTreatments })));
const HerdHealthQuarantine = lazy(() => HERD_HEALTH().then((m) => ({ default: m.HerdHealthQuarantine })));
const HerdHealthMedications = lazy(() => HERD_HEALTH().then((m) => ({ default: m.HerdHealthMedications })));
const HerdHealthVetVisits = lazy(() => HERD_HEALTH().then((m) => ({ default: m.HerdHealthVetVisits })));
const HerdHealthWeights = lazy(() => HERD_HEALTH().then((m) => ({ default: m.HerdHealthWeights })));
const HerdHealthParasites = lazy(() => HERD_HEALTH().then((m) => ({ default: m.HerdHealthParasites })));
const HerdHealthMortality = lazy(() => HERD_HEALTH().then((m) => ({ default: m.HerdHealthMortality })));
const HerdHealthLabResults = lazy(() => HERD_HEALTH().then((m) => ({ default: m.HerdHealthLabResults })));
const HerdHealthBiosecurity = lazy(() => HERD_HEALTH().then((m) => ({ default: m.HerdHealthBiosecurity })));
const HerdHealthVetContacts = lazy(() => HERD_HEALTH().then((m) => ({ default: m.HerdHealthVetContacts })));
const HerdHealthReproduction = lazy(() => HERD_HEALTH().then((m) => ({ default: m.HerdHealthReproduction })));

/** Guests see the marketing homepage; signed-in users land on the dashboard. */
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
  // Saige chat widget is temporarily hidden. To bring it back, restore the
  // SaigeWidget import and render it here and in AuthShell.
  return outlet;
}

/** Holds the viewport while a route chunk arrives. Full height and the page
 *  background, so a lazy navigation does not flash white or shift layout. */
function RouteFallback() {
  return <div style={{ minHeight: "100vh", backgroundColor: "#faf7f2" }} />;
}

export default function App() {
  return (
    <SavedItemsProvider>
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      {/* Auth pages stay outside the logged-in shell */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<AppChrome />}>
        {/* The home page is reachable by everyone. Signed-in visitors used to be
            bounced to /account here, which made the header's Home link impossible
            to follow — it always landed on the workspace instead. */}
        <Route path="/" element={<Home />} />
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
              description="Over The Fence direct messaging is coming soon to Livestock Of America."
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
              <AccountNew />
            </RequireAuth>
          }
        />
        <Route
          path="/account/users"
          element={
            <RequireAuth>
              <AccountTeamMembers />
            </RequireAuth>
          }
        />
        {/* Roles, Team Members and Audit Log are three tabs of one page, which
            is what the sidebar's ?tab= links select. */}
        <Route
          path="/permissions"
          element={
            <RequireAuth>
              <Permissions />
            </RequireAuth>
          }
        />
        {/* The three Settings destinations in the sidebar. */}
        <Route
          path="/account/change-type"
          element={
            <RequireAuth>
              <AccountChangeType />
            </RequireAuth>
          }
        />
        <Route
          path="/account/subscription"
          element={
            <RequireAuth>
              <AccountSubscription />
            </RequireAuth>
          }
        />
        <Route
          path="/account/delete"
          element={
            <RequireAuth>
              <AccountDelete />
            </RequireAuth>
          }
        />
        <Route
          path="/account/profile"
          element={
            <RequireAuth>
              <AccountProfile />
            </RequireAuth>
          }
        />
        <Route
          path="/account/associations"
          element={
            <RequireAuth>
              <AccountAssociations />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    </Suspense>
    </SavedItemsProvider>
  );
}
