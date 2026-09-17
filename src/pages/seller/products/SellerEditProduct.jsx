import {
  useNavigate,
  useParams,
} from "react-router-dom";

import ProductEdit from "../../../components/ProductEdit";

const SellerEditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <ProductEdit
      isOpen
      title="Edit Seller Product"
      product={{ _id: id }}
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

export default SellerEditProduct;