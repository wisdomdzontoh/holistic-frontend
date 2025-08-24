"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Target, BarChart3, FileText, Search, LogOut, Command } from "lucide-react"

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview and reports",
    color: "bg-[#1E8449]",
    shortcut: "⌘D",
  },
  {
    name: "Holistic Assessment",
    href: "/dashboard/assessment",
    icon: Target,
    description: "Create and manage assessments",
    color: "bg-blue-900",
    shortcut: "⌘A",
  },
  {
    name: "Indicator Definitions",
    href: "/dashboard/indicators",
    icon: FileText,
    description: "Manage indicator definitions",
    color: "bg-[#C0392B]",
    shortcut: "⌘I",
  },
  {
    name: "Analysis",
    href: "/dashboard/analysis",
    icon: BarChart3,
    description: "Data analysis and insights",
    color: "bg-[#1E8449]",
    shortcut: "⌘L",
  },
]

const actions = [
  {
    name: "Browse apps",
    icon: LayoutDashboard,
    description: "Explore all available applications",
    onClick: () => console.log("Browse apps"),
  },
  {
    name: "Logout",
    icon: LogOut,
    description: "Sign out of your account",
    onClick: () => {
      window.location.href = "/login"
    },
  },
]

interface NavigationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NavigationModal({ isOpen, onClose }: NavigationModalProps) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  const filteredItems = navigationItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleItemClick = () => {
    onClose()
    setSearchQuery("")
    setSelectedIndex(0)
  }

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
        setSearchQuery("")
        setSelectedIndex(0)
      } else if (event.key === "ArrowDown") {
        event.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1))
      } else if (event.key === "ArrowUp") {
        event.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (event.key === "Enter" && filteredItems[selectedIndex]) {
        event.preventDefault()
        const selectedItem = filteredItems[selectedIndex]
        window.location.href = selectedItem.href
        handleItemClick()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose, filteredItems, selectedIndex])

  React.useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 bg-white border-0 shadow-2xl">
        <div className="flex flex-col h-full max-h-[85vh]">
          {/* Header - Fixed */}
          <div className="border-b border-gray-200 p-6 bg-white flex-shrink-0">
            <div className="flex items-center gap-3 mb-4">
                             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E8449] to-blue-900 flex items-center justify-center">
                <Command className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Quick Navigation</h2>
                <p className="text-sm text-gray-500">Search and navigate to any section</p>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search apps, shortcuts, commands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-gray-200 focus:border-[#1E8449] focus:ring-[#1E8449]/20 bg-white text-base"
                autoFocus
              />
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {filteredItems.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Applications</h3>
                    <span className="text-xs text-gray-400">{filteredItems.length} results</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {filteredItems.map((item, index) => {
                      const isActive = pathname === item.href
                      const isSelected = index === selectedIndex
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={handleItemClick}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group border",
                            "hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-0.5",
                            isSelected && "bg-[#1E8449]/10 border-[#1E8449]/20 shadow-md",
                            !isSelected && "bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200",
                            isActive && "ring-2 ring-[#1E8449]/20",
                          )}
                        >
                          <div
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
                              item.color,
                              "group-hover:shadow-md transition-shadow duration-200",
                            )}
                          >
                            <item.icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h4>
                              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500 font-mono">
                                {item.shortcut}
                              </kbd>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 truncate">{item.description}</p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-500">Try searching with different keywords</p>
                </div>
              )}
            </div>

            {/* Actions Section - Always visible in scrollable area */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                {actions.map((action) => (
                  <Button
                    key={action.name}
                    variant="ghost"
                    className="justify-start h-auto p-3 text-left hover:bg-white hover:shadow-sm transition-all duration-200"
                    onClick={() => {
                      action.onClick()
                      handleItemClick()
                    }}
                  >
                    <action.icon className="h-4 w-4 mr-3 text-gray-500" />
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{action.name}</div>
                      <div className="text-xs text-gray-500">{action.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer - Fixed */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white rounded shadow-sm border border-gray-200">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white rounded shadow-sm border border-gray-200">↵</kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white rounded shadow-sm border border-gray-200">ESC</kbd>
                <span>Close</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
