import React from "react";
import { ArrowRight, BadgeCheck, ShieldCheck, Sparkles, Users, WalletCards, TrendingUp, Clock3 } from "lucide-react";

const stats = [
  { value: "24/7", label: "User Support" },
  { value: "Fast", label: "Simple Process" },
  { value: "Secure", label: "Trusted Platform" },
];

const features = [
  {
    icon: WalletCards,
    title: "Easy to Use",
    text: "Kroykori is built to make online earning, rewards, and user activity simple for everyone.",
  },
  {
    icon: ShieldCheck,
    title: "Safe & Reliable",
    text: "A clean, transparent experience with user trust and account safety at the center.",
  },
  {
    icon: TrendingUp,
    title: "Growth Focused",
    text: "We help users discover better opportunities and build confidence in digital earning.",
  },
];

const values = [
  "Simple user experience",
  "Clear communication",
  "Fast performance",
  "Trust-first platform",
];

export default function KroyKoriAboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#22c55e33,transparent_35%),radial-gradient(circle_at_bottom_right,#38bdf833,transparent_35%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200">
                <Sparkles size={16} /> About Kroykori
              </div>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Smart digital earning made simple for everyone.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                Kroykori is a modern platform designed to help users explore online opportunities, complete simple activities, and grow with a safe and easy digital experience.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-6 py-3 font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-300"
                >
                  Contact Us <ArrowRight size={18} />
                </a>
                <a
                  href="/"
                  className="inline-flex items-center rounded-full border border-white/15 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  Visit Home
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
                <div className="rounded-[1.5rem] bg-slate-900/80 p-6">
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Platform Mission</p>
                      <h2 className="mt-1 text-2xl font-bold">Earn. Learn. Grow.</h2>
                    </div>
                    <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-300">
                      <Users size={28} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {values.map((item) => (
                      <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/5 p-4">
                        <BadgeCheck className="text-emerald-300" size={22} />
                        <span className="text-slate-200">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/[0.07] p-6 backdrop-blur">
                <p className="text-3xl font-bold text-emerald-300">{stat.value}</p>
                <p className="mt-2 text-slate-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-20 text-slate-900 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-semibold text-emerald-600">Why we exist</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              We make digital opportunities easier to understand and access.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Our goal is to create a platform where users feel confident, supported, and motivated while using online services.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="mb-6 inline-flex rounded-2xl bg-emerald-100 p-4 text-emerald-700">
                    <Icon size={28} />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="mt-4 leading-7 text-slate-600">{feature.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 text-slate-900 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="font-semibold text-emerald-600">Our Promise</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              A smooth platform built around trust and simplicity.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              We believe digital earning should not feel complicated. Kroykori focuses on clean design, helpful information, and a user-first experience.
            </p>
          </div>

          <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-emerald-400 p-4 text-slate-950">
                <Clock3 size={30} />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Always improving</h3>
                <p className="mt-2 text-slate-300">We continue to improve features, performance, and support for our users.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
