function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="px-4 flex-1">{children}</main>
    </>
  );
}

export default ProtectedRoute;
