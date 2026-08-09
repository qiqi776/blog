import { BrowserRouter as Router } from 'react-router-dom'
import AppRoutes from './routes'
import { BackgroundProvider } from './context/BackgroundContext'
import DynamicStyles from './components/DynamicStyles'
import { ROUTER_BASENAME } from './lib/paths'

export default function App() {
  return (
    <Router basename={ROUTER_BASENAME}>
      <BackgroundProvider>
        <DynamicStyles />
        <AppRoutes />
      </BackgroundProvider>
    </Router>
  )
}
