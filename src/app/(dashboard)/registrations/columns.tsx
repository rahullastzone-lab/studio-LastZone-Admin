"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Define the shape of our data
export type PlayerDetails = {
  ign?: string
  player_id?: string
  mobile?: string
  teammates?: Array<{
    ign: string
    player_id: string
  }>
}

export type Registration = {
  id: string
  created_at: string
  status: string
  tournaments: {
    name: string
    game_type: string
  }
  profiles: {
    username: string
    avatar_url: string | null
  }
  player_details: PlayerDetails
  source?: string
}

export const columns: ColumnDef<Registration>[] = [
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return new Date(row.original.created_at).toLocaleDateString()
    },
  },
  {
    accessorKey: "source",
    header: "Type",
    cell: ({ row }) => {
      return (
        <Badge variant="outline">{row.original.source || 'Tournament'}</Badge>
      )
    }
  },
  {
    accessorKey: "tournament",
    header: "Tournament",
    cell: ({ row }) => {
      const t = row.original.tournaments;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{t?.name || "Unknown"}</span>
          <span className="text-xs text-muted-foreground">{t?.game_type || "Solo"}</span>
        </div>
      )
    }
  },
  {
    accessorKey: "user",
    header: "User",
    cell: ({ row }) => {
      const p = row.original.profiles;
      return (
        <div className="flex items-center gap-2">
          {/* Avatar could be here */}
          <span>{p?.username || "Unknown"}</span>
        </div>
      )
    }
  },
  {
    accessorKey: "details",
    header: "Player Details",
    cell: ({ row }) => {
      const details = row.original.player_details || {};
      const type = row.original.tournaments?.game_type?.toLowerCase() || 'solo';

      // Solo Display
      if (type === 'solo') {
        return (
          <div className="text-sm">
            <div><span className="font-semibold">IGN:</span> {details.ign || '-'}</div>
            <div><span className="font-semibold">ID:</span> {details.player_id || '-'}</div>
            <div><span className="font-semibold">Mobile:</span> {details.mobile || '-'}</div>
          </div>
        )
      }

      // Squad/Duo Display
      const teammates = details.teammates || [];
      return (
        <div className="flex flex-col gap-1 items-start">
          <div className="text-sm">
            <div><span className="font-semibold text-primary">Captain:</span> {details.ign || '-'}</div>
            <div className="text-xs text-muted-foreground">ID: {details.player_id} | Mob: {details.mobile}</div>
          </div>

          {teammates.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-6 text-xs mt-1">
                  View {teammates.length} Teammates
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-2">
                  <h4 className="font-medium leading-none">Teammates</h4>
                  <div className="grid gap-2">
                    {teammates.map((tm, idx) => (
                      <div key={idx} className="text-sm border-b pb-1 last:border-0">
                        <div><span className="font-semibold">Mate {idx + 1}:</span> {tm.ign}</div>
                        <div className="text-xs text-muted-foreground">ID: {tm.player_id}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      return (
        <Badge variant={row.original.status === "Confirmed" ? "default" : "secondary"}>
          {row.original.status}
        </Badge>
      )
    },
  },
]
