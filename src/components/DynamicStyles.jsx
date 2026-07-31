import { useEffect } from 'react';
import { useBackground } from '../context/BackgroundContext';

export default function DynamicStyles() {
  const { getCssVariables, getBackgroundStyle } = useBackground();
  const cssVariables = getCssVariables();
  const bgStyle = getBackgroundStyle();

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    document.body.style.background = bgStyle.background;

    return () => {
      Object.keys(cssVariables).forEach(key => root.style.removeProperty(key));
    };
  }, [cssVariables, bgStyle]);

  return null;
}
