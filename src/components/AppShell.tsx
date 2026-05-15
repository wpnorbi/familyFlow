"use client";

import { usePathname } from "next/navigation";
import SideNav from "@/components/SideNav";

const SHELLLESS_ROUTES = new Set(["/login"]);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shellless = pathname ? SHELLLESS_ROUTES.has(pathname) : false;

  if (shellless) {
    return <main className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden">{children}</main>;
  }

  return (
    <>
      <SideNav />
      <main className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden md:ml-55">
        {children}
      </main>
    </>
  );
}
