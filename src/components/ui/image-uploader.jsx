import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const ImageUploader = ({ 
  onUpload, 
  maxFiles = 1, 
  acceptedFileTypes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp']
  },
  maxSize = 5 * 1024 * 1024, // 5MB
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles) => {
    try {
      setUploading(true);
      await onUpload(acceptedFiles);
      toast({
        title: 'Success',
        description: 'Image uploaded successfully'
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
  }, [onUpload, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxFiles,
    maxSize,
  });

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors ${
        isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
      } ${className}`}
    >
      <input {...getInputProps()} />
      <div className="space-y-4">
        {uploading ? (
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        ) : (
          <>
            <div className="text-sm text-gray-600">
              {isDragActive ? (
                <p>Drop the files here</p>
              ) : (
                <p>Drag and drop files here, or click to select files</p>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Max file size: {Math.round(maxSize / (1024 * 1024))}MB
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;