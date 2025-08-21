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
  Crown,
  Target,
  TrendingUp,
  Users,
  Lightbulb
} from 'lucide-react';
import { Achievement, UserAchievement, AchievementTier, AchievementRarity } from '../../types/achievements';

interface AchievementCelebrationProps {
  achievement: Achievement;
  userAchievement: UserAchievement;
  isVisible: boolean;
  onClose: () => void;
  onViewPortfolio: () => void;
  onShareAchievement: (shareData: any) => void;
  onViewSimilar?: () => void;
}

export const AchievementCelebration: React.FC<AchievementCelebrationProps> = ({
  achievement,
  userAchievement,
  isVisible,
  onClose,
  onViewPortfolio,
  onShareAchievement,
  onViewSimilar
}) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setShowAnimation(true);
      // Auto-cycle through skills
      const skillTimer = setInterval(() => {
        setCurrentSkillIndex(prev => 
          prev < achievement.professionalValue.skillsDisplayed.length - 1 ? prev + 1 : 0
        );
      }, 2000);

      return () => clearInterval(skillTimer);
    } else {
      setShowAnimation(false);
    }
  }, [isVisible, achievement.professionalValue.skillsDisplayed.length]);

  if (!isVisible) return null;

  const getTierColor = (tier: AchievementTier) => {
    switch (tier) {
      case AchievementTier.PLATINUM:
        return 'from-cyan-400 to-blue-500';
      case AchievementTier.GOLD:
        return 'from-yellow-400 to-orange-500';
      case AchievementTier.SILVER:
        return 'from-gray-300 to-gray-500';
      case AchievementTier.BRONZE:
        return 'from-orange-400 to-red-500';
      default:
        return 'from-gray-200 to-gray-400';
    }
  };

  const getRarityAnimation = (rarity: AchievementRarity) => {
    switch (rarity) {
      case AchievementRarity.LEGENDARY:
        return 'animate-pulse';
      case AchievementRarity.EPIC:
        return 'animate-bounce';
      case AchievementRarity.RARE:
        return 'animate-pulse';
      default:
        return '';
    }
  };

  const getCelebrationIcon = () => {
    switch (userAchievement.tier) {
      case AchievementTier.PLATINUM:
        return <Crown className="h-16 w-16 text-cyan-500" />;
      case AchievementTier.GOLD:
        return <Trophy className="h-16 w-16 text-yellow-500" />;
      case AchievementTier.SILVER:
        return <Award className="h-16 w-16 text-gray-500" />;
      default:
        return <Star className="h-16 w-16 text-orange-500" />;
    }
  };

  const getCategoryIcon = () => {
    const iconClass = "h-8 w-8";
    switch (achievement.category) {
      case 'technical_skills':
        return <Target className={iconClass} />;
      case 'customer_service':
        return <Users className={iconClass} />;
      case 'professional_behavior':
        return <Award className={iconClass} />;
      case 'leadership':
        return <Star className={iconClass} />;
      case 'learning':
        return <Lightbulb className={iconClass} />;
      default:
        return <Trophy className={iconClass} />;
    }
  };

  const formatTier = (tier: AchievementTier) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const currentSkill = achievement.professionalValue.skillsDisplayed[currentSkillIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Background Animation */}
      {achievement.rarity === AchievementRarity.LEGENDARY && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            >
              <Sparkles className="h-4 w-4 text-yellow-400" />
            </div>
          ))}
        </div>
      )}

      <Card className={`w-full max-w-3xl mx-auto transform transition-all duration-700 ${
        showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      } ${getRarityAnimation(achievement.rarity)}`}>
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
            <div className="flex justify-center mb-6">
              <div className={`p-6 rounded-full bg-gradient-to-r ${getTierColor(userAchievement.tier)} ${getRarityAnimation(achievement.rarity)}`}>
                {getCelebrationIcon()}
              </div>
            </div>
            
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🎉 Achievement Unlocked! 🎉
            </h1>
            
            <div className="flex justify-center items-center space-x-4 mb-4">
              <Badge variant="outline" className="text-2xl px-6 py-3 font-bold border-2">
                {achievement.name}
              </Badge>
              <Badge 
                variant="secondary" 
                className={`text-lg px-4 py-2 font-semibold ${getTierColor(userAchievement.tier)} text-white`}
              >
                {formatTier(userAchievement.tier)}
              </Badge>
            </div>

            <p className="text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto">
              {achievement.portfolioDescription}
            </p>
          </div>

          {/* Professional Value Section */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Skills Display */}
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-center mb-3">
                  <div className="p-3 bg-blue-100 rounded-full">
                    {getCategoryIcon()}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Skills Demonstrated</h3>
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {currentSkill}
                </div>
                <div className="flex justify-center space-x-1">
                  {achievement.professionalValue.skillsDisplayed.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === currentSkillIndex 
                          ? 'bg-blue-500 scale-125' 
                          : 'bg-blue-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Professional Value */}
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex justify-center mb-3">
                  <div className="p-3 bg-green-100 rounded-full">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Industry Value</h3>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {achievement.professionalValue.industryValue}/10
                </div>
                <div className="text-sm text-green-700">
                  {achievement.professionalValue.competencyLevel.charAt(0).toUpperCase() + 
                   achievement.professionalValue.competencyLevel.slice(1)} Level
                </div>
              </div>

              {/* Career Relevance */}
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex justify-center mb-3">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Award className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Career Level</h3>
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {achievement.professionalValue.careerRelevance.charAt(0).toUpperCase() + 
                   achievement.professionalValue.careerRelevance.slice(1)}
                </div>
                <div className="text-sm text-purple-700">
                  Professional Relevance
                </div>
              </div>
            </div>
          </div>

          {/* Achievement Details */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg border">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              What This Achievement Means
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Professional Impact:</h4>
                <p className="text-sm text-gray-600">
                  This {userAchievement.tier} tier achievement demonstrates {achievement.professionalValue.competencyLevel} level 
                  competency in {achievement.category.replace('_', ' ')}. It validates your ability to 
                  deliver professional-quality work and represents a meaningful addition to your career portfolio.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Evidence Collected:</h4>
                <div className="space-y-1">
                  {userAchievement.evidence.slice(0, 3).map((evidence, index) => (
                    <div key={index} className="text-sm text-gray-600 flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      {evidence.description}
                    </div>
                  ))}
                  {userAchievement.evidence.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{userAchievement.evidence.length - 3} more evidence items
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Resume Integration */}
          <div className="mb-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-2 text-center">
              📄 Ready for Your Resume
            </h4>
            <div className="bg-white p-3 rounded border text-sm font-mono">
              {achievement.resumeBulletPoint}
            </div>
            <p className="text-xs text-yellow-700 mt-2 text-center">
              This achievement is formatted for professional use and can be directly added to your resume
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={onViewPortfolio}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              <Award className="h-4 w-4 mr-2" />
              View Portfolio
            </Button>

            <Button
              onClick={() => onShareAchievement({
                linkedIn: `🏆 Excited to share that I've earned the ${achievement.name} (${formatTier(userAchievement.tier)}) achievement! This recognizes my ${achievement.professionalValue.skillsDisplayed.join(', ')} skills. ${achievement.portfolioDescription} #ITSupport #ProfessionalDevelopment #Achievement`,
                twitter: `🎉 Just unlocked ${achievement.name} (${formatTier(userAchievement.tier)}) achievement! Demonstrates ${achievement.professionalValue.skillsDisplayed[0]} expertise. #ITSupport #Achievement`,
                resume: achievement.resumeBulletPoint
              })}
              variant="outline"
              className="px-6 py-2"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Achievement
            </Button>

            {onViewSimilar && (
              <Button
                onClick={onViewSimilar}
                variant="outline"
                className="px-6 py-2 border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Target className="h-4 w-4 mr-2" />
                Similar Achievements
              </Button>
            )}

            <Button
              variant="outline"
              className="px-6 py-2 border-green-300 text-green-700 hover:bg-green-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Certificate
            </Button>
          </div>

          {/* Next Steps */}
          <div className="mt-8 text-center">
            <h4 className="font-semibold text-gray-800 mb-2">What's Next?</h4>
            <p className="text-sm text-gray-600 mb-4">
              Continue building your professional portfolio by working toward higher tiers or exploring achievements in other categories.
            </p>
            <div className="flex justify-center space-x-2">
              <Badge variant="secondary" className="text-xs px-3 py-1">
                Keep practicing daily
              </Badge>
              <Badge variant="secondary" className="text-xs px-3 py-1">
                Aim for next tier
              </Badge>
              <Badge variant="secondary" className="text-xs px-3 py-1">
                Share your success
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AchievementCelebration;