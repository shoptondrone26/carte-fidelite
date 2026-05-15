import type { Metadata } from "next";

import { SignupForm } from "./signup-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inscription",
};

export default function SignupPage() {
  return <SignupForm />;
}
