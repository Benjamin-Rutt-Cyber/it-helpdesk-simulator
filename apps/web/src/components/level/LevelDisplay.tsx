import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Trophy, Star, Award, Target } from 'lucide-react';
import { LevelInfo, LevelBenefits } from '../../types/level';

interface LevelDisplayProps {
  levelInfo: LevelInfo;
  benefits: LevelBenefits;
  showDetails?: boolean;
  compact?: boolean;
}

export const LevelDisplay: React.FC<LevelDisplayProps> = ({
  levelInfo,
  benefits,
  showDetails = true,
  compact = false
}) => {
  const getLevelIcon = (level: number) => {
    if (level >= 25) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (level >= 15) return <Award className="h-6 w-6 text-purple-500" />;
    if (level >= 5) return <Star className="h-6 w-6 text-blue-500" />;
    return <Target className="h-6 w-6 text-green-500" />;
  };

  const getLevelColor = (level: number) => {
    if (level >= 25) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    if (level >= 15) return 'bg-gradient-to-r from-purple-400 to-purple-600';
    if (level >= 5) return 'bg-gradient-to-r from-blue-400 to-blue-600';
    return 'bg-gradient-to-r from-green-400 to-green-600';
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border shadow-sm">
        <div className={`p-2 rounded-full ${getLevelColor(levelInfo.currentLevel)}`}>
          {getLevelIcon(levelInfo.currentLevel)}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-sm font-semibold">
              Level {levelInfo.currentLevel}
            </Badge>
            <span className="text-sm text-gray-600">{levelInfo.levelCategory}</span>
          </div>
          <div className="mt-1">
            <Progress value={levelInfo.progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{levelInfo.currentXP} XP</span>
              <span>{levelInfo.xpToNextLevel} XP to next level</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${getLevelColor(levelInfo.currentLevel)}`}>
              {getLevelIcon(levelInfo.currentLevel)}
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                Level {levelInfo.currentLevel}
              </CardTitle>
              <p className="text-lg text-gray-600 font-medium">
                {levelInfo.levelCategory}
              </p>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className="text-lg px-4 py-2 font-semibold border-2"
          >
            {levelInfo.currentXP} XP
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Progress to Next Level</h3>
            <span className="text-sm text-gray-600">
              {Math.round(levelInfo.progressPercentage)}% Complete
            </span>
          </div>
          <Progress 
            value={levelInfo.progressPercentage} 
            className="h-4 rounded-full"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>Current: {levelInfo.currentXP} XP</span>
            <span>Next Level: {levelInfo.totalXPForNextLevel} XP</span>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-blue-600">
              {levelInfo.xpToNextLevel}
            </span>
            <span className="text-gray-600 ml-2">XP needed</span>
          </div>
        </div>

        {showDetails && (
          <>
            {/* Benefits Section */}
            {benefits.featureUnlocks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-500" />
                  Features Unlocked
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {benefits.featureUnlocks.map((feature, index) => (
                    <div 
                      key={index}
                      className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-blue-800 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recognition Section */}
            {benefits.recognition.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center">
                  <Award className="h-5 w-5 mr-2 text-purple-500" />
                  Professional Recognition
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {benefits.recognition.map((recognition, index) => (
                    <div 
                      key={index}
                      className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-200"
                    >
                      <Badge variant="secondary" className="mr-3 bg-purple-100 text-purple-800">
                        ✓
                      </Badge>
                      <span className="text-purple-800 font-medium">{recognition}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Privileges Section */}
            {benefits.privileges.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-green-500" />
                  Special Privileges
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {benefits.privileges.map((privilege, index) => (
                    <div 
                      key={index}
                      className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-green-800 font-medium">{privilege}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Professional Credits Section */}
            {benefits.professionalCredits.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center">
                  <Award className="h-5 w-5 mr-2 text-orange-500" />
                  Professional Credits
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {benefits.professionalCredits.map((credit, index) => (
                    <div 
                      key={index}
                      className="flex items-center p-3 bg-orange-50 rounded-lg border border-orange-200"
                    >
                      <Badge variant="outline" className="mr-3 border-orange-300 text-orange-700">
                        CERT
                      </Badge>
                      <span className="text-orange-800 font-medium">{credit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Professional Description */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <h4 className="font-semibold text-gray-800 mb-2">
            Professional Level Description
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            {levelInfo.levelName} represents demonstrated competency in IT support through 
            practical application, professional behavior, and successful completion of 
            increasingly complex scenarios. This level indicates 
            <span className="font-semibold"> {levelInfo.currentXP}+ experience points </span>
            earned through verified skill demonstrations and quality performance metrics.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LevelDisplay;