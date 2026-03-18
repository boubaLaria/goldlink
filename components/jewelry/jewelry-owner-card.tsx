"use client"

import { Shield, Star, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

type Owner = {
  id: string
  firstName: string
  lastName: string
  avatar: string | null
  rating: number
  verified: boolean
}

interface JewelryOwnerCardProps {
  owner: Owner
  currentUserId?: string
}

export function JewelryOwnerCard({ owner, currentUserId }: JewelryOwnerCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={owner.avatar || "/placeholder.svg"} />
              <AvatarFallback>{owner.firstName[0]}{owner.lastName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{owner.firstName} {owner.lastName}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {owner.verified && (
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Vérifié
                  </Badge>
                )}
                {owner.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{owner.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {currentUserId && currentUserId !== owner.id && (
            <Button variant="outline" size="sm" asChild className="bg-transparent">
              <Link href={`/messages?user=${owner.id}`}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Contacter
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
