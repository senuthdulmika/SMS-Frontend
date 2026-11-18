import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import type { ReactNode } from "react"

import Layout from "../components/Layout"
import Spinner from "../components/Spinner"
import DataProvider from "../context/DataContext"
import useAuth from "../hooks/useAuth"

import Login from "../pages/Login"
import Register from "../pages/Register"
import Dashboard from "../pages/Dashboard"
import Tasks from "../pages/Tasks"
import Board from "../pages/Board"
import CalendarPage from "../pages/CalendarPage"
import Focus from "../pages/Focus"
import Subjects from "../pages/Subjects"
import Admin from "../pages/Admin"

type RequireAuthTypes = {
  children: ReactNode
  roles?: string[]
}

const RequireAuth = ({ children, roles }: RequireAuthTypes) => {
  const { user, loading } = useAuth()

  if (loading) return <Spinner full />
  if (!user) return <Navigate to="/login" replace />

  if (roles && !roles.some((role) => user.roles.includes(role)))
    return (
      <div className="py-24 text-center">
        <h2 className="heading mb-2 text-2xl font-bold">Access Denied</h2>
        <p className="text-ink-300">You do not have permission to view this page.</p>
      </div>
    )

  return <>{children}</>
}

// logged-in users do not need the login / register screens
const PublicOnly = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth()
  if (loading) return <Spinner full />
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />

        {/* Protected (after login) — one shell, shared data store */}
        <Route
          element={
            <RequireAuth>
              <DataProvider>
                <Layout />
              </DataProvider>
            </RequireAuth>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/board" element={<Board />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/focus" element={<Focus />} />
          <Route path="/subjects" element={<Subjects />} />

          {/* ADMIN only */}
          <Route path="/admin" element={<RequireAuth roles={["ADMIN"]}><Admin /></RequireAuth>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
