import { createSignal, type Component } from "solid-js";
import { Input, type InputProps } from "~/components/atoms/Input";
import { Button } from "~/components/atoms/Button";
import { Icon } from "~/components/atoms/Icon";

// ============================================================================
// TYPES
// ============================================================================

export interface PasswordInputProps extends Omit<InputProps, "type" | "rightIcon"> {}

// ============================================================================
// COMPONENT
// ============================================================================

export const PasswordInput: Component<PasswordInputProps> = (props) => {
  const [showPassword, setShowPassword] = createSignal(false);

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Input
      {...props}
      type={showPassword() ? "text" : "password"}
      rightIcon={
        <Button
          variant="ghost"
          size="sm-icon"
          type="button"
          onClick={toggleVisibility}
        >
          <Icon name={showPassword() ? "visibility_off" : "visibility"} />
          <span class="sr-only">{showPassword() ? "Hide password" : "Show password"}</span>
        </Button>
      }
    />
  );
};

export default PasswordInput;
