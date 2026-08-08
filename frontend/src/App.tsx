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
import { Home } from './pages/Home'
import { Sparring } from './pages/Sparring'
import { FighterProfilePage } from './pages/FighterProfilePage'
import { Messages } from './pages/Messages'
import { MessageThread } from './pages/MessageThread'

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
          path="/fighters/:userId"
          element={
            <ProtectedRoute>
              <FighterProfilePage />
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
        <Route
          path="/sparring"
          element={
            <ProtectedRoute>
              <Sparring />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/:userId"
          element={
            <ProtectedRoute>
              <MessageThread />
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
