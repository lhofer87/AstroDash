import { TabBar } from '@/app/components/ui/TabBar';

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="app-starfield" aria-hidden />
      <div className="app-shell-content min-h-screen pb-[calc(4rem+env(safe-area-inset-bottom))]">
        {children}
        <TabBar />
      </div>
    </>
  );
}
