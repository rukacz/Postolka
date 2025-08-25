import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface MultiSelectProps {
  options: Array<{
    label: string
    value: string
  }>
  value?: string[] | undefined
  onValueChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  value = [],
  onValueChange,
  placeholder = "Select items...",
  className
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  // Ensure value is always an array
  const safeValue = Array.isArray(value) ? value : []

  const handleUnselect = (item: string) => {
    onValueChange(safeValue.filter((i) => i !== item))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement
    if (input.value === "") {
      if (e.key === "Backspace" && safeValue.length > 0) {
        handleUnselect(safeValue[safeValue.length - 1])
      }
      // Close on escape
      if (e.key === "Escape") {
        setOpen(false)
      }
    }
  }

  const selectables = options.filter((option) => !safeValue.includes(option.value))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal",
            className
          )}
          onClick={() => setOpen(!open)}
        >
          <div className="flex gap-1 flex-wrap">
            {safeValue.length === 0 && placeholder}
            {safeValue.map((item) => {
              const option = options.find((option) => option.value === item)
              return (
                <Badge
                  variant="secondary"
                  key={item}
                  className="mr-1 mb-1"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleUnselect(item)
                  }}
                >
                  {option?.label}
                  <span
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUnselect(item)
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={() => handleUnselect(item)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </span>
                </Badge>
              )
            })}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search..."
            onKeyDown={handleKeyDown}
          />
          <CommandEmpty>No item found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {selectables.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() => {
                  onValueChange([...safeValue, option.value])
                  setOpen(true)
                }}
              >
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}