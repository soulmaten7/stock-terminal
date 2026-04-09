export default function LoadingSkeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-dark-600 rounded ${className}`} />;
}
