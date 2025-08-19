/**
 * Hook para manejo responsive
 * Detecta el tamaño de pantalla y proporciona utilidades responsive
 */

import { useState, useEffect } from 'react'

interface BreakpointConfig {
  mobile: number
  tablet: number
  desktop: number
  xl: number
}

const DEFAULT_BREAKPOINTS: BreakpointConfig = {
  mobile: 768,   // md breakpoint de Tailwind
  tablet: 1024,  // lg breakpoint de Tailwind
  desktop: 1280, // xl breakpoint de Tailwind
  xl: 1536       // 2xl breakpoint de Tailwind
}

export type ScreenSize = 'mobile' | 'tablet' | 'desktop' | 'xl'

interface ResponsiveState {
  screenSize: ScreenSize
  width: number
  height: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isXl: boolean
  orientation: 'portrait' | 'landscape'
}

/**
 * Hook principal para detección responsive
 */
export function useResponsive(customBreakpoints?: Partial<BreakpointConfig>): ResponsiveState {
  const breakpoints = { ...DEFAULT_BREAKPOINTS, ...customBreakpoints }
  
  const [state, setState] = useState<ResponsiveState>(() => {
    // Valores por defecto para SSR
    if (typeof window === 'undefined') {
      return {
        screenSize: 'desktop',
        width: 1024,
        height: 768,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isXl: false,
        orientation: 'landscape'
      }
    }
    
    const width = window.innerWidth
    const height = window.innerHeight
    
    return calculateResponsiveState(width, height, breakpoints)
  })
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setState(calculateResponsiveState(width, height, breakpoints))
    }
    
    // Listener inicial
    handleResize()
    
    // Listener de redimensionamiento
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [breakpoints])
  
  return state
}

/**
 * Calcula el estado responsive basado en dimensiones
 */
function calculateResponsiveState(width: number, height: number, breakpoints: BreakpointConfig): ResponsiveState {
  let screenSize: ScreenSize = 'mobile'
  
  if (width >= breakpoints.xl) {
    screenSize = 'xl'
  } else if (width >= breakpoints.desktop) {
    screenSize = 'desktop'
  } else if (width >= breakpoints.tablet) {
    screenSize = 'tablet'
  } else {
    screenSize = 'mobile'
  }
  
  return {
    screenSize,
    width,
    height,
    isMobile: screenSize === 'mobile',
    isTablet: screenSize === 'tablet',
    isDesktop: screenSize === 'desktop',
    isXl: screenSize === 'xl',
    orientation: width > height ? 'landscape' : 'portrait'
  }
}

/**
 * Hook especializado para componentes de calendario
 */
export function useCalendarResponsive() {
  const responsive = useResponsive()
  
  return {
    ...responsive,
    // Configuraciones específicas para calendario
    shouldUseCompactMode: responsive.isMobile || responsive.isTablet,
    shouldUseMobileMode: responsive.isMobile,
    maxEmployeesOnMobile: responsive.isMobile ? 5 : 10,
    showPositions: !responsive.isMobile,
    showFullLegend: !responsive.isMobile,
    cellHeight: responsive.isMobile ? 'h-8' : 'h-10',
    fontSize: responsive.isMobile ? 'text-xs' : 'text-sm'
  }
}

/**
 * Hook para detección específica de mobile
 */
export function useIsMobile(threshold = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < threshold)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [threshold])
  
  return isMobile
}

/**
 * Hook para configuración responsive de grid
 */
export function useResponsiveGrid() {
  const responsive = useResponsive()
  
  return {
    ...responsive,
    gridCols: responsive.isMobile ? 1 : responsive.isTablet ? 2 : 3,
    gridClass: responsive.isMobile 
      ? 'grid-cols-1' 
      : responsive.isTablet 
        ? 'grid-cols-2' 
        : 'grid-cols-3',
    gap: responsive.isMobile ? 'gap-2' : 'gap-4'
  }
}

export default useResponsive