import * as React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
    label: string
    href?: string
}

interface BreadcrumbProps {
    items: BreadcrumbItem[]
    className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
    return (
        <nav aria-label="Breadcrumb" className={cn("flex", className)}>
            <ol className="flex items-center space-x-2">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1

                    return (
                        <li key={item.label} className="flex items-center">
                            {index > 0 && (
                                <ChevronRight className="h-4 w-4 text-gray-400 mx-2" aria-hidden="true" />
                            )}
                            {isLast ? (
                                <span className="text-sm font-medium text-navy-900" aria-current="page">
                                    {item.label}
                                </span>
                            ) : (
                                <Link
                                    href={item.href || "#"}
                                    className="text-sm font-medium text-gray-500 hover:text-navy-700"
                                >
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}
