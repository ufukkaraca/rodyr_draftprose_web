import { DemoControls } from "./components/DemoControls";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
        {children}
        <DemoControls />
    </>
  )
}
