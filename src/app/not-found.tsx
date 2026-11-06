import AppErrorView from "@/components/system/app-error-view";

export default function NotFound() {
  return (
    <AppErrorView
      code="404"
      title="Page not found"
      description="The page you are looking for may have been moved, deleted, or the address may be incorrect."
      showDashboard={false}
    />
  );
}
