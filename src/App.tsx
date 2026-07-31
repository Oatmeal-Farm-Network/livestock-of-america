import { Navigate, Route, Routes } from "react-router-dom";
import LivestockMarketplace from "./pages/LivestockMarketplace";
import LivestockForSale from "./pages/LivestockForSale";
import RanchList from "./pages/RanchList";
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
import PlantKnowledgebase from "./pages/PlantKnowledgebase";
import PlantCategory from "./pages/PlantCategory";
import PlantVarietals from "./pages/PlantVarietals";
import PlantVarietalDetail from "./pages/PlantVarietalDetail";
import IngredientKnowledgebase from "./pages/IngredientKnowledgebase";
import IngredientCategory from "./pages/IngredientCategory";
import IngredientVarieties from "./pages/IngredientVarieties";
import NewsFeedPage from "./pages/NewsFeedPage";
import NewsArticlePage from "./pages/NewsArticlePage";
import Dashboard from "./pages/Dashboard";
import AccountPlaceholder from "./pages/AccountPlaceholder";
import RequireAuth from "./components/RequireAuth";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LivestockMarketplace />} />
      <Route path="/animals" element={<LivestockMarketplace />} />
      <Route path="/marketplaces/livestock" element={<LivestockMarketplace />} />
      <Route path="/marketplaces/livestock/studs/:slug" element={<LivestockForSale />} />
      <Route path="/marketplaces/livestock/ranches/:slug" element={<RanchList />} />
      <Route path="/marketplaces/livestock/:slug" element={<LivestockForSale />} />

      {/* Knowledgebases hub */}
      <Route path="/knowledgebase" element={<Knowledgebases />} />
      <Route path="/knowledgebases" element={<Navigate to="/knowledgebase" replace />} />

      {/* Livestock Knowledgebase */}
      <Route path="/livestock" element={<LivestockDB />} />
      <Route path="/livestock/:species/about" element={<LivestockAbout />} />
      <Route path="/livestock/:species/breed/:breedId" element={<LivestockBreed />} />
      <Route path="/livestock/:species" element={<LivestockSpecies />} />

      {/* Plant Knowledgebase (OFN main API via VITE_OFN_API_URL) */}
      <Route path="/plant-knowledgebase" element={<PlantKnowledgebase />} />
      <Route path="/plant-knowledgebase/varietals/:plantId" element={<PlantVarietals />} />
      <Route path="/plant-knowledgebase/varietal-detail/:varietyId" element={<PlantVarietalDetail />} />
      <Route path="/plant-knowledgebase/:category" element={<PlantCategory />} />

      {/* Ingredient Knowledgebase (OFN main API via VITE_OFN_API_URL) */}
      <Route path="/ingredient-knowledgebase" element={<IngredientKnowledgebase />} />
      <Route
        path="/ingredient-knowledgebase/:category/varieties/:ingredientId"
        element={<IngredientVarieties />}
      />
      <Route path="/ingredient-knowledgebase/:category" element={<IngredientCategory />} />

      {/* News Feed */}
      <Route path="/news" element={<NewsFeedPage />} />
      <Route path="/news/:id" element={<NewsArticlePage />} />
      <Route path="/app/news" element={<Navigate to="/news" replace />} />
      <Route path="/app/news/:id" element={<NewsArticlePage />} />

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

      {/* Account Dashboard (same Phase-1 OFN Dashboard at /account) */}
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
  );
}
