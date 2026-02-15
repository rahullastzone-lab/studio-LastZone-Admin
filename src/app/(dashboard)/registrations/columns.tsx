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
  in_game_name?: string
  bgmi_id?: string
  phone?: string
  [key: string]: any // allow other keys
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
    mode: string
    entry_fee: number
  }
  profiles: {
    username: string
    avatar_url: string | null
    in_game_name?: string
    bgmi_id?: string
    email?: string
    phone?: string
  }
  player_details: PlayerDetails
  source?: string
}

const getPlayerId = (player: any) => {
  if (!player) return '-';
  // Check all possible casing variations found in different app versions
  return player.playerId || player.player_id || player.bgmi_id || player.game_id || player.uid || player.id || player.playerID || '-';
};

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
      return new Date(row.original.created_at).toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
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
    id: "mode",
    accessorFn: (row) => row.tournaments?.mode,
    header: "Mode",
    cell: ({ row }) => {
      const mode = row.original.tournaments?.mode;
      return (
        <Badge variant="outline" className="capitalize">
          {mode || '-'}
        </Badge>
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
    id: "payment_type",
    accessorFn: (row) => row.tournaments?.entry_fee > 0 ? "Paid" : "Free",
    header: "Fee Type",
    cell: ({ row }) => {
      const fee = row.original.tournaments?.entry_fee;
      const isPaid = fee > 0;
      return (
        <Badge variant={isPaid ? "default" : "secondary"} className={isPaid ? "bg-green-600 hover:bg-green-700" : ""}>
          {isPaid ? `Paid (₹${fee})` : "Free"}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value === "" ? true : row.getValue(id) === value;
    },
  },
  {
    accessorKey: "user",
    header: "User",
    cell: ({ row }) => {
      const p = row.original.profiles;
      return (
        <div className="flex flex-col text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{p?.username || "Unknown"}</span>
          </div>
          {p?.email && <span className="text-xs text-muted-foreground">{p.email}</span>}
          {p?.phone && <span className="text-xs text-muted-foreground">{p.phone}</span>}
        </div>
      )
    }
  },
  {
    accessorKey: "player_1",
    header: "Player 1 (Captain)",
    cell: ({ row }) => {
      const details = row.original.player_details || {};
      // Robust check for various possible key names
      const ign = details.ign || details.in_game_name || details.game_name || details.player_name || '-';
      const playerId = getPlayerId(details);
      const mobile = details.mobile || details.phone || details.phone_number || details.contact || '-';

      return (
        <div className="flex flex-col text-sm">


          <span className="font-semibold text-primary">{ign}</span>
          <span className="text-xs text-muted-foreground">ID: {playerId}</span>
          <span className="text-xs text-muted-foreground">Mob: {mobile}</span>
        </div>
      )
    }
  },
  {
    accessorKey: "player_2",
    header: "Player 2",
    cell: ({ row }) => {
      const teammates = row.original.player_details?.teammates || [];
      const p2 = teammates[0];
      if (!p2) return <span className="text-muted-foreground">-</span>;
      return (
        <div className="flex flex-col text-sm">
          <span className="font-medium">{p2.ign}</span>
          <span className="text-xs text-muted-foreground">ID: {getPlayerId(p2)}</span>
        </div>
      )
    }
  },
  {
    accessorKey: "player_3",
    header: "Player 3",
    cell: ({ row }) => {
      const teammates = row.original.player_details?.teammates || [];
      const p3 = teammates[1];
      if (!p3) return <span className="text-muted-foreground">-</span>;
      return (
        <div className="flex flex-col text-sm">
          <span className="font-medium">{p3.ign}</span>
          <span className="text-xs text-muted-foreground">ID: {getPlayerId(p3)}</span>
        </div>
      )
    }
  },
  {
    accessorKey: "player_4",
    header: "Player 4",
    cell: ({ row }) => {
      const teammates = row.original.player_details?.teammates || [];
      const p4 = teammates[2];
      if (!p4) return <span className="text-muted-foreground">-</span>;
      return (
        <div className="flex flex-col text-sm">
          <span className="font-medium">{p4.ign}</span>
          <span className="text-xs text-muted-foreground">ID: {getPlayerId(p4)}</span>
        </div>
      )
    }
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
