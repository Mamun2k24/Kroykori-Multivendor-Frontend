import { useNavigate } from "react-router-dom";
import AddProduct from "../../components/AddProduct";


const SellerAddProduct = () => {
  const navigate = useNavigate();

  return (
    <AddProduct
      isOpen
      title="Add Seller Product"
      isClose={() =>
        navigate(
          "/dashboard/seller/products",
        )
      }
      onSuccess={() => {
        setTimeout(() => {
          navigate(
            "/dashboard/seller/products",
            {
              replace: true,
            },
          );
        }, 800);
      }}
    />
  );
};

export default SellerAddProduct;