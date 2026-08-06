export function getRoleHomePath(role) {
  const normalized = (role || '').toUpperCase()
  if (normalized === 'ADMIN') {
    return '/admin'
  }
  if (normalized === 'INSTRUCTOR' || normalized === 'TEACHER') {
    return '/teacher'
  }
  return '/student'
}
