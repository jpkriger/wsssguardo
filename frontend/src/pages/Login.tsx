import { ReactElement } from "react";
import LoginForm from "@/components/LoginForm/LoginForm";

export default function Login(): ReactElement {
  return (
    <div className="flex items-center justify-center py-16 w-full">
      <LoginForm />
    </div>
  );
}
