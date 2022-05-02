import { useEffect, useRef, useState } from 'react'

export const useSubLoad = (
  containerSelector: string,
  handleLoading = false
) => {
  const [loaded, setLoaded] = useState(false)
  const elRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const { isIntersecting } = entry
          if (isIntersecting) {
            setLoaded(true)

            if (handleLoading === false) {
              observer.disconnect()
            }
          } else if (handleLoading) {
            setLoaded(false)
          }
        })
      },
      {
        root: document.querySelector(containerSelector),
        // rootMargin: "0px 0px 100px 0px"
      }
    )

    console.log(elRef)
    observer.observe(elRef.current)
  }, [])

  return [loaded, elRef]
}
