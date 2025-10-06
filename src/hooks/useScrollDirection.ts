import { useState, useEffect } from 'react';

type ScrollDirection = 'up' | 'down' | 'top';

interface UseScrollDirectionOptions {
  threshold?: number;
  enabled?: boolean;
}

/**
 * Hook personalizado para detectar la dirección del scroll
 * @param threshold - Píxeles que debe moverse antes de detectar cambio (default: 10)
 * @param enabled - Si el hook está habilitado (default: true)
 * @returns La dirección actual del scroll: 'up', 'down' o 'top'
 */
export function useScrollDirection({ 
  threshold = 10, 
  enabled = true 
}: UseScrollDirectionOptions = {}): ScrollDirection {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>('top');

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    
    let lastScroll = window.scrollY;
    let ticking = false;

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;

      // Si estamos en el top de la página
      if (scrollY < 10) {
        setScrollDirection('top');
        lastScroll = scrollY;
        ticking = false;
        return;
      } 
      
      // Verificar si hemos superado el threshold
      if (Math.abs(scrollY - lastScroll) < threshold) {
        ticking = false;
        return;
      }

      // Determinar dirección basada en el scroll
      const direction = scrollY > lastScroll ? 'down' : 'up';
      setScrollDirection(direction);
      lastScroll = scrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    // Inicializar
    updateScrollDirection();
    
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [threshold, enabled]);

  return scrollDirection;
}
