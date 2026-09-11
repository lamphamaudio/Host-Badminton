import * as React from 'react'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet'

export const Drawer = Sheet
export const DrawerTrigger = SheetTrigger
export const DrawerClose = SheetClose
export const DrawerHeader = SheetHeader
export const DrawerFooter = SheetFooter
export const DrawerTitle = SheetTitle
export const DrawerDescription = SheetDescription

export const DrawerContent = React.forwardRef<
  React.ElementRef<typeof SheetContent>,
  React.ComponentPropsWithoutRef<typeof SheetContent>
>(({ className, children, ...props }, ref) => (
  <SheetContent
    ref={ref}
    side="bottom"
    className={className}
    {...props}
  >
    {children}
  </SheetContent>
))
DrawerContent.displayName = 'DrawerContent'
