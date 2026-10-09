import React, { forwardRef, useCallback, useEffect, useLayoutEffect, useRef } from 'react';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function makeFigure(name, mount) {
  return forwardRef(function Hairline(props, ref) {
    const { intensity = 0.5, theme = 'auto', label, onRead, play = false, style, className, ...attrs } = props;
    const named = label ?? props['aria-label'];
    
    const el = useRef(null);
    const figure = useRef(null);
    const read = useRef(onRead);

    const set = useCallback((node) => {
      el.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    }, [ref]);

    useIsoLayoutEffect(() => {
      read.current = onRead;
    });

    useIsoLayoutEffect(() => {
      if (!el.current) return;
      const f = mount({ 
        stage: el.current, 
        svg: el.current, 
        read: { textContent: '' } 
      }, intensity);
      
      figure.current = f;
      return () => {
        if (f && f.destroy) f.destroy();
      };
    }, [intensity, theme, named, play]);

    return (
      <svg
        ref={set}
        viewBox="0 0 400 320"
        className={`hairline ${theme} ${className || ''}`}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'visible',
          fill: 'none',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          ...style
        }}
        {...attrs}
      />
    );
  });
}
