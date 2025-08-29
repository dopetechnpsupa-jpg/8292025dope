'use client'

import { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type Product } from '@/lib/products-data'

interface CartItemEditorProps {
  product: Product
  currentColor?: string
  currentFeatures?: string[]
  onSave: (color: string | undefined, features: string[]) => void
  onCancel: () => void
  isOpen: boolean
}

export function CartItemEditor({ 
  product, 
  currentColor, 
  currentFeatures = [], 
  onSave, 
  onCancel, 
  isOpen 
}: CartItemEditorProps) {
  const [selectedColor, setSelectedColor] = useState<string | undefined>(currentColor)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(currentFeatures)

  // Reset selections when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedColor(currentColor)
      setSelectedFeatures(currentFeatures || [])
    }
  }, [isOpen, currentColor, currentFeatures])

  // Available colors - split by comma if multiple colors are provided
  const availableColors = product.color 
    ? product.color.split(',').map(color => color.trim()).filter(color => color.length > 0)
    : []
  
  // Available features from the product
  const availableFeatures = product.features || []

  const handleColorSelect = (color: string) => {
    setSelectedColor(selectedColor === color ? undefined : color)
  }

  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    )
  }

  const handleSave = () => {
    onSave(selectedColor, selectedFeatures)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Customize {product.name}
            </h3>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-900" />
            </button>
          </div>

          {/* Product Info */}
          <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-12 h-12 object-cover rounded-lg"
            />
            <div>
              <h4 className="font-medium text-gray-900 text-sm">{product.name}</h4>
              <p className="text-[#feda00] price-proxima-nova text-sm">Rs {product.price}</p>
            </div>
          </div>

          {/* Color Selection */}
          {availableColors.length > 0 && (
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium text-gray-700">Color</label>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className={`px-3 py-2 rounded-lg border transition-all duration-200 ${
                      selectedColor === color
                        ? 'bg-[#feda00] text-black border-[#feda00] shadow-lg'
                        : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{color}</span>
                      {selectedColor === color && <Check className="w-4 h-4" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Features Selection */}
          {availableFeatures.length > 0 && (
            <div className="space-y-2 mb-6">
              <label className="text-sm font-medium text-gray-700">Features</label>
              <div className="flex flex-wrap gap-2">
                {availableFeatures.map((feature) => (
                  <button
                    key={feature}
                    onClick={() => handleFeatureToggle(feature)}
                    className={`px-3 py-2 rounded-lg border transition-all duration-200 ${
                      selectedFeatures.includes(feature)
                        ? 'bg-[#feda00] text-black border-[#feda00] shadow-lg'
                        : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{feature}</span>
                      {selectedFeatures.includes(feature) && <Check className="w-4 h-4" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-[#feda00] text-black hover:bg-[#feda00]/90"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
