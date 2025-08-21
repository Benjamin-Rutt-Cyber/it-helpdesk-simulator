import { CustomerInfo as CustomerInfoType } from '@/types/ticket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface CustomerInfoProps {
  customer: CustomerInfoType;
  className?: string;
  compact?: boolean;
}

export function CustomerInfo({ customer, className, compact = false }: CustomerInfoProps) {
  if (compact) {
    return (
      <div className={cn('flex items-center space-x-3', className)}>
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium text-sm">
              {customer.firstName[0]}{customer.lastName[0]}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {customer.fullName}
          </p>
          <p className="text-sm text-gray-500 truncate">
            {customer.jobTitle} • {customer.department}
          </p>
        </div>
      </div>
    );
  }

  const skillLevelColors = {
    novice: 'bg-red-50 text-red-700 border-red-200',
    intermediate: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    advanced: 'bg-green-50 text-green-700 border-green-200'
  };

  const contactMethodIcons = {
    email: '📧',
    phone: '📞',
    in_person: '👤'
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-lg">
              {customer.firstName[0]}{customer.lastName[0]}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {customer.fullName}
            </h3>
            <p className="text-sm text-gray-500">
              {customer.jobTitle}
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Contact Information</h4>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <span className="w-16 text-gray-500">Email:</span>
              <a href={`mailto:${customer.email}`} className="text-blue-600 hover:text-blue-800">
                {customer.email}
              </a>
            </div>
            {customer.phone && (
              <div className="flex items-center text-sm">
                <span className="w-16 text-gray-500">Phone:</span>
                <a href={`tel:${customer.phone}`} className="text-blue-600 hover:text-blue-800">
                  {customer.phone}
                </a>
              </div>
            )}
            <div className="flex items-center text-sm">
              <span className="w-16 text-gray-500">Preferred:</span>
              <span className="flex items-center space-x-1">
                <span>{contactMethodIcons[customer.preferredContactMethod]}</span>
                <span className="capitalize">{customer.preferredContactMethod.replace('_', ' ')}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Organizational Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Organization</h4>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <span className="w-20 text-gray-500">Department:</span>
              <span className="font-medium">{customer.department}</span>
            </div>
            {customer.employeeId && (
              <div className="flex items-center text-sm">
                <span className="w-20 text-gray-500">Employee ID:</span>
                <span className="font-mono text-gray-600">{customer.employeeId}</span>
              </div>
            )}
            {customer.manager && (
              <div className="flex items-center text-sm">
                <span className="w-20 text-gray-500">Manager:</span>
                <span>{customer.manager}</span>
              </div>
            )}
            {customer.officeLocation && (
              <div className="flex items-center text-sm">
                <span className="w-20 text-gray-500">Location:</span>
                <span>{customer.officeLocation}</span>
              </div>
            )}
          </div>
        </div>

        {/* Technical Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Technical Profile</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Skill Level:</span>
              <span className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                skillLevelColors[customer.technicalSkillLevel]
              )}>
                {customer.technicalSkillLevel.charAt(0).toUpperCase() + customer.technicalSkillLevel.slice(1)}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <span className="w-20 text-gray-500">Timezone:</span>
              <span>{customer.timezone}</span>
            </div>
          </div>
        </div>

        {/* Working Hours */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Working Hours</h4>
          <div className="text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <span>{customer.workingHours.start} - {customer.workingHours.end}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {customer.workingHours.daysOfWeek.map((day) => (
                <span 
                  key={day}
                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                >
                  {day.slice(0, 3)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex space-x-2">
            <button className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors">
              Contact Customer
            </button>
            <button className="flex-1 bg-gray-50 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors">
              View History
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}