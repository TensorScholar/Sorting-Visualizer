import React from 'react';
import { motion } from 'framer-motion';

/**
 * Educational Panel Component
 * 
 * Provides interactive tutorials and educational content
 * for learning sorting algorithms and their properties.
 * 
 * @author Mohammad Atashi
 * @version 2.0.0
 */

const EducationalPanel: React.FC = () => {
  return (
    <motion.div
      className="w-full h-full flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Educational Tutorials</h2>
        <p className="text-gray-400">Coming soon - Interactive tutorials and educational content for algorithm learning</p>
      </div>
    </motion.div>
  );
};

export default EducationalPanel;
