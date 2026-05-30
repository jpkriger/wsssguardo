import { ReactElement } from "react";
import { useLocation } from "react-router";
import MFAVerificationForm from "@/components/MFAVerificationForm/MFAVerificationForm";

interface LocationState {
  email: string;
  secret: string;
}

export default function MFAVerification(): ReactElement {
  const location = useLocation();
  const state = location.state as LocationState | null;

  const email = state?.email ?? "usuario@wsssguardo.com";
  const secret = state?.secret ?? "JBSWY3DPEHPK3PXP";

  return (
    <div className="flex items-center justify-center py-16 w-full">
      <MFAVerificationForm email={email} secret={secret} />
    </div>
  );
}
