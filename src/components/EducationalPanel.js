// src/components/educational-panel.js

/**
 * @file EducationalPanel.js
 * @author Algorithm Visualization Platform Team
 * @version 2.0.0
 * @description 
 * Advanced interactive educational component for algorithm explanation
 * with progressive complexity disclosure and dynamic step analysis.
 * 
 * This component implements a multi-layered pedagogical approach to algorithm
 * explanation, featuring mathematical complexity analysis, step-by-step operation
 * clarification, historical context, and practical applications - all synchronized
 * with the visualizer's current state.
 * 
 * Visualization-pedagogy integration techniques employed include:
 * - Synchronized code highlighting with execution state
 * - Progressive complexity disclosure based on user expertise level
 * - Mathematical foundations with LaTeX-style rendering
 * - Just-in-time concept explanation with context awareness
 * - Dynamic complexity visualization with amortized analysis
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { MathJax, MathJaxContext } from 'better-react-mathjax';

// Import algorithmic content libraries
import AlgorithmExplanationFactory from '../education/algorithm-explanation-factory';
import PseudocodeHighlighter from '../education/pseudocode-highlighter';
import ComplexityVisualizer from '../education/complexity-visualizer';
import ConceptRegistry from '../education/concept-registry';

/**
 * Expertise levels for progressive disclosure of complexity
 * @readonly
 * @enum {string}
 */
const ExpertiseLevel = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  THEORETICAL: 'theoretical'
};

/**
 * Topic sections available in the panel
 * @readonly
 * @enum {string}
 */
const TopicSection = {
  OVERVIEW: 'overview',
  COMPLEXITY: 'complexity',
  CURRENT_STEP: 'current-step',
  PSEUDOCODE: 'pseudocode',
  MATHEMATICAL_FOUNDATION: 'mathematical-foundation',
  HISTORICAL_CONTEXT: 'historical-context',
  PRACTICAL_APPLICATIONS: 'practical-applications',
  VARIATIONS: 'variations',
  OPTIMIZATIONS: 'optimizations'
};

/**
 * Educational explanation panel for algorithm visualization
 * 
 * Provides dynamic, context-sensitive explanations synchronized with algorithm execution
 * state, including interactive complexity analysis, pseudocode highlighting, and
 * progressive disclosure of theoretical foundations.
 * 
 * @component
 */
