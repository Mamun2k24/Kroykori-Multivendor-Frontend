import React from "react";
import {
  FiTruck,
  FiRotateCcw,
  FiShield,
  FiHeadphones,
} from "react-icons/fi";

const FeaturesBanner = () => {
  const features = [
    {
      title: "Free Shipping",
      desc: "Orders over ৳999",
      icon: <FiTruck />,
      bg: "bg-blue-50",
      text: "text-blue-600",
    },
    {
      title: "Easy Returns",
      desc: "7 days return",
      icon: <FiRotateCcw />,
      bg: "bg-purple-50",
      text: "text-purple-600",
    },
    {
      title: "Secure Payment",
      desc: "Safe checkout",
      icon: <FiShield />,
      bg: "bg-orange-50",
      text: "text-orange-600",
    },
    {
      title: "Best Support",
      desc: "24/7 support",
      icon: <FiHeadphones />,
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },
  ];

  return (
    <section className="py-0 md:py-6 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div
          className="
            grid
            grid-cols-2
            lg:grid-cols-4
            gap-3
            md:gap-5
          "
        >
          {features.map((item, idx) => (
            <div
              key={idx}
              className="
                group
                flex
                items-center
                gap-2.5
                md:gap-4

                p-3
                md:p-5

                rounded-xl
                md:rounded-2xl

                bg-white
                border
                border-slate-200

                shadow-sm
                hover:border-blue-200
                hover:shadow-lg

                transition-all
                duration-300
              "
            >
              <div
                className={`
                  w-10
                  h-10
                  md:w-14
                  md:h-14

                  rounded-xl
                  md:rounded-2xl

                  flex
                  items-center
                  justify-center

                  shrink-0
                  shadow-sm

                  ${item.bg}
                  ${item.text}
                `}
              >
                <span className="text-lg md:text-2xl">
                  {item.icon}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <h4
                  className="
                    text-[13px]
                    md:text-base

                    font-semibold

                    text-slate-900

                    leading-4
                    md:leading-6
                  "
                >
                  {item.title}
                </h4>

                <p
                  className="
                    mt-1

                    text-[11px]
                    md:text-sm

                    text-slate-500

                    leading-4
                  "
                >
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesBanner;