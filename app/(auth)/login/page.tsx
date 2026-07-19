import LoginPage from "@/components/auth/authContainer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agency Authentication",
  description: "Business Operating System for Service Agencies",
};
const page = () => {
  return (
    <div>
      <LoginPage />
    </div>
  );
};

export default page;
