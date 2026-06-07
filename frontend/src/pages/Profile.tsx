import { type ReactElement, useState } from "react";
import ProfileForm from "@/components/Profile/ProfileForm";
import ChangePasswordCard from "@/components/Profile/ChangePasswordCard";

export default function Profile(): ReactElement {
    const [showChange, setShowChange] = useState(false);

    return (
        <div className="w-full flex-1 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center px-4 py-10">
                <div className="w-full flex flex-col items-center gap-4">
                    {!showChange ? (
                        <>
                            <ProfileForm onChangePassword={() => setShowChange(true)} />
                        </>
                    ) : (
                        <>
                            <ChangePasswordCard />
                            <button
                                onClick={() => setShowChange(false)}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors mt-2"
                            >
                                ← Voltar
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
