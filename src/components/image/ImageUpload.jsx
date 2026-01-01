/**
 * ImageUpload Component
 * Reusable image upload component with URL input and file upload
 * Features:
 * - Preview before upload
 * - URL validation
 * - File upload with drag-drop
 * - Placeholder fallback
 */

import React, { useState, useRef } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { AlertCircle, Upload, Link2, Loader2, X } from 'lucide-react';

export default function ImageUpload({
  onImageSelect,
  onError,
  bucket = 'products',
  maxSize = 10,
  preview = true,
  label = 'Upload Image',
  description = 'Upload a product image or provide a URL',
  isOptional = false,
  showPlaceholder = true,
  placeholderUrl = 'https://via.placeholder.com/400x400?text=Product+Image'
}) {
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file' or 'url'
  const [urlInput, setUrlInput] = useState('');
  const [urlValidating, setUrlValidating] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Validate URL
  const validateUrl = async (url) => {
    setUrlValidating(true);
    setUrlError('');
    
    try {
      const response = await fetch('/api/images/validate-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ url })
      });

      const result = await response.json();
      
      if (!response.ok) {
        setUrlError(result.error || 'Invalid URL');
        return false;
      }

      setPreviewUrl(url);
      return true;
    } catch (err) {
      setUrlError('Failed to validate URL: ' + err.message);
      return false;
    } finally {
      setUrlValidating(false);
    }
  };

  // Handle URL input and validation
  const handleUrlChange = (e) => {
    setUrlInput(e.target.value);
    setUrlError('');
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) {
      setUrlError('Please enter a URL');
      return;
    }

    const isValid = await validateUrl(urlInput);
    if (isValid) {
      setUploading(true);
      try {
        const response = await fetch('/api/images/upload-from-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({
            url: urlInput,
            bucket: bucket
          })
        });

        const result = await response.json();

        if (!response.ok) {
          setUploadError(result.error || 'Upload failed');
          onError?.(result.error);
          return;
        }

        setUploadError('');
        setUrlInput('');
        setPreviewUrl(result.url);
        onImageSelect?.(result);
      } catch (err) {
        const errorMsg = 'Upload failed: ' + err.message;
        setUploadError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setUploading(false);
      }
    }
  };

  // Handle file selection
  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file size
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > maxSize) {
      const errorMsg = `File too large. Maximum size is ${maxSize}MB, got ${fileSizeMB.toFixed(2)}MB`;
      setUploadError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      const errorMsg = 'Invalid file type. Please select an image file.';
      setUploadError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setSelectedFile(file);
    setUploadError('');

    // Show preview
    if (preview) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.add('border-blue-500', 'bg-blue-50');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('border-blue-500', 'bg-blue-50');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('border-blue-500', 'bg-blue-50');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
      setUploadMethod('file');
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('bucket', bucket);

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        setUploadError(result.error || 'Upload failed');
        onError?.(result.error);
        return;
      }

      setUploadError('');
      setSelectedFile(null);
      setPreviewUrl(result.url);
      onImageSelect?.(result);
    } catch (err) {
      const errorMsg = 'Upload failed: ' + err.message;
      setUploadError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleClearPreview = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setUrlInput('');
    setUploadError('');
    setUrlError('');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription>
          {description}
          {isOptional && ' (Optional)'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preview */}
        {preview && previewUrl && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="relative w-full h-64 border rounded-lg overflow-hidden bg-gray-100">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleClearPreview}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Upload method tabs */}
        <div className="flex gap-2">
          <Button
            variant={uploadMethod === 'file' ? 'default' : 'outline'}
            onClick={() => setUploadMethod('file')}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload File
          </Button>
          <Button
            variant={uploadMethod === 'url' ? 'default' : 'outline'}
            onClick={() => setUploadMethod('url')}
            className="flex-1"
          >
            <Link2 className="w-4 h-4 mr-2" />
            Image URL
          </Button>
        </div>

        {/* File upload */}
        {uploadMethod === 'file' && (
          <div className="space-y-3">
            {!selectedFile ? (
              <>
                {/* Drag and drop zone */}
                <div
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center transition-colors cursor-pointer hover:border-foreground/30"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    Drop image here or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum size: {maxSize}MB
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supported: JPEG, PNG, WebP, GIF
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Selected: {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)}MB
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUploadFile}
                    disabled={uploading}
                    className="flex-1"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Upload'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      fileInputRef.current?.click();
                    }}
                    disabled={uploading}
                  >
                    Choose Different
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* URL input */}
        {uploadMethod === 'url' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={handleUrlChange}
                disabled={uploading || urlValidating}
              />
            </div>

            <Button
              onClick={handleUrlSubmit}
              disabled={!urlInput.trim() || uploading || urlValidating}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : urlValidating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                'Upload from URL'
              )}
            </Button>
          </div>
        )}

        {/* Error messages */}
        {uploadError && (
          <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{uploadError}</div>
          </div>
        )}

        {urlError && (
          <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{urlError}</div>
          </div>
        )}

        {/* Help text */}
        {!previewUrl && showPlaceholder && (
          <div className="flex gap-2 p-3 bg-primary/10 border border-primary/30 rounded-lg text-primary text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              {isOptional
                ? 'Images are optional. If not provided, a placeholder will be used.'
                : 'Please provide an image for better product visibility.'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
