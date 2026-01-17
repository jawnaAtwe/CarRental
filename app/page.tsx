"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@heroui/button";
import { GithubIcon } from "@/components/icons";

export default function Home() {
  const heroCars = [
    {
      src: "https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=800&q=80",
      title: "Luxury Sedan",
      desc: "Refined comfort with elegant design.",
    },
    {
      src: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
      title: "Sport Performance",
      desc: "Power, speed, and pure excitement.",
    },
    {
      src: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=800&q=80",
      title: "SUV & Family",
      desc: "Space, safety, and long-trip confidence.",
    },
  ];

  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
   <div className="relative min-h-screen w-full bg-white dark:bg-[#0B0F1A]">
      {/* Glow background */}
      <div className="absolute inset-0">
       <div className="absolute -top-40 -left-40 w-[35rem] h-[35rem] bg-indigo-400/20 rounded-full blur-[120px] dark:bg-indigo-600/20" />
         <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-amber-200/20 rounded-full blur-[120px] dark:bg-amber-400/20" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 py-20">
 <h1 className="text-center text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
  <span className="block text-amber-400 uppercase tracking-[0.3em]">
    AL RATEB
  </span>
  <span className="block bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
    Car Rental
  </span>
</h1>



      <p className="text-center text-lg max-w-2xl mb-16 text-slate-800 dark:text-slate-300">
  Premium car rental solutions — luxury sedans, sports cars, and powerful
  SUVs. Flexible plans, competitive pricing, and exceptional service.
</p>


        {/* Cars */}
        <div className="relative flex justify-center gap-8 h-[32rem]">
          {heroCars.map((item, idx) => (
            <motion.div
              key={idx}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: idx * 0.25 }}
            >
              <motion.div
                className="
                  relative rounded-3xl overflow-hidden
                  backdrop-blur-xl bg-white/5
                  border border-white/10
                  shadow-[0_20px_80px_rgba(0,0,0,0.6)]
                "
                style={{
                  filter:
                    activeIdx !== null && activeIdx !== idx
                      ? "blur(3px) brightness(0.6)"
                      : "none",
                  zIndex: activeIdx === idx ? 50 : 10,
                }}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
                whileHover={{
                  scale: 1.25,
                  rotateY: 6,
                  rotateX: 3,
                }}
                transition={{ type: "spring", stiffness: 120 }}
              >
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-72 h-80 object-cover"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </motion.div>

              {/* Text */}
             <div className="mt-5 text-center">
  <h3 className="text-xl font-semibold text-black dark:text-white">
    {item.title}
  </h3>
  <p className="text-sm mt-1 text-gray-600 dark:text-slate-400">
    {item.desc}
  </p>
</div>

            </motion.div>
          ))}
        </div>

        {/* Buttons */}
        <div className="mt-20 flex flex-wrap gap-6">
          <Button
            size="lg"
         className="
  bg-gradient-to-r from-amber-400 to-amber-600
  dark:from-amber-600 dark:to-amber-800
  text-black dark:text-white
  font-semibold
  shadow-[0_10px_40px_rgba(245,158,11,0.4)]
  dark:shadow-[0_10px_40px_rgba(245,158,11,0.6)]
"

          >
            Book Your Car
          </Button>

          <Button
            size="lg"
            variant="bordered"
            startContent={<GithubIcon />}
      className="
  border-black text-black           /* النهار: أسود */
  dark:border-gray-400 dark:text-gray-200  /* الليل */
  hover:bg-black/10 dark:hover:bg-gray-700/30
  transition
"


          >
            View Fleet
          </Button>
        </div>
      </div>
    </div>
  );
}
