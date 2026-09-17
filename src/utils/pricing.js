export const getProductPricing = (
  product,
  campaignActive
) => {
  const flashActive =
    campaignActive &&
    product?.flashSale?.enabled;

  return {
    price: flashActive
      ? product.flashSale.salePrice
      : product.price,

    regularPrice: flashActive
      ? product.price
      : null,

    discount: flashActive
      ? product.flashSale.discountPercent
      : 0,

    flashActive,
  };
};