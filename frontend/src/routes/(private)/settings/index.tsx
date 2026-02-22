import { createSignal, onMount, onCleanup, batch, Switch, Match } from "solid-js";
import { Title } from "@solidjs/meta";
import { Card } from "~/components/atoms/Card";
import { Input } from "~/components/atoms/Input";
import { Button } from "~/components/atoms/Button";
import { Label } from "~/components/atoms/Label";
import { PasswordInput } from "~/components/molecules/PasswordInput/PasswordInput";
import { usersApi, authApi, getErrorMessage } from "~/lib/api";
import { auth } from "~/lib/auth";
import { toast } from "~/lib/stores";

export default function Settings() {
  const [firstName, setFirstName] = createSignal("");
  const [lastName, setLastName] = createSignal("");
  const [saving, setSaving] = createSignal(false);
  const [saveError, setSaveError] = createSignal("");

  const [currentPassword, setCurrentPassword] = createSignal("");
  const [newPassword, setNewPassword] = createSignal("");
  const [confirmPassword, setConfirmPassword] = createSignal("");
  const [changingPassword, setChangingPassword] = createSignal(false);
  const [passwordError, setPasswordError] = createSignal("");

  let alive = true;
  onCleanup(() => { alive = false; });

  onMount(() => {
    if (auth.user) {
      setFirstName(auth.user.first_name || "");
      setLastName(auth.user.last_name || "");
    }
  });

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const updated = await usersApi.updateProfile({
        first_name: firstName(),
        last_name: lastName(),
      });
      if (!alive) return;
      batch(() => {
        auth.updateUser(updated);
        setSaving(false);
      });
      toast.success("Profile updated");
    } catch (err) {
      if (!alive) return;
      batch(() => {
        setSaving(false);
        setSaveError(getErrorMessage(err));
      });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword() !== confirmPassword()) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword().length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setChangingPassword(true);
    setPasswordError("");
    try {
      await authApi.changePassword(currentPassword(), newPassword());
      if (!alive) return;
      batch(() => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setChangingPassword(false);
      });
      toast.success("Password changed successfully");
    } catch (err) {
      if (!alive) return;
      batch(() => {
        setChangingPassword(false);
        setPasswordError(getErrorMessage(err));
      });
    }
  };

  return (
    <>
      <Title>Settings | Golid</Title>
      <div class="p-6 sm:p-10 max-w-[1400px] mx-auto w-full space-y-6">
        <h1 class="text-2xl font-bold text-foreground">Settings</h1>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Profile Section */}
          <Card class="p-6 space-y-6">
            <div>
              <h2 class="text-lg font-semibold text-foreground mb-4">Profile</h2>
              <div class="space-y-4">
                <div>
                  <Label for="email">Email</Label>
                  <Input id="email" value={auth.user?.email || ""} disabled />
                </div>
                <div>
                  <Label for="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={firstName()}
                    onInput={(e) => setFirstName(e.currentTarget.value)}
                  />
                </div>
                <div>
                  <Label for="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={lastName()}
                    onInput={(e) => setLastName(e.currentTarget.value)}
                  />
                </div>
              </div>
            </div>

            <Switch>
              <Match when={saveError()}>
                <div class="flex items-center justify-between">
                  <p class="text-sm text-danger">{saveError()}</p>
                  <Button onClick={handleSave}>Retry</Button>
                </div>
              </Match>
              <Match when={saving()}>
                <div class="flex justify-end">
                  <Button loading disabled>Saving...</Button>
                </div>
              </Match>
              <Match when={true}>
                <div class="flex justify-end">
                  <Button onClick={handleSave}>Save Changes</Button>
                </div>
              </Match>
            </Switch>
          </Card>

          {/* Password Section */}
          <Card class="p-6 space-y-6">
            <div>
              <h2 class="text-lg font-semibold text-foreground mb-4">Change Password</h2>
              <div class="space-y-4">
                <div>
                  <Label for="current_password">Current Password</Label>
                  <PasswordInput
                    id="current_password"
                    value={currentPassword()}
                    onInput={(e) => setCurrentPassword(e.currentTarget.value)}
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <Label for="new_password">New Password</Label>
                  <PasswordInput
                    id="new_password"
                    value={newPassword()}
                    onInput={(e) => setNewPassword(e.currentTarget.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <Label for="confirm_password">Confirm New Password</Label>
                  <PasswordInput
                    id="confirm_password"
                    value={confirmPassword()}
                    onInput={(e) => setConfirmPassword(e.currentTarget.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>

            <Switch>
              <Match when={passwordError()}>
                <div class="flex items-center justify-between">
                  <p class="text-sm text-danger">{passwordError()}</p>
                  <Button onClick={handleChangePassword}>Retry</Button>
                </div>
              </Match>
              <Match when={changingPassword()}>
                <div class="flex justify-end">
                  <Button loading disabled>Changing...</Button>
                </div>
              </Match>
              <Match when={true}>
                <div class="flex justify-end">
                  <Button onClick={handleChangePassword}>Change Password</Button>
                </div>
              </Match>
            </Switch>
          </Card>
        </div>
      </div>
    </>
  );
}
