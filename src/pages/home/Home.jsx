import React, { lazy, Suspense } from "react";
import { Helmet } from "react-helmet-async";

import HeroSlider from "../../components/HomeHero/HeroSlider";
import ProductCategory from "../productCategory/ProductCategory";
import AutoScrollingProducts from "../../components/AutoScrollingProducts";
import FlashSalePurple from "../../components/zozo/FlashSalePurple";
import PopularProduct from "./sections/popularProducts/PopularProducts";
import FeaturesBanner from "../../components/ui/FeaturesBanner";

// Lazy Components
const OurBrands = lazy(() => import("../../components/OurBrands"));
const VideoPromo = lazy(() => import("../../components/zozo/VideoPromo"));
const RecentlyViewed = lazy(() => import("../../components/RecentlyViewed"));

const Home = () => {
  return (
    <div>
      <Helmet>
        <title>Kroykori - Online Shopping Bangladesh</title>
        <meta
          name="description"
          content="Kroykori Online Shopping Bangladesh"
        />
        <link rel="canonical" href="https://kroykori.com/" />
      </Helmet>

      <HeroSlider />

      {/* Priority Sections */}
      <ProductCategory />
      {/* <FeaturesBanner /> */}
      {/* <AutoScrollingProducts /> */}
      <FlashSalePurple />
      <PopularProduct />

      {/* Lazy Sections */}
      {/* <Suspense fallback={null}>
        <div className="mt-7">
          <OurBrands />
        </div>
      </Suspense> */}

      <Suspense fallback={null}>
        <VideoPromo />
      </Suspense>

      <Suspense fallback={null}>
        <RecentlyViewed />
      </Suspense>
    </div>
  );
};

export default Home;