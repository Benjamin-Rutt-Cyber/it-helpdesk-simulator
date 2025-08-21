import { personaSelector, SelectionContext } from '../../services/personaSelector';
import { CUSTOMER_PERSONAS } from '../../config/personas';

describe('PersonaSelector', () => {
  const baseSelectionContext: SelectionContext = {
    ticketType: 'email_connectivity',
    ticketPriority: 'medium',
    ticketCategory: 'network',
    complexityLevel: 'moderate',
    learningObjectives: ['troubleshooting', 'communication'],
    userLevel: 2,
    sessionCount: 1,
    timeOfDay: 'afternoon',
    businessHours: true
  };

  describe('selectPersona', () => {
    it('should select appropriate persona for email connectivity issues', async () => {
      const result = await personaSelector.selectPersona(baseSelectionContext);

      expect(result.selectedPersona).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(result.reasoning).toBeInstanceOf(Array);
      expect(result.reasoning.length).toBeGreaterThan(0);
      expect(result.selectionConfidence).toBeGreaterThan(0);

      // Office worker should be a strong candidate for email issues
      const isGoodMatch = result.selectedPersona.id === 'office_worker' || 
                          result.selectedPersona.typical_issues.some(issue => 
                            issue.includes('email') || issue.includes('connectivity')
                          );
      expect(isGoodMatch).toBe(true);
    });

    it('should prefer executive persona for critical priority tickets', async () => {
      const criticalContext: SelectionContext = {
        ...baseSelectionContext,
        ticketPriority: 'critical',
        ticketType: 'system_outage',
        businessHours: false,
        timeOfDay: 'evening'
      };

      const result = await personaSelector.selectPersona(criticalContext);

      // Executive should score highly for critical after-hours issues
      const executiveInTop2 = result.selectedPersona.id === 'executive' ||
                             result.alternatives[0]?.personaId === 'executive';
      
      expect(executiveInTop2).toBe(true);
      expect(result.contextFactors).toContain('after_hours');
      expect(result.contextFactors).toContain('critical_priority');
    });

    it('should select patient retiree for low priority learning scenarios', async () => {
      const learningContext: SelectionContext = {
        ...baseSelectionContext,
        ticketPriority: 'low',
        complexityLevel: 'simple',
        learningObjectives: ['patience', 'detailed_explanation'],
        userLevel: 1
      };

      const result = await personaSelector.selectPersona(learningContext);

      // Patient retiree should be preferred for low priority, simple issues with patience learning
      const patientPersonaInTop3 = [
        result.selectedPersona.id,
        ...result.alternatives.slice(0, 2).map(alt => alt.personaId)
      ].includes('patient_retiree');

      expect(patientPersonaInTop3).toBe(true);
    });

    it('should handle manual persona override', async () => {
      const overrideContext: SelectionContext = {
        ...baseSelectionContext,
        overridePersona: 'frustrated_user'
      };

      const result = await personaSelector.selectPersona(overrideContext);

      expect(result.selectedPersona.id).toBe('frustrated_user');
      expect(result.score).toBe(100);
      expect(result.reasoning).toContain('Manual override specified');
      expect(result.contextFactors).toContain('manual_override');
    });

    it('should apply diversity factors to recent persona usage', async () => {
      const diversityContext: SelectionContext = {
        ...baseSelectionContext,
        previousPersonas: ['office_worker', 'frustrated_user', 'new_employee']
      };

      const result = await personaSelector.selectPersona(diversityContext);

      // Recently used personas should have reduced scores
      expect(result.selectedPersona.id).not.toBe('office_worker'); // Most recently used
      
      const officeWorkerAlternative = result.alternatives.find(alt => alt.personaId === 'office_worker');
      if (officeWorkerAlternative) {
        expect(officeWorkerAlternative.reasoning).toContain('recently used');
      }
    });
  });

  describe('persona scoring algorithm', () => {
    it('should score frustrated user highly for error-related tickets', async () => {
      const errorContext: SelectionContext = {
        ...baseSelectionContext,
        ticketType: 'application_crash',
        ticketCategory: 'software',
        complexityLevel: 'simple',
        learningObjectives: ['de_escalation', 'empathy']
      };

      const result = await personaSelector.selectPersona(errorContext);

      const frustratedUserScore = result.selectedPersona.id === 'frustrated_user' ? 
        result.score : 
        result.alternatives.find(alt => alt.personaId === 'frustrated_user')?.score || 0;

      expect(frustratedUserScore).toBeGreaterThan(60);
    });

    it('should consider user experience level in persona selection', async () => {
      const beginnerContext: SelectionContext = {
        ...baseSelectionContext,
        userLevel: 1,
        learningObjectives: ['basic_troubleshooting', 'patience']
      };

      const expertContext: SelectionContext = {
        ...baseSelectionContext,
        userLevel: 5,
        learningObjectives: ['complex_problem_solving', 'escalation_management']
      };

      const beginnerResult = await personaSelector.selectPersona(beginnerContext);
      const expertResult = await personaSelector.selectPersona(expertContext);

      // Beginner should get more manageable personas (patient_retiree, office_worker)
      const beginnerPersonaTypes = ['patient_retiree', 'office_worker', 'new_employee'];
      expect(beginnerPersonaTypes).toContain(beginnerResult.selectedPersona.id);

      // Expert should get more challenging personas (executive, frustrated_user)
      const expertPersonaTypes = ['executive', 'frustrated_user'];
      const expertGotChallenging = expertPersonaTypes.includes(expertResult.selectedPersona.id) ||
                                  expertResult.alternatives.some(alt => expertPersonaTypes.includes(alt.personaId));
      expect(expertGotChallenging).toBe(true);
    });

    it('should provide meaningful scoring explanations', async () => {
      const result = await personaSelector.selectPersona(baseSelectionContext);

      expect(result.reasoning).toBeInstanceOf(Array);
      expect(result.reasoning.length).toBeGreaterThan(0);
      
      // Check that reasoning contains meaningful explanations
      const hasSpecificReasoning = result.reasoning.some(reason => 
        reason.includes('technical level') || 
        reason.includes('issue') || 
        reason.includes('learning') ||
        reason.includes('complexity')
      );
      expect(hasSpecificReasoning).toBe(true);

      // Check alternatives have reasoning too
      result.alternatives.forEach(alternative => {
        expect(alternative.reasoning).toBeInstanceOf(Array);
        expect(alternative.matchFactors).toBeInstanceOf(Array);
        expect(alternative.confidence).toBeGreaterThan(0);
      });
    });
  });

  describe('contextual factors', () => {
    it('should consider time of day in persona selection', async () => {
      const afterHoursContext: SelectionContext = {
        ...baseSelectionContext,
        timeOfDay: 'night',
        businessHours: false
      };

      const result = await personaSelector.selectPersona(afterHoursContext);

      expect(result.contextFactors).toContain('after_hours');
      
      // Executive might be more likely after hours
      const executiveScore = result.selectedPersona.id === 'executive' ? 
        result.score : 
        result.alternatives.find(alt => alt.personaId === 'executive')?.score || 0;
      
      expect(executiveScore).toBeGreaterThan(30); // Should have decent score
    });

    it('should factor in complexity level appropriately', async () => {
      const complexContext: SelectionContext = {
        ...baseSelectionContext,
        complexityLevel: 'complex',
        ticketType: 'network_infrastructure'
      };

      const result = await personaSelector.selectPersona(complexContext);

      expect(result.contextFactors).toContain('high_complexity');
      
      // Advanced technical level personas should score higher for complex issues
      const selectedPersona = CUSTOMER_PERSONAS[result.selectedPersona.id];
      const isAdvancedOrIntermediate = ['intermediate', 'advanced'].includes(
        selectedPersona.personality.technicalLevel.level
      );
      
      expect(isAdvancedOrIntermediate).toBe(true);
    });
  });

  describe('learning objective alignment', () => {
    it('should align personas with specific learning objectives', async () => {
      const patienceContext: SelectionContext = {
        ...baseSelectionContext,
        learningObjectives: ['patience', 'detailed_explanation', 'step_by_step_guidance'],
        complexityLevel: 'simple'
      };

      const result = await personaSelector.selectPersona(patienceContext);

      // Patient retiree should score highly for patience learning
      const patientRetireeResult = result.selectedPersona.id === 'patient_retiree' ? 
        result : 
        { score: result.alternatives.find(alt => alt.personaId === 'patient_retiree')?.score || 0 };

      expect(patientRetireeResult.score).toBeGreaterThan(50);
    });

    it('should match escalation training with appropriate personas', async () => {
      const escalationContext: SelectionContext = {
        ...baseSelectionContext,
        learningObjectives: ['escalation', 'conflict_resolution', 'business_impact'],
        ticketPriority: 'high'
      };

      const result = await personaSelector.selectPersona(escalationContext);

      // High escalation likelihood personas should be preferred
      const selectedPersona = CUSTOMER_PERSONAS[result.selectedPersona.id];
      expect(selectedPersona.escalation_likelihood).toBeGreaterThan(0.3);
    });
  });

  describe('persona distribution and fairness', () => {
    it('should provide reasonable distribution across multiple selections', async () => {
      const selections: string[] = [];
      
      for (let i = 0; i < 20; i++) {
        const context: SelectionContext = {
          ...baseSelectionContext,
          ticketType: `ticket_${i}`,
          sessionCount: i + 1
        };
        
        const result = await personaSelector.selectPersona(context);
        selections.push(result.selectedPersona.id);
      }

      // Should have selected at least 3 different personas
      const uniquePersonas = new Set(selections);
      expect(uniquePersonas.size).toBeGreaterThanOrEqual(3);

      // No single persona should dominate (>60% of selections)
      const personaCounts = Array.from(uniquePersonas).map(persona => 
        selections.filter(s => s === persona).length
      );
      
      const maxCount = Math.max(...personaCounts);
      expect(maxCount / selections.length).toBeLessThan(0.6);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle missing optional context gracefully', async () => {
      const minimalContext: SelectionContext = {
        ticketType: 'generic_issue',
        ticketPriority: 'medium',
        ticketCategory: 'general'
      };

      const result = await personaSelector.selectPersona(minimalContext);

      expect(result.selectedPersona).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(result.selectionConfidence).toBeGreaterThan(30);
    });

    it('should handle invalid override persona gracefully', async () => {
      const invalidOverrideContext: SelectionContext = {
        ...baseSelectionContext,
        overridePersona: 'nonexistent_persona'
      };

      const result = await personaSelector.selectPersona(invalidOverrideContext);

      // Should fall back to normal selection algorithm
      expect(result.selectedPersona.id).not.toBe('nonexistent_persona');
      expect(Object.keys(CUSTOMER_PERSONAS)).toContain(result.selectedPersona.id);
    });
  });

  describe('selection confidence calculation', () => {
    it('should provide high confidence for clear matches', async () => {
      const clearMatchContext: SelectionContext = {
        ...baseSelectionContext,
        ticketType: 'email_setup',
        ticketCategory: 'email',
        complexityLevel: 'simple',
        userLevel: 1,
        learningObjectives: ['basic_troubleshooting']
      };

      const result = await personaSelector.selectPersona(clearMatchContext);

      expect(result.selectionConfidence).toBeGreaterThan(70);
    });

    it('should provide lower confidence for ambiguous scenarios', async () => {
      const ambiguousContext: SelectionContext = {
        ticketType: 'general_issue',
        ticketPriority: 'medium',
        ticketCategory: 'mixed',
        complexityLevel: 'moderate'
      };

      const result = await personaSelector.selectPersona(ambiguousContext);

      // Should still make a selection but with lower confidence
      expect(result.selectedPersona).toBeDefined();
      expect(result.selectionConfidence).toBeLessThan(80);
    });
  });
});