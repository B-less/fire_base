
import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * @deprecated This hook is deprecated and will be removed in a future version.
 * Use Tailwind's responsive prefixes for styling (`md:`, `lg:`, etc.) instead of this hook for layout changes.
 * This hook may still be used for JavaScript logic that specifically needs to know if the user is on a mobile device.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(mql.matches)
    }
    
    // Set the initial value
    onChange();

    mql.addEventListener("change", onChange)
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}

    