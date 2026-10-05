import { useState, useEffect, useCallback } from 'react'

interface GeolocationState {
  lat: number | null
  lng: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
}

export function useGeolocation(watch = false) {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    accuracy: null,
    error: null,
    loading: true,
  })

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    setState({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      error: null,
      loading: false,
    })
  }, [])

  const handleError = useCallback((err: GeolocationPositionError) => {
    setState((s) => ({ ...s, error: err.message, loading: false }))
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation not supported', loading: false }))
      return
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    }

    if (watch) {
      const id = navigator.geolocation.watchPosition(handleSuccess, handleError, options)
      return () => navigator.geolocation.clearWatch(id)
    } else {
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options)
    }
  }, [watch, handleSuccess, handleError])

  return state
}
