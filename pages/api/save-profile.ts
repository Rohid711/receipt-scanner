import type { NextApiRequest, NextApiResponse } from 'next';
import jsonDb from '../../utils/jsonDb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const profileData = {
      ...req.body,
      updated_at: new Date().toISOString() // Always add updated timestamp
    };
    
    // Validate required fields
    if (!profileData.name || !profileData.email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }
    
    // Check if profile already exists
    const profiles = jsonDb.getAll('profiles');
    
    if (profiles && profiles.length > 0) {
      // Get the most recent profile
      if (profiles.length > 1) {
        profiles.sort((a, b) => {
          const aDate = a.updated_at ? new Date(a.updated_at) : new Date(0);
          const bDate = b.updated_at ? new Date(b.updated_at) : new Date(0);
          return bDate.getTime() - aDate.getTime(); // Most recent first
        });
      }
      
      const mostRecentProfile = profiles[0];
      
      // Update existing profile - use ID if available, otherwise use email
      if (mostRecentProfile.id) {
        const updated = jsonDb.updateOne('profiles', 'id', mostRecentProfile.id, {
          ...mostRecentProfile,
          ...profileData
        });
        
        return res.status(200).json({ 
          success: true, 
          message: 'Profile updated successfully',
          data: updated
        });
      } else {
        // Use email as identifier if no ID
        const updated = jsonDb.updateOne('profiles', 'email', mostRecentProfile.email, {
          ...mostRecentProfile,
          ...profileData
        });
        
        if (updated) {
          return res.status(200).json({ 
            success: true, 
            message: 'Profile updated successfully',
            data: updated
          });
        } else {
          // If update failed, create new profile with ID
          const newProfile = {
            ...profileData,
            id: `profile_${Date.now()}`,
            created_at: new Date().toISOString()
          };
          
          const saved = jsonDb.insertOne('profiles', newProfile);
          return res.status(201).json({ 
            success: true, 
            message: 'Profile created successfully', 
            data: saved 
          });
        }
      }
    } else {
      // Create new profile with ID
      const newProfile = {
        ...profileData,
        id: `profile_${Date.now()}`,
        created_at: new Date().toISOString()
      };
      
      const saved = jsonDb.insertOne('profiles', newProfile);
      return res.status(201).json({ 
        success: true, 
        message: 'Profile created successfully', 
        data: saved 
      });
    }
  } catch (error) {
    console.error('Error saving profile:', error);
    return res.status(500).json({ success: false, message: 'Failed to save profile' });
  }
} 