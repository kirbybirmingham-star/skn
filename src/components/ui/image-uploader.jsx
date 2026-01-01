import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

// Compress and resize image
const compressImage = async (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(resolve, 'image/jpeg', quality);
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

const ImageUploader = ({
  onUpload,
  maxFiles = 10,
  acceptedFileTypes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif']
  },
  maxSize = 5 * 1024 * 1024, // 5MB
  className = '',
  disabled = false,
  compressImages = true
}) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles) => {
    try {
      setUploading(true);

      // Compress images if enabled
      let filesToUpload = acceptedFiles;
      if (compressImages) {
        filesToUpload = await Promise.all(
          acceptedFiles.map(async (file) => {
            if (file.type.startsWith('image/') && !file.type.includes('gif')) {
              try {
                const compressed = await compressImage(file);
                return new File([compressed], file.name, { type: 'image/jpeg' });
              } catch (error) {
                console.warn('Failed to compress image, using original:', error);
                return file;
              }
            }
            return file;
          })
        );
      }

      await onUpload(filesToUpload);
      toast({
        title: 'Success',
        description: `${filesToUpload.length} image${filesToUpload.length !== 1 ? 's' : ''} uploaded successfully`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload image',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  }, [onUpload, toast, compressImages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxFiles,
    maxSize,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors ${
        isDragActive ? 'border-primary bg-primary/5' : disabled ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-gray-300'
      } ${className}`}
    >
      <input {...getInputProps()} />
      <div className="space-y-4">
        {uploading ? (
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        ) : (
          <>
            <div className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
              {isDragActive ? (
                <p>Drop the files here</p>
              ) : disabled ? (
                <p>Maximum images reached</p>
              ) : (
                <p>Drag and drop files here, or click to select files</p>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Max {maxFiles} files • Max file size: {Math.round(maxSize / (1024 * 1024))}MB each
            </div>
            <div className="text-xs text-gray-400">
              Supported: JPEG, PNG, WebP, GIF
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;