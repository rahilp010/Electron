import React from 'react';
import { motion } from 'framer-motion';

const Loader = () => {
   return (
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center backdrop-blur-xs z-50">
         <div className="flex items-end gap-3">
            {[...Array(3)].map((_, index) => (
               <motion.div
                  key={index}
                  className="w-4 h-4 bg-amber-400 rounded-full shadow-lg"
                  animate={{
                     y: [0, -15, 0 ],
                     //  scale: [1, 1.2, 1],
                     boxShadow: [
                        '0px 0px 0px rgba(0,0,0,0)',
                        '0px 5px 15px rgba(0,0,0,0.2)',
                        '0px 0px 0px rgba(0,0,0,0)',
                     ],
                  }}
                  transition={{
                     duration: 1,
                     ease: 'easeInOut',
                     repeat: Infinity,
                     delay: index * 0.2
                  }}
               />
            ))}
         </div>
      </div>
   );
};

export default Loader;
