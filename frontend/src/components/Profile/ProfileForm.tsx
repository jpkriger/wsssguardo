import { type ReactElement, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/api/account";
import { ApiErrorResponse } from "@/api/errors";
import { AUTH_EMAIL_KEY } from "@/lib/api-client";
import { toast } from "sonner";

interface ProfileFormProps {
    onChangePassword: () => void;
}

export default function ProfileForm({ onChangePassword }: ProfileFormProps): ReactElement {
    const { user, refreshUser } = useAuth();
    const [firstName, setFirstName] = useState(user?.firstName ?? "");
    const [lastName, setLastName] = useState(user?.lastName ?? "");
    const [email, setEmail] = useState(user?.email ?? "");
    const [loading, setLoading] = useState(false);

    if (!user) return <div />;

    const firstNameTrim = firstName.trim();
    const lastNameTrim = lastName.trim();
    const emailTrim = email.trim();
    const nameChanged = firstNameTrim !== (user.firstName ?? "") || lastNameTrim !== (user.lastName ?? "");
    const emailChanged = emailTrim !== (user.email ?? "");
    const hasChanges = nameChanged || emailChanged;

    async function handleSave(e?: React.FormEvent): Promise<void> {
        e?.preventDefault();
        if (!hasChanges) return;
        if (firstNameTrim === "") {
            toast.error("O nome não pode ficar vazio");
            return;
        }
        if (emailChanged && emailTrim === "") {
            toast.error("O e-mail não pode ficar vazio");
            return;
        }
        setLoading(true);
        try {
            await updateProfile({ firstName: firstNameTrim, lastName: lastNameTrim, email: emailTrim });
            if (emailChanged) localStorage.setItem(AUTH_EMAIL_KEY, emailTrim);
            await refreshUser();
            toast.success("Perfil atualizado com sucesso");
        } catch (err) {
            toast.error(err instanceof ApiErrorResponse ? err.message : "Não foi possível atualizar o perfil");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="w-full max-w-sm py-0 gap-0 rounded">
            <CardHeader className="px-8 pt-8 pb-5 text-center">
                <div className="w-16 h-16 rounded-full bg-foreground/10 mx-auto flex items-center justify-center">
                    <p className="text-xl opacity-70">
                        {user.firstName?.charAt(0) ?? user.email?.charAt(0) ?? "?"}
                        {user.lastName?.charAt(0) ?? ""}
                    </p>
                </div>

                <h2 className="text-2xl font-normal text-foreground leading-tight mt-4">Perfil do Usuário</h2>
            </CardHeader>

            <CardContent className="px-8 pb-8">
                <form className="grid gap-4" onSubmit={(e) => void handleSave(e)}>
                    <div className="grid gap-2">
                        <Label htmlFor="firstName">Nome</Label>
                        <Input
                            id="firstName"
                            className="rounded"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="lastName">Sobrenome</Label>
                        <Input
                            id="lastName"
                            className="rounded"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                            id="email"
                            type="email"
                            className="rounded"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="button"
                        onClick={onChangePassword}
                        className="text-left text-sm text-[#d4a574] hover:opacity-90 transition-colors"
                    >
                        Alterar senha
                    </button>

                    <div className="pt-1">
                        <Button
                            type="submit"
                            className="w-full mt-1 rounded"
                            style={{ background: "#d4a574", color: "#0f1117" }}
                            disabled={loading || !hasChanges}
                        >
                            Salvar alterações
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
