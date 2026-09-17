import React from "react";
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, Facebook, Headphones } from "lucide-react";

const contactInfo = [
  {
    icon: Phone,
    title: "Call Us",
    value: "01635-129195",
    text: "Sat - Thu, 10:00 AM - 7:00 PM",
  },
  {
    icon: Mail,
    title: "Email Us",
    value: "support@Kroykori.com",
    text: "We reply as soon as possible",
  },
  {
    icon: MapPin,
    title: "Location",
    value: "Badda Link Road, Dhaka",
    text: "Online support available nationwide",
  },
];

export default function KroyKoriContactPage() {
  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <section className="relative overflow-hidden px-6 py-20 lg:px-8">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-5 py-2 text-sm font-semibold text-emerald-300">
              <Headphones size={16} /> Contact Kroykori
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Need help? We are here for you.
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-300">
              Have questions about Kroykori, account support, payment, or any service issue? Send us a message and our team will contact you soon.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {contactInfo.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-white/10 bg-white/[0.07] p-7 text-center shadow-xl backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.1]"
                >
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950">
                    <Icon size={28} />
                  </div>
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="mt-3 font-semibold text-emerald-300">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-400">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur">
            <h2 className="text-3xl font-bold">Let’s talk</h2>
            <p className="mt-4 leading-7 text-slate-300">
              Fill out the form and tell us what you need. Our support team will review your message carefully.
            </p>

            <div className="mt-8 space-y-5">
              <div className="flex gap-4 rounded-2xl bg-white/[0.06] p-5">
                <MessageCircle className="mt-1 text-emerald-300" />
                <div>
                  <h4 className="font-bold">Quick Support</h4>
                  <p className="mt-1 text-sm text-slate-400">For account, earning, payment, and general questions.</p>
                </div>
              </div>

              <div className="flex gap-4 rounded-2xl bg-white/[0.06] p-5">
                <Clock className="mt-1 text-emerald-300" />
                <div>
                  <h4 className="font-bold">Response Time</h4>
                  <p className="mt-1 text-sm text-slate-400">Usually within 24 hours on working days.</p>
                </div>
              </div>

              <div className="flex gap-4 rounded-2xl bg-white/[0.06] p-5">
                <Facebook className="mt-1 text-emerald-300" />
                <div>
                  <h4 className="font-bold">Social Media</h4>
                  <p className="mt-1 text-sm text-slate-400">Connect with us on Facebook for latest updates.</p>
                </div>
              </div>
            </div>
          </div>

          <form className="rounded-[2rem] bg-white p-8 text-slate-900 shadow-2xl">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Your Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Phone Number</label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Subject</label>
              <input
                type="text"
                placeholder="How can we help?"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Message</label>
              <textarea
                rows="6"
                placeholder="Write your message here..."
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <button
              type="submit"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:-translate-y-0.5 hover:bg-emerald-600"
            >
              Send Message <Send size={18} />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
