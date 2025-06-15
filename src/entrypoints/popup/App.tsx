import { ThemeProvider } from "@/providers/ThemeProvider";
import Home from "@/screens/Home";

export default function App() {
  return (
    <ThemeProvider className="min-h-[350px] flex flex-col">
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    </ThemeProvider>
  );
}
