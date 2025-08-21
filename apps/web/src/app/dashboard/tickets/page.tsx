'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function TicketsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-gray-600 mt-2">
          Practice with realistic IT support scenarios
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Scenarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-500">Ticket scenarios coming soon...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}