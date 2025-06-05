// src/hooks/useIcons.js
import useImage from 'use-image';
import treeSVG  from '../assets/icons/tree.svg';
import bugSVG   from '../assets/icons/bug.svg';
import clockSVG from '../assets/icons/clock.svg';

export default function useIcons() {
  const [tree]  = useImage(treeSVG);
  const [bug]   = useImage(bugSVG);
  const [clock] = useImage(clockSVG);
  return { tree, bug, clock };
}
