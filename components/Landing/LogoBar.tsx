"use client";

import { motion } from "framer-motion";
import { Users, FileCheck, Star, TrendingUp } from "lucide-react";

const stats = [
  { icon: FileCheck, value: "+2.500", label: "análises realizadas" },
  { icon: Users, value: "+350", label: "advogados cadastrados" },
  { icon: TrendingUp, value: "98%", label: "de satisfação" },
  { icon: Star, value: "4.9/5", label: "avaliação média" },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
} as const;

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function LogoBar() {
  return (
    <section className="border-b border-slate-100 bg-white py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-8 text-center text-xs font-medium uppercase tracking-widest text-slate-400 sm:mb-10 sm:text-sm"
        >
          Confiado por advogados em todo o Brasil
        </motion.p>

        <motion.div
          className="grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                className="flex flex-col items-center gap-2 text-center"
              >
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon size={24} />
                </div>
                <span className="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
                  {stat.value}
                </span>
                <span className="text-sm text-slate-500">{stat.label}</span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
