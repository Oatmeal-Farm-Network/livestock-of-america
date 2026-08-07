import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const FeatureBox = ({ title, description, imgSrc, link }) => (
  <div className="flex flex-col bg-[#819360] rounded-[20px] p-[10px] shadow-[0_4px_8px_rgba(0,0,0,0.1)] min-h-[250px] text-center w-full mb-4 lg:mb-0 border border-[#4d734d]/20">
    <Link to={link} className="block mb-[10px] overflow-hidden rounded-[20px]">
      <img src={imgSrc} alt={title} className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300" />
    </Link>
    <h3 className="text-[#e5af17] font-bold text-xl mb-2">
      <Link to={link} className="no-underline hover:underline transition-all duration-300 text-white">{title}</Link>
    </h3>
    <p className="text-white flex-grow text-sm mb-4 leading-relaxed font-medium">{description}</p>
    <Link to={link} className="bg-[#4d734d] text-white rounded-[20px] py-[10px] px-[25px] font-bold inline-block self-center hover:bg-white hover:text-[#4d734d] transition-colors mt-auto text-sm uppercase tracking-wider">
      Learn More
    </Link>
  </div>
);

export default function App() {
  const categories = [
    "Pasta", "Spices", "Mollusks and Crustaceans", "Fish", "Flours", "Rices",
    "Vegetables", "Berrys", "Nuts", "Meats", "Beans", "Fruit", "Edidable Flowers",
    "Algae", "Chemicals", "Salts", "Herbs", "Sugars", "Legumes", "Milk",
    "Tuber", "Fungi", "Grain", "Peppers", "Gourd", "Melon", "Other",
    "Root", "Seeds", "Oil", "Juice", "Powder", "Candy"
  ];

  return (
    <div className="min-h-screen font-sans">
      <Header />
      <section className="py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mt-3 mb-4 text-gray-900">
            Connect, Grow, Thrive: The Oatmeal Farm Network
          </h1>
          <p className="mt-3 text-gray-800 text-lg leading-relaxed">
            We're your comprehensive resource connecting the entire food system...
          </p>
        </div>
      </section>
      <section className="py-8 bg-white text-center">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <FeatureBox title="Food-System Directory" description="From seed to supper, connect with every part of the food system in our directory of 25 categories." imgSrc="/images/DirectoryHome.webp" link="/directory" />
            <FeatureBox title="Saige" description="Boost your farm's success with Saige's AI-powered insights for weather, soil, pests, and livestock." imgSrc="/images/CharlieHome.png" link="/saige" />
            <FeatureBox title="Livestock Marketplace" description="Buy and sell livestock online with our marketplace filled with 28 species of Livestock." imgSrc="/images/HomepageLivestockMarketplace.webp" link="/marketplaces/livestock" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <FeatureBox title="Plant Knowledgebase" description="Explore detailed profiles for over 4,000 food plant varieties." imgSrc="/images/PlantDBHome.webp" link="/plants" />
            <FeatureBox title="Livestock Database" description="Delve into detailed profiles for over 2,000 livestock breeds." imgSrc="/images/HomepageLivestockDB.webp" link="/livestock" />
            <FeatureBox title="Ingredient Knowledgebase" description="A comprehensive look at over 1,400 Ingredients with over 14,000 varieties." imgSrc="/images/Homepagefoodsystemdirectory.webp" link="/ingredients" />
          </div>
          <section className="bg-[#f3f4f6] p-8 rounded-[30px] shadow-inner border border-gray-200">
            <h2 className="text-2xl font-bold text-[#4d734d] mb-6">Explore Ingredients by Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {categories.map((cat, index) => (
                <button key={index} className="bg-[#819360] hover:bg-[#A3301E] text-white py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
                  {cat}
                </button>
              ))}
            </div>
          </section>
        </div>
      </section>
      <Footer />
    </div>
  );
}