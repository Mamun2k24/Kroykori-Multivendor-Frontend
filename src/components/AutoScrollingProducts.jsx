import React from "react";

const products = [
  "https://i.ibb.co/LwhwPhV/e5.jpg",
  "https://i.ibb.co/Cs78Mz9y/a15.jpg",
  "https://i.ibb.co/XZBKWjDL/Blue-color-t-shirt.webp",
  "https://i.ibb.co/rKqRFCKL/T-Shirts-Orange.jpg",

];

export default function AutoScrollingProducts() {
  const items = [...products, ...products];

  return (
    <section className="py-8 bg-white overflow-hidden">
      <div className="text-center mb-6">
   

        <h2 className="mt-3 text-2xl md:text-4xl font-bold">
          Trending Now
        </h2>

        <p className="text-gray-500 text-sm">
          Discover what people are loving right now
        </p>
      </div>

      <div className="overflow-hidden">
        <div className="marquee-track">
          {items.map((img, i) => (
            <div
              key={i}
              className="flex-none w-[140px] md:w-[220px]"
            >
              <img
                src={img}
                loading="lazy"
                alt=""
                className="w-full rounded-xl"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}