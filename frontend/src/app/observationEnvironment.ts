import { allowsObservationDemo } from './observationMode'

export const observationDemoEnabled = import.meta.env.DEV && allowsObservationDemo(true, import.meta.env.VITE_ASSISTANCE_DEMO, window.location.hostname)
