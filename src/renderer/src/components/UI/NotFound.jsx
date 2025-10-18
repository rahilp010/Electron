/* eslint-disable prettier/prettier */
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import notFound from '../../assets/notFound.png'

const NotFound = () => {
  const navigate = useNavigate()

  // 1. Page Entrance Animation (for the whole container)
  const pageVariants = {
    initial: { opacity: 0, y: 50 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -50 }
  }

  // 2. Floating Animation (for the icon)
  const floatTransition = {
    duration: 3,
    repeat: Infinity,
    repeatType: 'reverse',
    ease: 'easeInOut'
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={{ duration: 0.5 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        textAlign: 'center',
        padding: '20px'
      }}
    >
      {/* Animated Floating Element */}
      <motion.span
        animate={{ y: [0, -20, 0] }} // Animate the Y position: up 20px, then back down
        transition={floatTransition}
        style={{ fontSize: '6rem', marginBottom: '20px', display: 'block' }}
      >
        <img src={notFound} alt="Not Found" className="w-96 h-72" />
      </motion.span>

      {/* Animated Button */}
      <motion.button
        whileHover={{ scale: 1.05, boxShadow: '0 0 8px rgba(0,0,0,0.2)' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/')}
        className="border-[#5b94b9] border bg-gradient-to-b from-[#5b94b9] to-[#6fb6e0] hover:bg-gradient-to-b hover:from-[#6fb6e0] hover:to-[#5b94b9] text-white font-bold py-2 px-4 rounded cursor-pointer"
      >
        Go to Home
      </motion.button>
    </motion.div>
  )
}

export default NotFound
