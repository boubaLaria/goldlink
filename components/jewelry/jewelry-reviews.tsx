"use client"

import { Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDate } from "@/lib/utils/date"

type ReviewWithReviewer = {
  id: string
  rating: number
  comment: string
  createdAt: Date | string
  reviewer: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
  }
}

interface JewelryReviewsProps {
  reviews: ReviewWithReviewer[]
}

export function JewelryReviews({ reviews }: JewelryReviewsProps) {
  if (reviews.length === 0) return null

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Avis ({reviews.length})</h2>
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={review.reviewer.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {review.reviewer.firstName[0]}{review.reviewer.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold">
                        {review.reviewer.firstName} {review.reviewer.lastName}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${
                              i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`} />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{review.comment}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
