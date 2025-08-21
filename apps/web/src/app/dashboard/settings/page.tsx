'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account preferences and settings
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-500">Settings panel coming soon...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}