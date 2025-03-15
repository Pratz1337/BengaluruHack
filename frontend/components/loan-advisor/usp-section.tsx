"use client"

import { motion } from "framer-motion"
import { BarChart4, Users, Zap, Target } from "lucide-react"

export default function UspSection() {
  const usps = [
    {
      icon: <BarChart4 className="h-12 w-12 text-cyan-500 dark:text-cyan-400" />,
      title: "Comparison Engine",
      description:
        "Compare rates from multiple lenders side-by-side in real-time to find the best deal for your specific needs.",
      delay: 0.1,
    },
    {
      icon: <Target className="h-12 w-12 text-indigo-500 dark:text-indigo-400" />,
      title: "Financial Goal Setting & Progress Tracking",
      description:
        "Set financial goals, track your progress, and receive tailored loan advice to support your financial journey.",
      delay: 0.2,
    },
    {
      icon: <Users className="h-12 w-12 text-purple-500 dark:text-purple-400" />,
      title: "Community Section",
      description:
        "Connect with others, share experiences, and get reinforcement on financial advice through community discussions.",
      delay: 0.3,
    },
    {
      icon: <Zap className="h-12 w-12 text-pink-500 dark:text-pink-400" />,
      title: "Emergency Financial Advice",
      description:
        "Get urgent guidance on the quickest loan options available when you need funds in an emergency situation.",
      delay: 0.4,
    },
  ]

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Modern mesh gradient background */}
      <div className="absolute inset-0 bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-cyan-100 via-indigo-50 to-white dark:from-cyan-950 dark:via-indigo-950 dark:to-gray-900"></div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-cyan-300/10 to-indigo-500/10 dark:from-cyan-300/5 dark:to-indigo-500/5"
            style={{
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              filter: "blur(40px)",
            }}
            animate={{
              x: [0, Math.random() * 50 - 25],
              y: [0, Math.random() * 50 - 25],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 dark:from-cyan-500/10 dark:to-indigo-500/10 backdrop-blur-sm border border-cyan-500/30"
          >
            <span className="text-sm font-medium bg-gradient-to-r from-cyan-500 to-indigo-600 bg-clip-text text-transparent">
              Unique Advantages
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 dark:from-cyan-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent"
          >
            What Makes Us Different
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            Our unique features provide an unparalleled financial assistance experience
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <motion.div
              className="relative mx-auto max-w-md lg:max-w-none"
              whileHover={{ rotate: 2, transition: { duration: 0.3 } }}
            >
              <motion.div
                initial={{ y: 0 }}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, repeatType: "loop", ease: "easeInOut" }}
                className="aspect-square rounded-2xl overflow-hidden shadow-2xl border-8 border-white dark:border-gray-700"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/90 via-indigo-600/90 to-purple-600/90 flex items-center justify-center">
                  <div className="text-white text-center p-8">
                    <motion.h3
                      initial={{ opacity: 0, y: -20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="text-3xl font-bold mb-4 relative inline-block"
                    >
                      FinMate
                      <motion.span
                        className="absolute -bottom-2 left-0 w-full h-1 bg-white rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: "100%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                      />
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="text-lg opacity-90 mb-6"
                    >
                      Powered by advanced AI to understand your unique financial situation
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      className="grid grid-cols-2 gap-4 max-w-xs mx-auto"
                    >
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/10"
                      >
                        <div className="text-3xl font-bold">30+</div>
                        <div className="text-sm">Languages</div>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/10"
                      >
                        <div className="text-3xl font-bold">24/7</div>
                        <div className="text-sm">Availability</div>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/10"
                      >
                        <div className="text-3xl font-bold">100+</div>
                        <div className="text-sm">Lenders</div>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/10"
                      >
                        <div className="text-3xl font-bold">5M+</div>
                        <div className="text-sm">Users</div>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-cyan-400/30 to-indigo-500/30 dark:from-cyan-400/20 dark:to-indigo-500/20 rounded-full backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="absolute -top-6 -left-6 w-24 h-24 bg-gradient-to-br from-indigo-400/30 to-purple-500/30 dark:from-indigo-400/20 dark:to-purple-500/20 rounded-full backdrop-blur-md"
              />
            </motion.div>
          </motion.div>

          <div className="space-y-8">
            {usps.map((usp, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: usp.delay }}
                whileHover={{ x: 10, transition: { duration: 0.2 } }}
                className="flex gap-6 group"
              >
                <div className="flex-shrink-0 mt-1 relative">
                  <motion.div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-indigo-500/20 rounded-full blur-xl transform scale-0 group-hover:scale-150 transition-all duration-500" />
                  {usp.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-500 group-hover:to-indigo-600 dark:group-hover:from-cyan-400 dark:group-hover:to-indigo-500 transition-all duration-300">
                    {usp.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
                    {usp.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

