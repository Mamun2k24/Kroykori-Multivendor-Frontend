import React, { useState } from "react";
import { FiMinus, FiPlus } from "react-icons/fi";
import useAxiosSecure from "../hooks/useAxiosSecure";

const LandingCheckout = ({ page }) => {
  const axiosSecure = useAxiosSecure();

  const product = page.product;

  const [quantity, setQuantity] = useState(1);

  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    district: "",
    upazila: "",
    address: "",

    senderNumber: "",
    transactionId: "",
  });

  const changeHandler = (e) => {
    setForm({
      ...form,

      [e.target.name]: e.target.value,
    });
  };

  const submitOrder = async (e) => {
    e.preventDefault();

    const payload = {
      cartItems: [
        {
          productId: product._id,

          quantity: quantity,
        },
      ],

      shippingOption: "inside",

      paymentMethod,

      manualPayment:
        paymentMethod === "Cash on Delivery"
          ? null
          : {
              provider: paymentMethod,

              senderNumber: form.senderNumber,

              transactionId: form.transactionId,
            },

      customer: {
        name: form.name,

        mobile: form.mobile,
      },

      address: `${form.upazila}, ${form.address}`,

      district: form.district,
    };

    console.log(payload);

    try {
      const res = await axiosSecure.post(
        "/api/orders",

        payload,
      );

      console.log(res.data);

      alert("Order placed successfully");
    } catch (err) {
      console.log(err.response?.data);

      alert(err.response?.data?.message || "Order failed");
    }
  };

  return (
    <section
      id="checkout"
      className="
max-w-6xl
mx-auto
px-5
py-12
"
    >
      <div
        className="
grid
md:grid-cols-2
gap-8
bg-white
shadow-xl
rounded-3xl
p-6
border
"
      >
        {/* PRODUCT */}

        <div>
          <h2
            className="
text-2xl
font-bold
mb-5
"
          >
            আপনার অর্ডার
          </h2>

          <div
            className="
flex
gap-4
border
rounded-xl
p-4
"
          >
            <img
              src={product.productImage?.[0]}
              className="
w-28
h-28
object-cover
rounded-xl
"
            />

            <div>
              <h3
                className="
font-bold
"
              >
                {product.productName}
              </h3>

              <p
                className="
text-orange-600
font-bold
text-xl
"
              >
                ৳ {page.offer?.offerPrice || product.price}
              </p>

              <div
                className="
flex
items-center
gap-3
mt-3
"
              >
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="
border
p-2
rounded
"
                >
                  <FiMinus />
                </button>

                <span>{quantity}</span>

                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="
border
p-2
rounded
"
                >
                  <FiPlus />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FORM */}

        <form
          onSubmit={submitOrder}
          className="
space-y-4
"
        >
          <h2
            className="
text-2xl
font-bold
"
          >
            আপনার তথ্য
          </h2>

          <input
            required
            name="name"
            onChange={changeHandler}
            placeholder="আপনার নাম"
            className="
w-full
border
p-3
rounded-xl
"
          />

          <input
            required
            name="mobile"
            onChange={changeHandler}
            placeholder="মোবাইল নাম্বার"
            className="
w-full
border
p-3
rounded-xl
"
          />

          <input
            required
            name="district"
            onChange={changeHandler}
            placeholder="জেলা"
            className="
w-full
border
p-3
rounded-xl
"
          />

          <input
            required
            name="upazila"
            onChange={changeHandler}
            placeholder="উপজেলা"
            className="
w-full
border
p-3
rounded-xl
"
          />

          <textarea
            required
            name="address"
            onChange={changeHandler}
            placeholder="সম্পূর্ণ ঠিকানা"
            className="
w-full
border
p-3
rounded-xl
"
          />

          <h3
            className="
font-bold
"
          >
            Payment Method
          </h3>

          <label>
            <input
              type="radio"
              checked={paymentMethod === "Cash on Delivery"}
              onChange={() => setPaymentMethod("Cash on Delivery")}
            />
            Cash On Delivery
          </label>

          <br />

          <label>
            <input
              type="radio"
              checked={paymentMethod === "Bkash"}
              onChange={() => setPaymentMethod("Bkash")}
            />
            bKash
          </label>

          <br />

          <label>
            <input
              type="radio"
              checked={paymentMethod === "Nagad"}
              onChange={() => setPaymentMethod("Nagad")}
            />
            Nagad
          </label>

          {paymentMethod !== "Cash on Delivery" && (
            <>
              <input
                name="senderNumber"
                onChange={changeHandler}
                placeholder="bKash/Nagad Number"
                className="
w-full
border
p-3
rounded-xl
"
              />

              <input
                name="transactionId"
                onChange={changeHandler}
                placeholder="Transaction ID"
                className="
w-full
border
p-3
rounded-xl
"
              />
            </>
          )}

          <button
            className="
w-full
bg-green-600
text-white
py-4
rounded-xl
font-bold
text-lg
"
          >
            অর্ডার Confirm করুন
          </button>
        </form>
      </div>
    </section>
  );
};

export default LandingCheckout;
