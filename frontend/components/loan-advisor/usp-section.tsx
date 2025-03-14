"use client"

import { motion } from "framer-motion"
import { BarChart4, Users, Zap, Target } from "lucide-react"

export default function UspSection() {
  const usps = [
    {
      icon: <BarChart4 className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />,
      title: "Comparison Engine",
      description:
        "Compare rates from multiple lenders side-by-side in real-time to find the best deal for your specific needs.",
    },
    {
      icon: <Target className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />,
      title: "Financial Goal Setting & Progress Tracking",
      description:
        "Set financial goals, track your progress, and receive tailored loan advice to support your financial journey.",
    },
    {
      icon: <Users className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />,
      title: "Community Section",
      description:
        "Connect with others, share experiences, and get reinforcement on financial advice through community discussions.",
    },
    {
      icon: <Zap className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />,
      title: "Emergency Financial Advice",
      description:
        "Get urgent guidance on the quickest loan options available when you need funds in an emergency situation.",
    },
  ]

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg className="w-full h-full text-purple-600 dark:text-purple-400" viewBox="0 0 696 316" fill="none">
          <path
            d="M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeOpacity="0.1"
            transform="scale(-1, 1) translate(-696, 0)"
          />
        </svg>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
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
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl border-8 border-white dark:border-gray-700">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 to-purple-600/90 flex items-center justify-center">
                  <div className="text-white text-center p-8">
                    <h3 className="text-3xl font-bold mb-4">FinMate</h3>
                    <p className="text-lg opacity-90 mb-6">
                      Powered by advanced AI to understand your unique financial situation
                    </p>
                    <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                        <div className="text-3xl font-bold">30+</div>
                        <div className="text-sm">Languages</div>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                        <div className="text-3xl font-bold">24/7</div>
                        <div className="text-sm">Availability</div>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                        <div className="text-3xl font-bold">100+</div>
                        <div className="text-sm">Lenders</div>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                        <div className="text-3xl font-bold">5M+</div>
                        <div className="text-sm">Users</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-indigo-100 dark:bg-indigo-900/50 rounded-full"></div>
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-purple-100 dark:bg-purple-900/50 rounded-full"></div>
            </div>
          </motion.div>

          <div className="space-y-8">
            {usps.map((usp, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex gap-6"
              >
                <div className="flex-shrink-0 mt-1">{usp.icon}</div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{usp.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{usp.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

