import { forwardRef } from "react"

const BUTTON_VARIANTS = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ")
}

const Button = forwardRef(function Button(
  {
    as: Component = "button",
    variant = "primary",
    disabled = false,
    loading = false,
    className = "",
    type = "button",
    children,
    ...props
  },
  ref,
) {
  const variantClass = BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.primary
  const isDisabled = disabled || loading
  const isNativeButton = Component === "button"
  const componentProps = isNativeButton
    ? { type, disabled: isDisabled }
    : { role: "button", tabIndex: isDisabled ? -1 : props.tabIndex }

  return (
    <Component
      ref={ref}
      className={cx(variantClass, disabled && "btn-disabled", loading && "is-loading", className)}
      aria-busy={loading ? "true" : undefined}
      aria-disabled={isDisabled ? "true" : undefined}
      {...componentProps}
      {...props}
    >
      {children}
    </Component>
  )
})

export default Button
