import { createContext, useContext } from 'react';

/**
 * Context that provides the DOM element of the fixed nav footer,
 * so pages can portal their navigation buttons into it.
 */
export const NavFooterContext = createContext<HTMLDivElement | null>(null);

export const useNavFooter = (): HTMLDivElement | null => useContext(NavFooterContext);
