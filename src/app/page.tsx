"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Database, BarChart3, Map, Sparkles } from "lucide-react";
import { AnimatedGlobe } from "@/components/AnimatedGlobe";

const features = [
  {
    icon: Map,
    title: "Interactive Maps",
    description: "Explore global climate patterns with zoomable, hover-enabled heatmaps.",
  },
  {
    icon: BarChart3,
    title: "Time Series Analysis",
    description: "Track temperature, precipitation, and wind trends over decades.",
  },
  {
    icon: Database,
    title: "Multiple Datasets",
    description: "ERA5, NASA, NOAA — compare and analyze diverse climate sources.",
  },
  {
    icon: Sparkles,
    title: "AI Insights",
    description: "Get data-driven climate insights and impact simulations.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 -z-10 bg-[#020617]">
        <AnimatedGlobe isBackground />
        
        {/* Subtle atmospheric glow */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(56, 189, 248, 0.15), transparent)",
          }}
        />
        
        {/* Dark vignette for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(2,6,23,0.8)_100%)]" />
        
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:6rem_6rem]" />
      </div>

      {/* Hero */}
      <section className="min-h-[90vh] flex flex-col items-center justify-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-block px-4 py-2 rounded-full glass text-cyan-400/90 text-sm font-medium mb-6"
          >
            Explore Earth's Climate
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight"
          >
            <span className="gradient-text">Explore Earth's Climate</span>
            <br />
            <span className="text-slate-200">Through Data</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto"
          >
            Beautiful, interactive visualizations of global climate data.
            Discover trends, compare periods, and understand our changing planet.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap justify-center gap-4 mt-10"
          >
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold shadow-lg shadow-cyan-500/25 flex items-center gap-2"
              >
                Explore Climate Data
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <Link href="/datasets">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 rounded-xl glass border border-slate-600/50 text-slate-200 font-semibold flex items-center gap-2"
              >
                View Datasets
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 2 }}
          className="mt-16 w-full max-w-xl text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-cyan-200 tracking-wide uppercase">Real-time Climate Analysis</span>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-16"
        >
          <span className="gradient-text">ClimateLens</span> Features
        </motion.h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl glass-card border border-slate-700/30 hover:border-cyan-500/20 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-12 rounded-3xl glass-card border border-cyan-500/20"
        >
          <h3 className="text-2xl font-bold mb-4">
            Ready to explore climate data?
          </h3>
          <p className="text-slate-400 mb-8">
            Start with the dashboard or dive into our curated datasets.
          </p>
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-semibold"
            >
              Open Dashboard
            </motion.button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
