import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useUser } from "../hooks/userContext";
import { getGuestId } from "../hooks/guest";
import { useQueryClient } from "@tanstack/react-query";

const useCartActions = (cart) => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  const guestId = getGuestId();
  const identifier = user?.id || guestId;

  const [quantities, setQuantities] = useState({});

  // Sync quantities when cart changes
  useEffect(() => {
    const initialQuantities = {};

    cart.forEach((item) => {
      initialQuantities[item._id] = Number(item.quantity) || 1;
    });

    setQuantities(initialQuantities);
  }, [cart]);

  const updateCartQuantity = useCallback(
    async (itemId, newQuantity) => {
      try {
        await axios.patch(
          `${import.meta.env.VITE_APP_SERVER_URL}api/cart/${itemId}`,
          { quantity: newQuantity },
          {
            params: user?.id
              ? { userId: user.id }
              : { guestId },
          }
        );

        queryClient.setQueryData(["cart", identifier], (oldCart = []) =>
          oldCart.map((item) =>
            item._id === itemId
              ? {
                  ...item,
                  quantity: newQuantity,
                }
              : item
          )
        );
      } catch (error) {
        console.error("Error updating quantity:", error);
        toast.error("Failed to update quantity.");
      }
    },
    [queryClient, identifier, user, guestId]
  );

  const handleIncrease = useCallback(
    (itemId) => {
      setQuantities((prev) => {
        const currentQty = Number(prev[itemId] || 1);
        const updatedQuantity = currentQty + 1;

        updateCartQuantity(itemId, updatedQuantity);

        return {
          ...prev,
          [itemId]: updatedQuantity,
        };
      });
    },
    [updateCartQuantity]
  );

  const handleDecrease = useCallback(
    (itemId) => {
      setQuantities((prev) => {
        const currentQty = Number(prev[itemId] || 1);
        const updatedQuantity = Math.max(currentQty - 1, 1);

        updateCartQuantity(itemId, updatedQuantity);

        return {
          ...prev,
          [itemId]: updatedQuantity,
        };
      });
    },
    [updateCartQuantity]
  );

  const handleDelete = useCallback(
    async (itemId) => {
      try {
        await axios.delete(
          `${import.meta.env.VITE_APP_SERVER_URL}api/cart/${itemId}`,
          {
            params: user?.id
              ? { userId: user.id }
              : { guestId },
          }
        );

        queryClient.setQueryData(["cart", identifier], (oldCart = []) =>
          oldCart.filter((item) => item._id !== itemId)
        );

        toast.success("Item successfully deleted!");
      } catch (error) {
        console.error("Error deleting item:", error);
        toast.error("Error deleting item from cart.");
      }
    },
    [queryClient, identifier, user, guestId]
  );

  const subTotal = cart.reduce((total, item) => {
  const effectivePrice =
    item?.productId?.flashSale?.enabled
      ? Number(item.productId.flashSale.salePrice || 0)
      : Number(item.itemPrice || 0);

  const qty =
    quantities[item._id] || item.quantity || 1;

  return total + effectivePrice * qty;
}, 0);

  return {
    quantities,
    handleIncrease,
    handleDecrease,
    handleDelete,
    subTotal,
  };
};

export default useCartActions;