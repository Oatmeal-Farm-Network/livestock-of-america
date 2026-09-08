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
const Impersonate = lazy(() => import("./pages/Impersonate"));
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
const BlogManage = lazy(() => import("./pages/blog/BlogManage"));
const BlogAuthors = lazy(() => import("./pages/blog/BlogAuthors"));
const BlogAuthorDetail = lazy(() => import("./pages/blog/BlogAuthorDetail"));
const AnimalsHome = lazy(() => import("./pages/seller/AnimalsHome"));
const AnimalAdd = lazy(() => import("./pages/seller/AnimalAdd"));
const AnimalEdit = lazy(() => import("./pages/seller/AnimalEdit"));
const AnimalDelete = lazy(() => import("./pages/seller/AnimalDelete"));
const AnimalPackages = lazy(() => import("./pages/seller/AnimalPackages"));
const AnimalTransfer = lazy(() => import("./pages/seller/AnimalTransfer"));
const AnimalStats = lazy(() => import("./pages/seller/AnimalStats"));
const HerdHealthDashboard = lazy(() => import("./pages/herd-health/HerdHealthDashboard"));
const HerdHealthReports = lazy(() => import("./pages/herd-health/HerdHealthReports"));
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
const UnifiedCart = lazy(() => import("./pages/UnifiedCart"));
const MarketplaceOrders = lazy(() => import("./pages/MarketplaceOrders"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const LivestockAnimalProgeny = lazy(() => import("./pages/LivestockAnimalProgeny"));
const FarmStandingOrders = lazy(() => import("./pages/FarmStandingOrders"));
const AboutAccounting = lazy(() => import("./pages/ofn/AboutAccounting"));
const AboutBlog = lazy(() => import("./pages/ofn/AboutBlog"));
const AboutCertificationsTracker = lazy(() => import("./pages/ofn/AboutCertificationsTracker"));
const AboutCommunity = lazy(() => import("./pages/ofn/AboutCommunity"));
const AboutDirectory = lazy(() => import("./pages/ofn/AboutDirectory"));
const AboutEquipmentMarketplace = lazy(() => import("./pages/ofn/AboutEquipmentMarketplace"));
const AboutEvents = lazy(() => import("./pages/ofn/AboutEvents"));
const AboutGrants = lazy(() => import("./pages/ofn/AboutGrants"));
const AboutJobBoard = lazy(() => import("./pages/ofn/AboutJobBoard"));
const AboutLandLeasing = lazy(() => import("./pages/ofn/AboutLandLeasing"));
const AboutLivestockHerdHealth = lazy(() => import("./pages/ofn/AboutLivestockHerdHealth"));
const AboutLivestockMarketplace = lazy(() => import("./pages/ofn/AboutLivestockMarketplace"));
const AboutMarketplace = lazy(() => import("./pages/ofn/AboutMarketplace"));
const AboutMarketplaces = lazy(() => import("./pages/ofn/AboutMarketplaces"));
const AboutPairsley = lazy(() => import("./pages/ofn/AboutPairsley"));
const AboutProductsStorefront = lazy(() => import("./pages/ofn/AboutProductsStorefront"));
const AboutSaige = lazy(() => import("./pages/ofn/AboutSaige"));
const AboutThaiyme = lazy(() => import("./pages/ofn/AboutThaiyme"));
const AboutWebsiteBuilder = lazy(() => import("./pages/ofn/AboutWebsiteBuilder"));
const ServicesHome = lazy(() => import("./pages/ofn/ServicesHome"));
const EquipmentMarketplace = lazy(() => import("./pages/ofn/EquipmentMarketplace"));
const EquipmentListingDetail = lazy(() => import("./pages/ofn/EquipmentListingDetail"));
const MyEquipmentListings = lazy(() => import("./pages/ofn/MyEquipmentListings"));
const FoodWantedBoard = lazy(() => import("./pages/ofn/FoodWantedBoard"));
const FoodWantedAdDetail = lazy(() => import("./pages/ofn/FoodWantedAdDetail"));
const MyFoodWantedAds = lazy(() => import("./pages/ofn/MyFoodWantedAds"));
const RealEstateMarketplace = lazy(() => import("./pages/ofn/RealEstateMarketplace"));
const ProductsMarketplace = lazy(() => import("./pages/ofn/ProductsMarketplace"));
const ProductDetail = lazy(() => import("./pages/ofn/ProductDetail"));
const ProductsInventory = lazy(() => import("./pages/ofn/ProductsInventory"));
const ProductEdit = lazy(() => import("./pages/ofn/ProductEdit"));
const ServicesDirectory = lazy(() => import("./pages/ofn/ServicesDirectory"));
const ServicesAdd = lazy(() => import("./pages/ofn/ServicesAdd"));
const ServicesEdit = lazy(() => import("./pages/ofn/ServicesEdit"));
const ServiceDetail = lazy(() => import("./pages/ofn/ServiceDetail"));
const ServicesSuggestCategory = lazy(() => import("./pages/ofn/ServicesSuggestCategory"));
const SellerListings = lazy(() => import("./pages/ofn/SellerListings"));
const SellerOrders = lazy(() => import("./pages/ofn/SellerOrders"));
const SellerStripeConnect = lazy(() => import("./pages/ofn/SellerStripeConnect"));
const JobBoard = lazy(() => import("./pages/ofn/JobBoard"));
const LandLeasing = lazy(() => import("./pages/ofn/LandLeasing"));
const ESGDashboard = lazy(() => import("./pages/ofn/ESGDashboard"));
const FarmKPIDashboard = lazy(() => import("./pages/ofn/FarmKPIDashboard"));
const FarmSafety = lazy(() => import("./pages/ofn/FarmSafety"));
const ComplianceAudit = lazy(() => import("./pages/ofn/ComplianceAudit"));
const DocumentVault = lazy(() => import("./pages/ofn/DocumentVault"));
const FarmInfrastructure = lazy(() => import("./pages/ofn/FarmInfrastructure"));
const FarmerSettlement = lazy(() => import("./pages/ofn/FarmerSettlement"));
const DeliveryRoutes = lazy(() => import("./pages/ofn/DeliveryRoutes"));
const HRDashboard = lazy(() => import("./pages/ofn/HRDashboard"));
const OrgProfile = lazy(() => import("./pages/ofn/OrgProfile"));
const BuyerCRM = lazy(() => import("./pages/ofn/BuyerCRM"));
const AppDownload = lazy(() => import("./pages/ofn/AppDownload"));
const AudioSettings = lazy(() => import("./pages/ofn/AudioSettings"));
const JudgePortal = lazy(() => import("./pages/ofn/JudgePortal"));
const SpeakerPortal = lazy(() => import("./pages/ofn/SpeakerPortal"));
const IngredientKnowledgebase = lazy(() => import("./pages/ofn/IngredientKnowledgebase"));
const IngredientVarieties = lazy(() => import("./pages/ofn/IngredientVarieties"));
const SupplierDirectory = lazy(() => import("./pages/ofn/SupplierDirectory"));
const SupplierScorecard = lazy(() => import("./pages/ofn/SupplierScorecard"));
const PriceList = lazy(() => import("./pages/ofn/PriceList"));
const ScaleTickets = lazy(() => import("./pages/ofn/ScaleTickets"));
const WeatherDashboard = lazy(() => import("./pages/ofn/WeatherDashboard"));
const ForBusinessPage = lazy(() => import("./pages/ofn/ForBusinessPage"));
const AboutAgSupport = lazy(() => import("./pages/ofn/AboutAgSupport"));
const AboutAIAgents = lazy(() => import("./pages/ofn/AboutAIAgents"));
const Accounts = lazy(() => import("./pages/ofn/Accounts"));
const EventsList = lazy(() => import("./pages/ofn/EventsList"));
const EventsManage = lazy(() => import("./pages/ofn/EventsManage"));
const EventAdd = lazy(() => import("./pages/ofn/EventAdd"));
const MyRegistrations = lazy(() => import("./pages/ofn/MyRegistrations"));

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
      {/* The one-time token in the URL is the credential, so this sits
          outside RequireAuth and outside the logged-in shell. */}
      <Route path="/impersonate" element={<Impersonate />} />

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

        {/* Real events list, replacing the coming-soon placeholder. */}
        <Route path="/events" element={<EventsList />} />
        <Route path="/events/manage" element={<RequireAuth><EventsManage /></RequireAuth>} />
        <Route path="/events/add" element={<RequireAuth><EventAdd /></RequireAuth>} />
        <Route path="/my-registrations" element={<RequireAuth><MyRegistrations /></RequireAuth>} />
        <Route path="/about" element={<About />} />
        <Route path="/about/oatmeal-ai" element={<AboutOatmealAI />} />
        <Route path="/contact-us" element={<ContactUsGuest />} />
        <Route path="/contact-us/confirm" element={<ContactUsConfirmGuest />} />
        <Route path="/blog" element={<BlogList />} />
        <Route
          path="/blog/manage"
          element={
            <RequireAuth>
              <BlogManage />
            </RequireAuth>
          }
        />
        <Route
          path="/blog/authors/manage"
          element={
            <RequireAuth>
              <BlogAuthors />
            </RequireAuth>
          }
        />
        <Route path="/blog/authors/:authorId" element={<BlogAuthorDetail />} />
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
          path="/seller/animals/delete"
          element={
            <RequireAuth>
              <AnimalDelete />
            </RequireAuth>
          }
        />
        <Route
          path="/seller/animals/packages"
          element={
            <RequireAuth>
              <AnimalPackages />
            </RequireAuth>
          }
        />
        <Route
          path="/seller/animals/transfer"
          element={
            <RequireAuth>
              <AnimalTransfer />
            </RequireAuth>
          }
        />
        <Route
          path="/seller/animals/stats"
          element={
            <RequireAuth>
              <AnimalStats />
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
          path="/herd-health/reports"
          element={
            <RequireAuth>
              <HerdHealthReports />
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
        {/* Marketplace commerce: cart, buyer orders and one order's detail. */}
        <Route
          path="/cart"
          element={
            <RequireAuth>
              <UnifiedCart />
            </RequireAuth>
          }
        />
        <Route
          path="/orders"
          element={
            <RequireAuth>
              <MarketplaceOrders />
            </RequireAuth>
          }
        />
        <Route
          path="/orders/:orderId"
          element={
            <RequireAuth>
              <OrderDetail />
            </RequireAuth>
          }
        />
        {/* LivestockAnimalDetail already links here; without the route the
            catch-all was bouncing "View Progeny" to the homepage. Public, like
            the animal page it is reached from. */}
        <Route
          path="/marketplaces/livestock/animal/:id/progeny"
          element={<LivestockAnimalProgeny />}
        />
        <Route
          path="/farm/standing-orders"
          element={
            <RequireAuth>
              <FarmStandingOrders />
            </RequireAuth>
          }
        />

        {/* Platform feature pages ported from OFN. All public: they are
            marketing/explainer pages, not workspace tools. */}
        <Route path="/platform/accounting" element={<AboutAccounting />} />
        <Route path="/platform/blog" element={<AboutBlog />} />
        <Route path="/platform/certifications-tracker" element={<AboutCertificationsTracker />} />
        <Route path="/platform/community" element={<AboutCommunity />} />
        <Route path="/platform/directory" element={<AboutDirectory />} />
        <Route path="/platform/equipment-marketplace" element={<AboutEquipmentMarketplace />} />
        <Route path="/platform/events" element={<AboutEvents />} />
        <Route path="/platform/grants" element={<AboutGrants />} />
        <Route path="/platform/jobs" element={<AboutJobBoard />} />
        <Route path="/platform/land-leasing" element={<AboutLandLeasing />} />
        <Route path="/platform/livestock-herd-health" element={<AboutLivestockHerdHealth />} />
        <Route path="/platform/livestock-marketplace" element={<AboutLivestockMarketplace />} />
        <Route path="/platform/marketplace" element={<AboutMarketplace />} />
        <Route path="/platform/marketplaces" element={<AboutMarketplaces />} />
        <Route path="/platform/pairsley" element={<AboutPairsley />} />
        <Route path="/platform/products-storefront" element={<AboutProductsStorefront />} />
        <Route path="/platform/saige" element={<AboutSaige />} />
        <Route path="/platform/thaiyme" element={<AboutThaiyme />} />
        <Route path="/platform/website-builder" element={<AboutWebsiteBuilder />} />

        {/* Equipment, food-wanted and land marketplaces ported from OFN. */}
        <Route path="/marketplaces/equipment" element={<EquipmentMarketplace />} />
        <Route path="/marketplaces/equipment/:listingId" element={<EquipmentListingDetail />} />
        <Route path="/equipment/my-listings" element={<RequireAuth><MyEquipmentListings /></RequireAuth>} />
        <Route path="/marketplaces/food-wanted" element={<FoodWantedBoard />} />
        <Route path="/marketplaces/food-wanted/:adId" element={<FoodWantedAdDetail />} />
        <Route path="/food-wanted/my-ads" element={<RequireAuth><MyFoodWantedAds /></RequireAuth>} />
        <Route path="/marketplaces/real-estate" element={<RealEstateMarketplace />} />

        {/* Products storefront and services directory, ported from OFN. */}
        <Route path="/marketplace/products" element={<ProductsMarketplace />} />
        <Route path="/marketplace/products/:id" element={<ProductDetail />} />
        <Route path="/products" element={<RequireAuth><ProductsInventory /></RequireAuth>} />
        <Route path="/products/add" element={<RequireAuth><ProductEdit /></RequireAuth>} />
        {/* The bare path had no route, so it fell through the catch-all to the
            home page - even though the sitemap advertises it and the page is
            written to work with no category. */}
        <Route path="/services/directory" element={<ServicesDirectory />} />
        <Route path="/services/directory/:categoryId" element={<ServicesDirectory />} />
        <Route path="/services/add" element={<ServicesAdd />} />
        <Route path="/services/edit" element={<ServicesEdit />} />
        <Route path="/services/public/:servicesId" element={<ServiceDetail />} />
        <Route path="/services/suggest-category" element={<ServicesSuggestCategory />} />

        {/* Seller tooling, jobs, land and the farm-operations dashboards. */}
        <Route path="/seller/listings" element={<SellerListings />} />
        <Route path="/seller/orders" element={<SellerOrders />} />
        <Route path="/account/stripe-connect" element={<RequireAuth><SellerStripeConnect /></RequireAuth>} />
        <Route path="/jobs" element={<JobBoard />} />
        <Route path="/land" element={<LandLeasing />} />
        <Route path="/esg-dashboard" element={<ESGDashboard />} />
        <Route path="/farm-kpi" element={<RequireAuth><FarmKPIDashboard /></RequireAuth>} />
        <Route path="/farm-safety" element={<RequireAuth><FarmSafety /></RequireAuth>} />
        <Route path="/compliance" element={<RequireAuth><ComplianceAudit /></RequireAuth>} />
        <Route path="/documents" element={<RequireAuth><DocumentVault /></RequireAuth>} />
        <Route path="/farm-infrastructure" element={<RequireAuth><FarmInfrastructure /></RequireAuth>} />
        <Route path="/farmer-settlement" element={<RequireAuth><FarmerSettlement /></RequireAuth>} />
        <Route path="/delivery-routes" element={<RequireAuth><DeliveryRoutes /></RequireAuth>} />
        <Route path="/hr" element={<RequireAuth><HRDashboard /></RequireAuth>} />

        {/* Org profile, CRM, portals, knowledgebase and misc tooling. */}
        <Route path="/profile" element={<OrgProfile />} />
        <Route path="/marketplaces/livestock/ranch/:businessId" element={<OrgProfile />} />
        <Route path="/buyer-crm" element={<RequireAuth><BuyerCRM /></RequireAuth>} />
        <Route path="/app" element={<AppDownload />} />
        <Route path="/download" element={<AppDownload />} />
        <Route path="/account/audio-settings" element={<AudioSettings />} />
        <Route path="/judge/:accessCode" element={<JudgePortal />} />
        <Route path="/speaker/:accessCode" element={<SpeakerPortal />} />
        <Route path="/ingredient-knowledgebase" element={<IngredientKnowledgebase />} />
        <Route path="/ingredient-knowledgebase/:category/varieties/:ingredientId" element={<IngredientVarieties />} />
        <Route path="/suppliers" element={<SupplierDirectory />} />
        <Route path="/supplier-scorecard" element={<RequireAuth><SupplierScorecard /></RequireAuth>} />
        <Route path="/price-list" element={<RequireAuth><PriceList /></RequireAuth>} />
        <Route path="/scale-tickets" element={<RequireAuth><ScaleTickets /></RequireAuth>} />
        <Route path="/weather" element={<RequireAuth><WeatherDashboard /></RequireAuth>} />
        <Route path="/for-farms" element={<ForBusinessPage type="farms" />} />
        <Route path="/for-ranches" element={<ForBusinessPage type="ranches" />} />
        <Route path="/for-artisan-producers" element={<ForBusinessPage type="artisan-producers" />} />
        <Route path="/agriculture-support" element={<AboutAgSupport />} />
        <Route path="/ai-agents" element={<AboutAIAgents />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/services" element={<ServicesHome />} />
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
