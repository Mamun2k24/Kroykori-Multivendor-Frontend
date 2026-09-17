import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPixel } from "../utils/metaPixel";

const PixelPageView = () => {
  const location = useLocation();

  useEffect(() => {
    trackPixel("PageView");
  }, [location.pathname]);

  return null;
};

export default PixelPageView;