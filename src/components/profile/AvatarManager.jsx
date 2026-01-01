import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ImageUploader from '@/components/ui/image-uploader';
import { uploadImage } from '@/lib/supabaseStorage';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const AvatarManager = () => {
   const { user, profile, updateUserProfile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleAvatarUpload = async (files) => {
    if (!files || files.length === 0) return;

    try {
      const file = files[0];
      const fileName = `${user.id}-${Date.now()}.${file.name.split('.').pop()}`;
      const avatarUrl = await uploadImage(file, fileName, 'avatar');

      // Update user profile with new avatar URL
      await updateUserProfile({ avatar_url: avatarUrl });
      console.log('updateUserProfile called with:', avatarUrl);

      // Refresh profile to get updated data
      await refreshProfile(user.id);

      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Avatar updated successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update avatar',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Avatar className="w-20 h-20">
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback>{user?.email?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <Button 
          variant="outline"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Change Avatar'}
        </Button>
      </div>

      {isEditing && (
        <ImageUploader
          onUpload={handleAvatarUpload}
          maxFiles={1}
          maxSize={2 * 1024 * 1024} // 2MB
          className="max-w-md"
        />
      )}
    </div>
  );
};

export default AvatarManager;