import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Trophy, 
  Star, 
  Award, 
  Share2, 
  Download, 
  X, 
  Sparkles,
  PartyPopper,
  Crown
} from 'lucide-react';
import { AdvancementEvent, AdvancementReward } from '../../types/level';

interface AdvancementCelebrationProps {
  advancementEvent: AdvancementEvent;
  isVisible: boolean;
  onClose: () => void;
  onViewBenefits: () => void;
  onShareAchievement: (shareData: any) => void;
  onViewMilestones?: () => void;
}

export const AdvancementCelebration: React.FC<AdvancementCelebrationProps> = ({
  advancementEvent,
  isVisible,
  onClose,
  onViewBenefits,
  onShareAchievement,
  onViewMilestones
}) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [currentRewardIndex, setCurrentRewardIndex] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setShowAnimation(true);
      // Auto-advance rewards display
      const rewardTimer = setInterval(() => {
        setCurrentRewardIndex(prev => 
          prev < advancementEvent.celebration.rewards.length - 1 ? prev + 1 : 0
        );
      }, 2000);

      return () => clearInterval(rewardTimer);
    } else {
      setShowAnimation(false);
    }
  }, [isVisible, advancementEvent.celebration.rewards.length]);

  if (!isVisible) return null;

  const { celebration, newLevel, milestones, benefits } = advancementEvent;
  const currentReward = celebration.rewards[currentRewardIndex];

  const getAnimationClass = () => {
    switch (celebration.animation) {
      case 'confetti-explosion':
        return 'animate-bounce';
      case 'golden-stars':
        return 'animate-pulse';
      default:
        return 'animate-fade-in';
    }
  };

  const getCelebrationIcon = () => {
    switch (celebration.type) {
      case 'major_milestone':
        return <Crown className="h-12 w-12 text-yellow-500" />;
      case 'milestone':
        return <Trophy className="h-12 w-12 text-purple-500" />;
      default:
        return <Star className="h-12 w-12 text-blue-500" />;
    }
  };

  const getRewardIcon = (reward: AdvancementReward) => {
    switch (reward.type) {
      case 'badge':
        return <Award className="h-6 w-6" />;
      case 'certificate':
        return <Trophy className="h-6 w-6" />;
      case 'feature_unlock':
        return <Star className="h-6 w-6" />;
      case 'privilege':
        return <Crown className="h-6 w-6" />;
      default:
        return <Sparkles className="h-6 w-6" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'from-yellow-400 to-orange-500';
      case 'epic':
        return 'from-purple-400 to-pink-500';
      case 'rare':
        return 'from-blue-400 to-indigo-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Background Animation */}
      {celebration.type === 'major_milestone' && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              <Sparkles className="h-4 w-4 text-yellow-400" />
            </div>
          ))}
        </div>
      )}

      <Card className={`w-full max-w-2xl mx-auto ${getAnimationClass()} transform transition-all duration-500 ${
        showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        <CardContent className="p-8">
          {/* Close Button */}
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Celebration Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className={`p-4 rounded-full bg-gradient-to-r ${
                celebration.type === 'major_milestone' 
                  ? 'from-yellow-400 to-orange-500' 
                  : celebration.type === 'milestone'
                  ? 'from-purple-400 to-pink-500'
                  : 'from-blue-400 to-indigo-500'
              } ${getAnimationClass()}`}>
                {getCelebrationIcon()}
              </div>
            </div>
            
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {celebration.title}
            </h1>
            
            <div className="flex justify-center items-center space-x-4 mb-4">
              <Badge variant="outline" className="text-xl px-4 py-2 font-bold border-2">
                Level {newLevel}
              </Badge>
              {milestones.length > 0 && (
                <Badge variant="secondary" className="text-lg px-3 py-1 bg-purple-100 text-purple-800">
                  {milestones.length} Milestone{milestones.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            <p className="text-lg text-gray-700 leading-relaxed max-w-xl mx-auto">
              {celebration.message}
            </p>
          </div>

          {/* Current Reward Display */}
          {currentReward && (
            <div className="mb-8">
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  New Reward Unlocked!
                </h3>
              </div>
              
              <div className={`p-6 rounded-xl bg-gradient-to-r ${getRarityColor(currentReward.rarity)} text-white text-center transform transition-all duration-500 hover:scale-105`}>
                <div className="flex justify-center mb-3">
                  <div className="p-3 bg-white bg-opacity-20 rounded-full">
                    {getRewardIcon(currentReward)}
                  </div>
                </div>
                
                <h4 className="text-xl font-bold mb-2">{currentReward.title}</h4>
                <p className="text-sm opacity-90 mb-3">{currentReward.description}</p>
                
                <Badge variant="secondary" className="bg-white bg-opacity-20 text-white border-white border-opacity-30">
                  {currentReward.rarity.toUpperCase()}
                </Badge>
              </div>

              {/* Reward Navigation */}
              {celebration.rewards.length > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                  {celebration.rewards.map((_, index) => (
                    <button
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        index === currentRewardIndex 
                          ? 'bg-blue-500 scale-125' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      onClick={() => setCurrentRewardIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Benefits Preview */}
          {benefits.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                New Benefits Unlocked
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {benefits.slice(0, 4).map((benefit, index) => (
                  <div 
                    key={index}
                    className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200 transform transition-all duration-200 hover:scale-105"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-green-800 font-medium text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
              {benefits.length > 4 && (
                <div className="text-center mt-3">
                  <span className="text-sm text-gray-600">
                    +{benefits.length - 4} more benefits unlocked
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={onViewBenefits}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              <Award className="h-4 w-4 mr-2" />
              View All Benefits
            </Button>

            <Button
              onClick={() => onShareAchievement(celebration.shareableContent)}
              variant="outline"
              className="px-6 py-2"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Achievement
            </Button>

            {milestones.length > 0 && onViewMilestones && (
              <Button
                onClick={onViewMilestones}
                variant="outline"
                className="px-6 py-2 border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Trophy className="h-4 w-4 mr-2" />
                View Milestones
              </Button>
            )}
          </div>

          {/* Shareable Content Preview */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-semibold text-gray-800 mb-2 text-center">
              Ready to Share Your Achievement?
            </h4>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Perfect for LinkedIn, portfolio, or resume
              </p>
              <div className="flex justify-center space-x-2">
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Certificate
                </Button>
                <Button size="sm" variant="outline">
                  <PartyPopper className="h-4 w-4 mr-1" />
                  LinkedIn Post
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancementCelebration;