import { BrowserRouter as Router } from 'react-router-dom'
import AppRoutes from './routes'
import { BackgroundProvider } from './context/BackgroundContext'
import { AudioPlayerProvider } from './context/AudioPlayerContext'
import DynamicStyles from './components/DynamicStyles'
import { ROUTER_BASENAME } from './lib/paths'

export default function App() {
  return (
    <Router basename={ROUTER_BASENAME}>
      <BackgroundProvider>
        {/* Above <AppRoutes />, so the single <audio> element it owns never
            unmounts on navigation. Inside <Router>, because the mini player
            reads the current route to hide itself on the homepage. */}
        <AudioPlayerProvider>
          <DynamicStyles />
          <AppRoutes />
        </AudioPlayerProvider>
      </BackgroundProvider>
    </Router>
  )
}
