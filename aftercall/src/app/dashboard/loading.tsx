export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 w-48 rounded-lg bg-line" />
      <div className="h-16 rounded-2xl bg-line" />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="h-64 rounded-2xl bg-line" />
        <div className="h-64 rounded-2xl bg-line" />
        <div className="h-64 rounded-2xl bg-line" />
        <div className="h-64 rounded-2xl bg-line" />
        <div className="h-64 rounded-2xl bg-line" />
      </div>
    </div>
  );
}
