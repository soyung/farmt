// src/hooks/useIcons.js
import useImage from 'use-image';
import treePNG  from '../assets/icons/tree.png';
import bugPNG   from '../assets/icons/bug.png';
import clockPNG from '../assets/icons/clock.png';

export default function useIcons() {
  const [tree]  = useImage(treePNG);
  const [bug]   = useImage(bugPNG);
  const [clock] = useImage(clockPNG);
  return { tree, bug, clock };
}
