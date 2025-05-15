import { redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard-header";
import { ContactsList } from "@/components/contacts-list";
import { CallHistory } from "@/components/call-history";
import { UserProfile } from "@/components/user-profile";

export default function DashboardPage() {
  // Server-side auth check
  // const token = cookies().get("token")?.value
  // const token = localStorage.getItem("token");

  // if (!token) {
  //   redirect("/");
  // }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />
      <main className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <ContactsList />
            <CallHistory />
          </div>
          <div>
            <UserProfile />
          </div>
        </div>
      </main>
    </div>
  );
}
