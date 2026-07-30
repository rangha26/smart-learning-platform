import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/layouts/AppLayout'
import { CoursesPage } from '@/pages/CoursesPage'
import { HomePage } from '@/pages/HomePage'
import { StudentsPage } from '@/pages/StudentsPage'

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route element={<HomePage />} path="/" />
          <Route element={<CoursesPage />} path="/courses" />
          <Route element={<StudentsPage />} path="/students" />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}

export default App