const EducationalPanel = ({
  algorithm,
  currentStep,
  totalSteps,
  stepData,
  metrics,
  isPlaying,
  onStepExplanationRequest,
  onComparisonRequest,
}) => {
  // State management
  const [expertiseLevel, setExpertiseLevel] = useState(ExpertiseLevel.INTERMEDIATE);
  const [expandedSections, setExpandedSections] = useState({
    [TopicSection.OVERVIEW]: true,
    [TopicSection.COMPLEXITY]: true,
    [TopicSection.CURRENT_STEP]: true,
    [TopicSection.PSEUDOCODE]: false,
    [TopicSection.MATHEMATICAL_FOUNDATION]: false,
    [TopicSection.HISTORICAL_CONTEXT]: false,
    [TopicSection.PRACTICAL_APPLICATIONS]: false,
    [TopicSection.VARIATIONS]: false,
    [TopicSection.OPTIMIZATIONS]: false
  });
  const [relatedConcepts, setRelatedConcepts] = useState([]);
  const [currentConcept, setCurrentConcept] = useState(null);
  const [isConceptModalOpen, setIsConceptModalOpen] = useState(false);
  
  // Computed values
  const algorithmInfo = useMemo(() => {
    if (!algorithm) return null;
    return algorithm.getInfo ? algorithm.getInfo() : { name: algorithm.name };
  }, [algorithm]);
  
  // Generate explanation content based on current algorithm
  const explanationFactory = useMemo(() => {
    if (!algorithm) return null;
    return new AlgorithmExplanationFactory(algorithm, expertiseLevel);
  }, [algorithm, expertiseLevel]);
  
  // Extract current step operation for focused explanation
  const currentOperation = useMemo(() => {
    if (!stepData) return null;
    return stepData.type || 'unknown';
  }, [stepData]);
  
  // Generate complexity analysis with appropriate level of mathematical detail
  const complexityAnalysis = useMemo(() => {
    if (!algorithm || !explanationFactory) return null;
    return explanationFactory.generateComplexityAnalysis();
  }, [algorithm, explanationFactory]);
  
  // Extract pseudocode with synchronized highlighting based on current step
  const pseudocodeWithHighlighting = useMemo(() => {
    if (!algorithm || !stepData || !explanationFactory) return null;
    return explanationFactory.generatePseudocodeWithHighlighting(stepData);
  }, [algorithm, stepData, explanationFactory]);
  
  /**
   * Identify relevant theoretical concepts based on current operation
   */
  useEffect(() => {
    if (!currentOperation || !stepData) return;
    
    // Identify concepts relevant to current operation
    const concepts = ConceptRegistry.findRelevantConcepts(
      algorithm?.name,
      currentOperation,
      stepData,
      expertiseLevel
    );
    
    setRelatedConcepts(concepts);
  }, [algorithm, currentOperation, stepData, expertiseLevel]);
  
  /**
   * Toggle section expansion state
   * @param {string} section - Section identifier to toggle
   */
  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);
  
  /**
   * Change expertise level for explanation depth
   * @param {Event} event - Change event from select input
   */
  const handleExpertiseLevelChange = useCallback((event) => {
    setExpertiseLevel(event.target.value);
  }, []);
  
  /**
   * Open concept explanation modal
   * @param {Object} concept - Concept to explain
   */
  const openConceptExplanation = useCallback((concept) => {
    setCurrentConcept(concept);
    setIsConceptModalOpen(true);
  }, []);
  
  /**
   * Request detailed step explanation from parent component
   */
  const requestStepExplanation = useCallback(() => {
    if (onStepExplanationRequest && stepData) {
      onStepExplanationRequest(stepData);
    }
  }, [onStepExplanationRequest, stepData]);
  
  /**
   * Request algorithm comparison from parent component
   * @param {string} otherAlgorithm - Algorithm to compare with current one
   */
  const requestComparison = useCallback((otherAlgorithm) => {
    if (onComparisonRequest && algorithm) {
      onComparisonRequest(algorithm.name, otherAlgorithm);
    }
  }, [onComparisonRequest, algorithm]);
  
  // Don't render without an algorithm
  if (!algorithm) {
    return (
      <div className="educational-panel empty-state">
        <p>Select an algorithm to see educational content.</p>
      </div>
    );
  }
  
  return (
    <MathJaxContext>
      <div className="educational-panel">
        {/* Header with expertise level selector */}
        <div className="panel-header">
          <h2 className="algorithm-title">{algorithmInfo?.name || 'Algorithm'} Explanation</h2>
          
          <div className="expertise-selector">
            <label htmlFor="expertise-level">Explanation Level:</label>
            <select 
              id="expertise-level" 
              value={expertiseLevel} 
              onChange={handleExpertiseLevelChange}
              className="expertise-select"
            >
              <option value={ExpertiseLevel.BEGINNER}>Beginner</option>
              <option value={ExpertiseLevel.INTERMEDIATE}>Intermediate</option>
              <option value={ExpertiseLevel.ADVANCED}>Advanced</option>
              <option value={ExpertiseLevel.THEORETICAL}>Theoretical</option>
            </select>
          </div>
        </div>
        
        {/* Main content sections */}
        <div className="panel-content">
          {/* Algorithm Overview Section */}
          <Section 
            title="Algorithm Overview" 
            isExpanded={expandedSections[TopicSection.OVERVIEW]} 
            onToggle={() => toggleSection(TopicSection.OVERVIEW)}
          >
            {explanationFactory ? (
              <div className="overview-content">
                {explanationFactory.generateOverview()}
                
                {/* Key algorithm characteristics */}
                <div className="algorithm-properties">
                  <div className="property">
                    <span className="property-label">Type:</span> 
                    <span className="property-value">{algorithmInfo?.category || 'N/A'}</span>
                  </div>
                  <div className="property">
                    <span className="property-label">Stable:</span> 
                    <span className="property-value">{algorithmInfo?.stability ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="property">
                    <span className="property-label">In-Place:</span> 
                    <span className="property-value">{algorithmInfo?.inPlace ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p>Loading algorithm information...</p>
            )}
          </Section>
          
          {/* Complexity Analysis Section */}
          <Section 
            title="Complexity Analysis" 
            isExpanded={expandedSections[TopicSection.COMPLEXITY]} 
            onToggle={() => toggleSection(TopicSection.COMPLEXITY)}
          >
            {complexityAnalysis ? (
              <div className="complexity-content">
                <div className="complexity-tables">
                  <div className="complexity-table time">
                    <h4>Time Complexity</h4>
                    <table>
                      <tbody>
                        <tr>
                          <td>Best Case:</td>
                          <td>
                            <MathJax>
                              {complexityAnalysis.time.best.expression}
                            </MathJax>
                          </td>
                        </tr>
                        <tr>
                          <td>Average Case:</td>
                          <td>
                            <MathJax>
                              {complexityAnalysis.time.average.expression}
                            </MathJax>
                          </td>
                        </tr>
                        <tr>
                          <td>Worst Case:</td>
                          <td>
                            <MathJax>
                              {complexityAnalysis.time.worst.expression}
                            </MathJax>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="complexity-table space">
                    <h4>Space Complexity</h4>
                    <table>
                      <tbody>
                        <tr>
                          <td>Auxiliary Space:</td>
                          <td>
                            <MathJax>
                              {complexityAnalysis.space.auxiliary.expression}
                            </MathJax>
                          </td>
                        </tr>
                        <tr>
                          <td>Total Space:</td>
                          <td>
                            <MathJax>
                              {complexityAnalysis.space.total.expression}
                            </MathJax>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Detailed complexity explanation */}
                <div className="complexity-explanation">
                  <h4>Explanation</h4>
                  <div className="selected-case-explanation">
                    {expertiseLevel === ExpertiseLevel.BEGINNER ? (
                      <p>{complexityAnalysis.simplified}</p>
                    ) : (
                      <div>
                        <p>{complexityAnalysis.detailed}</p>
                        
                        {expertiseLevel === ExpertiseLevel.THEORETICAL && (
                          <div className="mathematical-proof">
                            <h5>Mathematical Derivation</h5>
                            <MathJax>
                              {complexityAnalysis.mathematicalDerivation}
                            </MathJax>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Visual complexity comparison */}
                  {expertiseLevel !== ExpertiseLevel.BEGINNER && (
                    <div className="complexity-visualization">
                      <h4>Growth Rate Visualization</h4>
                      <ComplexityVisualizer 
                        algorithm={algorithm.name}
                        width={400}
                        height={200}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p>Loading complexity analysis...</p>
            )}
          </Section>
          
          {/* Current Step Explanation Section */}
          <Section 
            title="Current Step Explanation" 
            isExpanded={expandedSections[TopicSection.CURRENT_STEP]} 
            onToggle={() => toggleSection(TopicSection.CURRENT_STEP)}
          >
            {stepData ? (
              <div className="step-explanation">
                <div className="step-info">
                  <div className="step-progress">
                    <span className="step-count">Step {currentStep} of {totalSteps}</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-indicator" 
                        style={{ width: `${(currentStep / totalSteps) * 100}%` }} 
                      />
                    </div>
                  </div>
                  
                  <div className="operation-details">
                    <span className="operation-type">Operation: {stepData.type}</span>
                    {stepData.indices && (
                      <span className="operation-indices">Indices: {stepData.indices.join(', ')}</span>
                    )}
                  </div>
                </div>
                
                {/* Operation explanation with appropriate detail level */}
                <div className="operation-explanation">
                  {explanationFactory ? 
                    explanationFactory.generateStepExplanation(stepData, currentStep, totalSteps) : 
                    <p>{stepData.message || 'No detailed explanation available.'}</p>
                  }
                </div>
                
                {/* Related algorithmic concepts for this operation */}
                {relatedConcepts.length > 0 && (
                  <div className="related-concepts">
                    <h4>Related Concepts</h4>
                    <ul className="concept-list">
                      {relatedConcepts.map(concept => (
                        <li key={concept.id} className="concept-item">
                          <button 
                            className="concept-link"
                            onClick={() => openConceptExplanation(concept)}
                          >
                            {concept.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p>No step data available. Start the algorithm to see step-by-step explanation.</p>
            )}
          </Section>
          
          {/* Pseudocode Section */}
          <Section 
            title="Pseudocode" 
            isExpanded={expandedSections[TopicSection.PSEUDOCODE]} 
            onToggle={() => toggleSection(TopicSection.PSEUDOCODE)}
          >
            {pseudocodeWithHighlighting ? (
              <div className="pseudocode-container">
                <PseudocodeHighlighter 
                  code={pseudocodeWithHighlighting.code}
                  currentLine={pseudocodeWithHighlighting.currentLine}
                  executingLines={pseudocodeWithHighlighting.executingLines}
                  variables={pseudocodeWithHighlighting.variables}
                />
              </div>
            ) : (
              <p>Loading pseudocode...</p>
            )}
          </Section>
          
          {/* Conditional sections shown only at higher expertise levels */}
          {expertiseLevel !== ExpertiseLevel.BEGINNER && (
            <>
              {/* Mathematical Foundation Section */}
              <Section 
                title="Mathematical Foundation" 
                isExpanded={expandedSections[TopicSection.MATHEMATICAL_FOUNDATION]} 
                onToggle={() => toggleSection(TopicSection.MATHEMATICAL_FOUNDATION)}
              >
                {explanationFactory ? (
                  <div className="mathematical-foundation">
                    {explanationFactory.generateMathematicalFoundation()}
                  </div>
                ) : (
                  <p>Loading mathematical foundations...</p>
                )}
              </Section>
              
              {/* Historical Context Section */}
              <Section 
                title="Historical Context" 
                isExpanded={expandedSections[TopicSection.HISTORICAL_CONTEXT]} 
                onToggle={() => toggleSection(TopicSection.HISTORICAL_CONTEXT)}
              >
                {explanationFactory ? (
                  <div className="historical-context">
                    {explanationFactory.generateHistoricalContext()}
                  </div>
                ) : (
                  <p>Loading historical context...</p>
                )}
              </Section>
            </>
          )}
          
          {/* Practical Applications Section */}
          <Section 
            title="Practical Applications" 
            isExpanded={expandedSections[TopicSection.PRACTICAL_APPLICATIONS]} 
            onToggle={() => toggleSection(TopicSection.PRACTICAL_APPLICATIONS)}
          >
            {explanationFactory ? (
              <div className="practical-applications">
                {explanationFactory.generatePracticalApplications()}
              </div>
            ) : (
              <p>Loading practical applications...</p>
            )}
          </Section>
          
          {/* Algorithm Variations Section */}
          <Section 
            title="Variations & Related Algorithms" 
            isExpanded={expandedSections[TopicSection.VARIATIONS]} 
            onToggle={() => toggleSection(TopicSection.VARIATIONS)}
          >
            {explanationFactory && algorithmInfo?.variants ? (
              <div className="algorithm-variations">
                <ul className="variations-list">
                  {algorithmInfo.variants.map((variant, index) => (
                    <li key={index} className="variant-item">
                      <div className="variant-name">{variant}</div>
                      <div className="variant-description">
                        {explanationFactory.generateVariantDescription(variant)}
                      </div>
                    </li>
                  ))}
                </ul>
                
                <div className="related-algorithms">
                  <h4>Related Algorithms</h4>
                  <ul className="related-algorithms-list">
                    {explanationFactory.getRelatedAlgorithms().map((algo, index) => (
                      <li key={index} className="related-algorithm-item">
                        <button 
                          className="algorithm-comparison-btn"
                          onClick={() => requestComparison(algo.name)}
                        >
                          Compare with {algo.name}
                        </button>
                        <span className="relationship-type">({algo.relationship})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p>Loading algorithm variations...</p>
            )}
          </Section>
          
          {/* Optimizations Section - Advanced expertise levels only */}
          {(expertiseLevel === ExpertiseLevel.ADVANCED || expertiseLevel === ExpertiseLevel.THEORETICAL) && (
            <Section 
              title="Optimizations & Implementation Details" 
              isExpanded={expandedSections[TopicSection.OPTIMIZATIONS]} 
              onToggle={() => toggleSection(TopicSection.OPTIMIZATIONS)}
            >
              {explanationFactory ? (
                <div className="algorithm-optimizations">
                  {explanationFactory.generateOptimizationDetails()}
                  
                  {/* Implementation considerations */}
                  <div className="implementation-considerations">
                    <h4>Implementation Considerations</h4>
                    {explanationFactory.generateImplementationConsiderations()}
                  </div>
                  
                  {/* Hardware aspects for theoretical level */}
                  {expertiseLevel === ExpertiseLevel.THEORETICAL && (
                    <div className="hardware-considerations">
                      <h4>Hardware Considerations</h4>
                      {explanationFactory.generateHardwareConsiderations()}
                    </div>
                  )}
                </div>
              ) : (
                <p>Loading optimization details...</p>
              )}
            </Section>
          )}
        </div>
        
        {/* Concept explanation modal */}
        <ConceptModal 
          concept={currentConcept}
          isOpen={isConceptModalOpen}
          onClose={() => setIsConceptModalOpen(false)}
          expertiseLevel={expertiseLevel}
        />
      </div>
    </MathJaxContext>
  );
};

/**
 * Collapsible section component with toggle functionality
 * 
 * @component
 */
const Section = ({ title, children, isExpanded, onToggle }) => (
  <div className={`panel-section ${isExpanded ? 'expanded' : 'collapsed'}`}>
    <div className="section-header" onClick={onToggle}>
      <h3>{title}</h3>
      <span className="toggle-icon">{isExpanded ? '▼' : '►'}</span>
    </div>
    {isExpanded && (
      <div className="section-content">
        {children}
      </div>
    )}
  </div>
);

/**
 * Modal component for displaying detailed concept explanations
 * 
 * @component
 */
const ConceptModal = ({ concept, isOpen, onClose, expertiseLevel }) => {
  if (!isOpen || !concept) return null;
  
  return (
    <div className="concept-modal-overlay">
      <div className="concept-modal">
        <div className="concept-modal-header">
          <h3>{concept.name}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="concept-modal-content">
          <MathJaxContext>
            <div className="concept-definition">
              <h4>Definition</h4>
              <p>{concept.getDefinition(expertiseLevel)}</p>
            </div>
            
            <div className="concept-explanation">
              <h4>Explanation</h4>
              <div>{concept.getExplanation(expertiseLevel)}</div>
            </div>
            
            {expertiseLevel !== ExpertiseLevel.BEGINNER && (
              <div className="concept-mathematics">
                <h4>Mathematical Foundation</h4>
                <MathJax>
                  {concept.getMathematicalRepresentation(expertiseLevel)}
                </MathJax>
              </div>
            )}
            
            <div className="concept-examples">
              <h4>Examples</h4>
              <div>{concept.getExamples(expertiseLevel)}</div>
            </div>
            
            <div className="concept-applications">
              <h4>Applications</h4>
              <ul>
                {concept.getApplications(expertiseLevel).map((app, index) => (
                  <li key={index}>{app}</li>
                ))}
              </ul>
            </div>
            
            {expertiseLevel === ExpertiseLevel.THEORETICAL && (
              <div className="concept-further-reading">
                <h4>Further Reading</h4>
                <ul>
                  {concept.getFurtherReading().map((source, index) => (
                    <li key={index}>
                      {source.authors} ({source.year}). <em>{source.title}</em>. {source.publication}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </MathJaxContext>
        </div>
      </div>
    </div>
  );
};

// PropTypes for type checking
EducationalPanel.propTypes = {
  /** Current algorithm instance */
  algorithm: PropTypes.object,
  /** Current step in the algorithm execution */
  currentStep: PropTypes.number,
  /** Total number of steps in the algorithm execution */
  totalSteps: PropTypes.number,
  /** Data for the current step */
  stepData: PropTypes.object,
  /** Performance metrics for the algorithm */
  metrics: PropTypes.object,
  /** Whether the algorithm is currently playing */
  isPlaying: PropTypes.bool,
  /** Callback for requesting detailed step explanation */
  onStepExplanationRequest: PropTypes.func,
  /** Callback for requesting algorithm comparison */
  onComparisonRequest: PropTypes.func
};

Section.propTypes = {
  /** Section title */
  title: PropTypes.string.isRequired,
  /** Section content */
  children: PropTypes.node.isRequired,
  /** Whether the section is expanded */
  isExpanded: PropTypes.bool.isRequired,
  /** Toggle function for expanding/collapsing */
  onToggle: PropTypes.func.isRequired
};

ConceptModal.propTypes = {
  /** Concept to explain */
  concept: PropTypes.object,
  /** Whether the modal is open */
  isOpen: PropTypes.bool.isRequired,
  /** Close function for the modal */
  onClose: PropTypes.func.isRequired,
  /** Current expertise level */
  expertiseLevel: PropTypes.string.isRequired
};

export default EducationalPanel;
