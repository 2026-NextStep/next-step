import { Navigate } from 'react-router-dom'
import { getToken } from '../../utils/authUtils'

export default function PrivateRoute({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />
}