"use client"

import Image from "next/image"
import { useState } from "react"

interface JewelryImageGalleryProps {
  images: string[]
  title: string
}

export function JewelryImageGallery({ images, title }: JewelryImageGalleryProps) {
  const [selected, setSelected] = useState(0)

  return (
    <div className="space-y-4">
      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
        <Image
          src={images[selected] || "/placeholder.svg?height=600&width=600"}
          alt={title}
          fill
          className="object-cover"
        />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelected(index)}
            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
              selected === index ? "border-primary" : "border-transparent"
            }`}
          >
            <Image
              src={image || "/placeholder.svg?height=150&width=150"}
              alt={`Image ${index + 1}`}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
