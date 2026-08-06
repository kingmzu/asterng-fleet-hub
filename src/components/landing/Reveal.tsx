import { useReveal } from '@/hooks/useReveal';
import { cn } from '@/lib/utils';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'section' | 'li';
}

const Reveal = ({ children, className, delay = 0, as = 'div' }: RevealProps) => {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const Tag = as as any;
  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        'transition-all duration-700 ease-out',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
        className
      )}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
