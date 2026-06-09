'use client'

import * as React from 'react'
import { Slot, Slottable } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  [
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap outline-none',
    'transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out',
    'focus-visible:ring-2 focus-visible:ring-action-primary/30',
    'active:scale-[0.98]',
    'disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100',
    'aria-disabled:pointer-events-none aria-disabled:opacity-50',
    'data-[loading=true]:pointer-events-none data-[loading=true]:opacity-70',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-action-primary text-ink-inverse hover:bg-action-primary-hover',
        secondary: 'bg-action-secondary text-ink-inverse hover:bg-action-secondary-hover',
        outline:
          'border border-line bg-surface text-ink-soft hover:bg-surface-muted hover:text-ink',
        ghost: 'bg-transparent text-ink-soft hover:bg-surface-muted hover:text-ink',
        danger:
          'bg-danger text-ink-inverse hover:bg-danger-strong focus-visible:ring-danger/30',
      },
      size: {
        sm: 'min-h-9 rounded-lg px-3 py-1.5 text-xs',
        default: 'min-h-11 rounded-xl px-4 py-2 text-sm',
        lg: 'min-h-12 rounded-xl px-6 py-3 text-sm',
        icon: 'h-10 w-10 min-h-10 rounded-lg p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>
type NonIconButtonSize = Exclude<ButtonSize, 'icon'>

type IconButtonAccessibility =
  | {
      size: 'icon'
      'aria-label': string
      title?: string
    }
  | {
      size: 'icon'
      'aria-label'?: string
      title: string
    }

type StandardButtonAccessibility = {
  size?: NonIconButtonSize
  'aria-label'?: string
  title?: string
}

interface ButtonBaseProps
  extends Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      'aria-label' | 'className' | 'title'
    >,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  className?: string
  isLoading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export type ButtonProps = ButtonBaseProps &
  (IconButtonAccessibility | StandardButtonAccessibility)

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      variant,
      size,
      className,
      children,
      disabled,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      type = 'button',
      tabIndex,
      onClick,
      'aria-label': ariaLabel,
      'aria-busy': ariaBusy,
      'aria-disabled': ariaDisabled,
      title,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button'
    const isDisabled = disabled || isLoading
    const isIcon = size === 'icon'
    const label = isLoading && loadingText ? loadingText : children

    function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
      if (isDisabled) {
        event.preventDefault()
        event.stopPropagation()
        return
      }

      onClick?.(event)
    }

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={asChild ? undefined : isDisabled}
        aria-label={ariaLabel}
        aria-busy={isLoading ? true : ariaBusy}
        aria-disabled={asChild && isDisabled ? true : ariaDisabled}
        data-disabled={isDisabled ? '' : undefined}
        data-loading={isLoading ? 'true' : undefined}
        tabIndex={asChild && isDisabled ? -1 : tabIndex}
        title={title}
        onClick={handleClick}
        {...props}
      >
        {isIcon ? (
          isLoading ? null : (
            children
          )
        ) : (
          <>
            {isLoading ? (
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              />
            ) : null}

            {!isLoading && leftIcon ? leftIcon : null}

            {asChild ? (
              <Slottable>{label}</Slottable>
            ) : (
              <span className="truncate">{label}</span>
            )}

            {!isLoading && rightIcon ? rightIcon : null}
          </>
        )}
      </Comp>
    )
  },
)

Button.displayName = 'Button'
