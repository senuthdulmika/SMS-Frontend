const Spinner = ({ full = false }: { full?: boolean }) => (
  <div className={`flex items-center justify-center ${full ? "h-screen" : "py-24"}`}>
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-ink-700 border-t-crimson-500" />
  </div>
)

export default Spinner
