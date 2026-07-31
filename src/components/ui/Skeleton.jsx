import { motion } from 'framer-motion';

const shimmer = {
  hidden: { opacity: 0.3 },
  visible: { opacity: [0.3, 0.6, 0.3], transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } }
};

export function Skeleton({ className = '', style = {} }) {
  return (
    <motion.div
      variants={shimmer} initial="hidden" animate="visible"
      className={`rounded-xl bg-white/20 ${className}`}
      style={style}
    />
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`liquid-glass rounded-2xl p-5 ${className}`}>
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  );
}
