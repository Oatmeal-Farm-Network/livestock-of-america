import { Navigate, Route, Routes } from "react-router-dom";
import LivestockMarketplace from "./pages/LivestockMarketplace";
import LivestockForSale from "./pages/LivestockForSale";
import RanchList from "./pages/RanchList";
import Phase1EventsComingSoon from "./pages/Phase1EventsComingSoon";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ComingSoon from "./pages/ComingSoon";
import LivestockKnowledgebase from "./pages/LivestockKnowledgebase";
import LivestockSpeciesPage from "./pages/LivestockSpeciesPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LivestockMarketplace />} />
      <Route path="/animals" element={<LivestockMarketplace />} />
      <Route path="/marketplaces/livestock" element={<LivestockMarketplace />} />
      <Route path="/marketplaces/livestock/studs/:slug" element={<LivestockForSale />} />
      <Route path="/marketplaces/livestock/ranches/:slug" element={<RanchList />} />
      <Route path="/marketplaces/livestock/:slug" element={<LivestockForSale />} />

      <Route path="/livestock" element={<LivestockKnowledgebase />} />
      <Route path="/livestock/:slug" element={<LivestockSpeciesPage />} />
      <Route path="/knowledgebase" element={<Navigate to="/livestock" replace />} />

      <Route path="/events" element={<Phase1EventsComingSoon />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact-us" element={<Contact />} />
      <Route
        path="/news"
        element={
          <ComingSoon
            title="News Feed"
            description="Livestock industry news is coming soon to Livestock of America."
          />
        }
      />
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
