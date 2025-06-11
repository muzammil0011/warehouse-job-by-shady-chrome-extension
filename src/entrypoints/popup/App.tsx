import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import Home from "@/screens/Home";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider className="min-h-[350px] flex flex-col">
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
        {/* <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
             Catch all route 
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Router> */}
      </ThemeProvider>
    </AuthProvider>
  );
}
