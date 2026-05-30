import { ReactElement } from "react";
import MFAForm from "@/components/MFAForm/MFAForm";

export default function MFAChallenge(): ReactElement {
  return (
    <div className="flex items-center justify-center py-16 w-full">
      <MFAForm />
    </div>
  );
}
