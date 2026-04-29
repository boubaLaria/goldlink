"use client"

import { Upload, CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import type { TryOnUploadResult } from "@/lib/hooks/use-tryon"

const TRYON_TYPE_LABELS: Record<string, string> = {
  FACE:   "Boucles d'oreilles / Oreilles",
  NECK:   "Collier / Chaîne / Pendentif",
  WRIST:  "Bracelet",
  FINGER: "Bague",
  MULTI:  "Parure (plusieurs zones)",
}

interface TryOnUploadSectionProps {
  tryOnAvailable: boolean
  tryOnType: string
  tryOnImageUrl: string
  uploading: boolean
  result: TryOnUploadResult | null
  onToggle: (v: boolean) => void
  onTypeChange: (v: string) => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function TryOnUploadSection({
  tryOnAvailable, tryOnType, tryOnImageUrl, uploading, result,
  onToggle, onTypeChange, onFileChange,
}: TryOnUploadSectionProps) {
  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600" />
          <span className="text-sm font-medium">Essayage virtuel</span>
        </div>
        <Switch checked={tryOnAvailable} onCheckedChange={onToggle} />
      </div>

      {tryOnAvailable && (
        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <Label>Zone d'essayage</Label>
            <Select value={tryOnType || ""} onValueChange={onTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une zone" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TRYON_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Image du bijou (PNG recommandé)</Label>
            <label
              htmlFor="tryon-upload"
              className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 cursor-pointer transition-colors
                ${uploading ? "opacity-50 pointer-events-none" : "hover:border-violet-400 hover:bg-violet-50/50"}`}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-6 w-6 text-violet-500 animate-spin" />
                  <span className="text-sm text-muted-foreground">Analyse en cours...</span>
                </>
              ) : tryOnImageUrl && !result ? (
                <>
                  <img src={tryOnImageUrl} alt="Image try-on" className="h-16 w-16 object-contain rounded" />
                  <span className="text-xs text-muted-foreground">Cliquer pour changer</span>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground text-center">
                    Cliquer pour uploader<br />
                    <span className="text-xs">JPG, PNG · max 15MB · fond uni recommandé</span>
                  </span>
                </>
              )}
              <input
                id="tryon-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onFileChange}
              />
            </label>

            {result && (
              <div className={`rounded-md p-3 text-sm space-y-1
                ${result.valid ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                {result.valid ? (
                  <div className="flex items-center gap-2 text-green-700 font-medium">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Bijou validé
                    {result.detectedType && (
                      <span className="font-normal text-green-600">
                        · Détecté : {TRYON_TYPE_LABELS[result.detectedType] ?? result.detectedType}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-red-700 font-medium">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    Validation échouée
                  </div>
                )}
                {result.errors.map((e, i) => <p key={i} className="text-red-600 pl-6 text-xs">{e}</p>)}
                {result.warnings.map((w, i) => <p key={i} className="text-amber-600 pl-6 text-xs">{w}</p>)}
                {result.typeMismatch && (
                  <p className="text-amber-600 pl-6 text-xs">
                    Type détecté différent de votre sélection — vérifiez la zone d'essayage.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
