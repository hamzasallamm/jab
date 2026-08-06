import { Navigate, Route, Routes, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { NavMenu } from './components/NavMenu'
import { Login } from './pages/Login'
import { SignupChoice } from './pages/SignupChoice'
import { SignupFighter } from './pages/SignupFighter'
import { SignupGym } from './pages/SignupGym'
import { Profile } from './pages/Profile'
import { Fighters } from './pages/Fighters'
import { Gyms } from './pages/Gyms'
import { Connections } from './pages/Connections'

function Nav() {
  return (
    <nav className="flex items-center justify-between border-b border-steel px-6 py-4">
      <Link to="/" className="font-display text-2xl tracking-widest text-jab">
        JAB
      </Link>
      <NavMenu />
    </nav>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth()
  if (loading) return <p className="mt-16 text-center text-steel-light">Loading...</p>
  if (!me) return <Navigate to="/login" replace />
  return <>{children}</>
}

function Home() {
  const { me } = useAuth()
  return (
    <div className="mx-auto mt-24 max-w-2xl px-4 text-center">
      <h1 className="font-display text-6xl">
        Train. Connect. <span className="text-jab">Compete.</span>
      </h1>
      <p className="mt-4 text-steel-light">The network for combat sports athletes and gyms.</p>
      {!me && (
        <Link
          to="/signup"
          className="mt-8 inline-block font-display text-lg rounded bg-jab px-8 py-3 tracking-wide hover:bg-jab-dark"
        >
          Get Started
        </Link>
      )}
    </div>
  )
}

function AppRoutes() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignupChoice />} />
        <Route path="/signup/fighter" element={<SignupFighter />} />
        <Route path="/signup/gym" element={<SignupGym />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gyms"
          element={
            <ProtectedRoute>
              <Gyms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fighters"
          element={
            <ProtectedRoute>
              <Fighters />
            </ProtectedRoute>
          }
        />
        <Route
          path="/connections"
          element={
            <ProtectedRoute>
              <Connections />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
