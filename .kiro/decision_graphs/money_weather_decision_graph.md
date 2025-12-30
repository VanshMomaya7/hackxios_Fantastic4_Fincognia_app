# Money Weather – Decision Graph

## Input Signal Architecture

The Money Weather agent processes four primary signal categories to assess cashflow risk probability and timing for irregular income users.

### Aggregated Cashflow Signals

**Income Stream Analysis**

- Historical income patterns across all sources with confidence intervals
- Payment timing reliability by source (client payment delays, platform processing times)
- Income correlation patterns between different sources
- Seasonal and cyclical income variations with statistical significance

**Expense Obligation Mapping**

- Fixed obligations with specific due dates and penalty structures
- Variable expense patterns with probability distributions
- Emergency expense probability based on historical patterns and external risk factors
- Discretionary expense elasticity under cash constraints

**Liquidity Position Assessment**

- Current liquid assets available for obligation fulfillment
- Credit facility availability and utilization patterns
- Asset liquidation options with time and cost constraints
- Emergency fund adequacy relative to obligation timing

### Timing Uncertainty Quantification

**Income Receipt Probability Windows**

- Probability distributions for payment receipt by time period
- Client-specific payment delay patterns and reliability scores
- Platform processing time variations and failure rates
- Seasonal payment timing shifts and holiday effects

**Expense Obligation Timing**

- Fixed payment due dates with grace period analysis
- Variable expense timing probability based on historical patterns
- Penalty assessment timing and compound effect calculations
- Expense deferral options and associated costs

**Cash Flow Gap Analysis**

- Probability of negative cash position by time period
- Duration and severity probability distributions for cash shortfalls
- Recovery time probability based on expected income patterns
- Compound effect analysis of timing mismatches

### Seasonality and External Cues

**Economic Cycle Indicators**

- Sector-specific demand patterns affecting income probability
- Regional economic conditions impacting client payment capacity
- Regulatory changes affecting income source reliability
- Market conditions affecting gig economy demand

**Personal Cycle Recognition**

- Individual income seasonality patterns with confidence levels
- Life event impacts on income and expense patterns
- Health and family obligation cycles affecting earning capacity
- Professional development cycles affecting income potential

## Risk Assessment Logic Framework

Risk assessment operates through probability-weighted severity analysis across multiple time horizons, accounting for both direct cashflow impacts and compound effects.

### Probability Assessment Methodology

**Income Shortfall Probability Calculation**

- Bayesian updating of income probability based on recent payment patterns
- Correlation analysis between different income sources for diversification assessment
- External factor weighting based on economic and seasonal indicators
- Confidence interval calculation for probability estimates

**Expense Spike Probability Analysis**

- Historical emergency expense frequency and severity patterns
- Predictable expense timing with probability confidence levels
- Correlation between income stress and emergency expense probability
- Compound expense effect probability (cascading financial obligations)

**Liquidity Crisis Probability Modeling**

- Cash position probability distributions across time horizons
- Obligation fulfillment probability given current and projected liquidity
- Credit access probability under different stress scenarios
- Asset liquidation feasibility and timing constraints

### Severity Impact Assessment

**Direct Financial Impact Quantification**

- Penalty and interest costs for missed obligations
- Credit score impact probability and recovery time analysis
- Emergency borrowing costs and availability constraints
- Opportunity cost of suboptimal financial decisions under stress

**Compound Effect Analysis**

- Cascading obligation failures and their probability chains
- Long-term financial health impact of short-term liquidity crises
- Behavioral impact of financial stress on earning capacity
- Recovery time probability and resource requirements

**Systemic Risk Amplification**

- Correlation between user's risk factors and broader economic conditions
- Concentration risk in income sources and geographic exposure
- Regulatory and policy change impacts on user's financial stability
- Network effects of financial stress in user's economic ecosystem

## Risk Threshold Band Definitions

Risk classification operates through three distinct bands with specific probability and severity thresholds that trigger different agent responses.

### Low Risk Band (Green Zone)

**Probability Thresholds**

- Cashflow shortfall probability below 15% for next 30 days
- Severe liquidity crisis probability below 5% for next 90 days
- Obligation fulfillment confidence above 85% for all fixed commitments
- Emergency expense coverage probability above 70% with current liquidity

**Severity Constraints**

- Potential financial impact below 10% of monthly average income
- Recovery time for any shortfall below 14 days with high confidence
- No compound effect probability above 5% for any identified risk
- Credit score impact probability below 2% for any scenario

**Operational Meaning**

- Normal financial operations can continue without intervention
- Standard financial planning recommendations apply
- Routine monitoring sufficient without active alerts
- User agency preserved for all financial decisions

### Medium Risk Band (Yellow Zone)

**Probability Thresholds**

- Cashflow shortfall probability between 15-40% for next 30 days
- Severe liquidity crisis probability between 5-20% for next 90 days
- Obligation fulfillment confidence between 60-85% for fixed commitments
- Emergency expense coverage probability between 40-70% with current liquidity

**Severity Constraints**

- Potential financial impact between 10-25% of monthly average income
- Recovery time for shortfall between 14-45 days with moderate confidence
- Compound effect probability between 5-15% for identified risks
- Credit score impact probability between 2-8% for various scenarios

**Operational Meaning**

- Proactive risk mitigation recommendations required
- Enhanced monitoring and early warning systems activated
- User education about risk factors and mitigation options
- Preparation for potential escalation to high risk status

### High Risk Band (Red Zone)

**Probability Thresholds**

- Cashflow shortfall probability above 40% for next 30 days
- Severe liquidity crisis probability above 20% for next 90 days
- Obligation fulfillment confidence below 60% for fixed commitments
- Emergency expense coverage probability below 40% with current liquidity

**Severity Constraints**

- Potential financial impact above 25% of monthly average income
- Recovery time for shortfall above 45 days or uncertain
- Compound effect probability above 15% for identified risks
- Credit score impact probability above 8% for likely scenarios

**Operational Meaning**

- Immediate intervention recommendations required
- Crisis prevention measures must be activated
- User agency may need to be constrained to prevent harm
- Escalation to external resources may be necessary

## Decision Branch Logic

Agent decision-making follows deterministic logic trees based on risk assessment, user context, and intervention effectiveness probability.

### Warning Decision Logic

**Warning Trigger Conditions**

- Medium risk threshold breach with intervention window above 7 days
- High risk probability increase above 10 percentage points within 48 hours
- New risk factor identification with compound effect probability above 10%
- Seasonal risk pattern activation with historical precedent for user harm

**Warning Content Determination**

- Specific risk factor identification with probability confidence levels
- Time horizon for risk materialization with confidence intervals
- Available mitigation options ranked by effectiveness probability
- Consequence severity explanation with quantified impact ranges

**Warning Timing Optimization**

- Sufficient advance notice for effective user response (minimum 3-7 days)
- Alignment with user's decision-making capacity and attention availability
- Coordination with other financial obligations and stress factors
- Avoidance of warning fatigue through strategic timing intervals

### Escalation Decision Logic

**Escalation Trigger Conditions**

- High risk threshold breach with user inaction for 48+ hours
- Compound risk factor activation with cascading failure probability above 25%
- External crisis indicators affecting user's income sources with high confidence
- Historical pattern recognition indicating user's inability to self-mitigate effectively

**Escalation Response Determination**

- Severity of intervention required based on potential harm magnitude
- External resource activation (credit counseling, emergency assistance programs)
- User agency override justification based on harm prevention necessity
- Recovery plan development with specific milestone and timeline requirements

**Escalation Timing Constraints**

- Immediate escalation for imminent harm (within 24-48 hours)
- Graduated escalation for developing crises with intervention windows
- Coordination with external systems and resource availability
- User notification and consent processes within time constraints

### Silence Decision Logic

**No-Action Trigger Conditions**

- Low risk threshold maintenance with stable trend indicators
- Medium risk with effective user mitigation already in progress
- High uncertainty in risk assessment with insufficient confidence for action
- User-demonstrated competence in handling similar risk scenarios independently

**Silence Justification Requirements**

- Risk level below intervention threshold with statistical confidence
- User agency preservation outweighs potential harm prevention benefits
- Intervention effectiveness probability below 30% based on user history
- False positive harm potential exceeds true positive benefit probability

## No-Action Zones and False Positive Harm

Inappropriate agent intervention creates measurable harm that must be weighed against risk mitigation benefits.

### False Positive Harm Categories

**User Trust Degradation**

- Incorrect risk assessments reduce user confidence in agent reliability
- Over-alerting creates warning fatigue and reduces response to genuine risks
- Premature escalation damages user autonomy and financial decision-making confidence
- Inaccurate probability communication creates miscalibrated user risk perception

**Behavioral Disruption**

- Unnecessary warnings create financial anxiety and stress responses
- False urgency leads to suboptimal financial decisions under artificial time pressure
- Over-intervention prevents user development of independent risk management skills
- Inappropriate escalation creates external intervention when user capacity is sufficient

**Opportunity Cost Imposition**

- False warnings consume user attention and decision-making capacity
- Unnecessary risk mitigation actions divert resources from optimal allocation
- Premature intervention prevents user learning from manageable risk exposure
- Over-conservative recommendations reduce user financial growth potential

### No-Action Zone Boundaries

**Uncertainty Threshold Management**

- Risk assessment confidence below 60% triggers no-action evaluation
- Probability range width above 30 percentage points indicates insufficient data
- Conflicting signal analysis requires additional data collection before action
- Model disagreement above 20 percentage points necessitates silence until resolution

**User Competence Recognition**

- Historical successful risk management by user in similar scenarios
- Demonstrated user knowledge and capability for independent risk assessment
- User-initiated risk mitigation already in progress with reasonable effectiveness probability
- User preference for autonomy outweighs marginal risk reduction benefits

**Intervention Effectiveness Thresholds**

- Available interventions with effectiveness probability below 40% trigger no-action
- User response probability to warnings below 50% based on historical patterns
- External resource availability insufficient for meaningful escalation support
- Cost-benefit analysis favoring user agency preservation over risk mitigation

## Temporal Reasoning Framework

Risk assessment and intervention logic operate across three distinct time horizons with different probability confidence levels and intervention strategies.

### Near-Term Risk Assessment (0-30 days)

**High Confidence Indicators**

- Known income receipt schedules with historical reliability data
- Fixed obligation due dates with established penalty structures
- Current liquidity position with precise measurement
- Immediate expense obligations with confirmed timing and amounts

**Decision Logic Characteristics**

- Higher intervention threshold due to greater prediction confidence
- Specific actionable recommendations with clear implementation timelines
- Direct cause-effect relationships with measurable outcomes
- User agency preservation through precise information provision

**Intervention Timing Requirements**

- Minimum 3-day advance notice for user response capability
- Maximum 7-day advance notice to maintain relevance and urgency
- Coordination with user's existing financial planning and decision cycles
- Alignment with external system processing times and availability

### Mid-Term Risk Assessment (30-90 days)

**Moderate Confidence Indicators**

- Seasonal income patterns with historical precedent but environmental uncertainty
- Probable expense obligations based on historical patterns and life cycle analysis
- Credit facility availability with policy and market condition dependencies
- Economic condition impacts with sector-specific probability assessments

**Decision Logic Characteristics**

- Lower intervention threshold due to reduced prediction confidence
- Broader risk mitigation strategies with multiple contingency options
- Probabilistic outcome communication with explicit uncertainty ranges
- Enhanced user education about risk factors and mitigation principles

**Intervention Timing Requirements**

- Minimum 7-day advance notice for complex user response development
- Maximum 21-day advance notice to maintain actionability and relevance
- Coordination with seasonal planning cycles and external resource availability
- Integration with user's medium-term financial planning and goal adjustment

### Long-Term Risk Assessment (90+ days)

**Low Confidence Indicators**

- Economic cycle predictions with high uncertainty and external dependency
- Life event probability based on demographic and historical patterns
- Regulatory and policy change impacts with political and economic uncertainty
- Career and income development trajectories with multiple variable dependencies

**Decision Logic Characteristics**

- Educational focus rather than specific intervention recommendations
- Scenario planning and contingency development rather than precise predictions
- User capacity building for independent long-term risk management
- System resilience development rather than specific risk mitigation

**Intervention Timing Requirements**

- Minimum 30-day advance notice for strategic planning and preparation
- Maximum 180-day advance notice to maintain relevance and prevent obsolescence
- Coordination with annual planning cycles and major life decision timing
- Integration with user's long-term financial goals and life planning processes

## Explanation Requirements vs Inference Permissions

The agent operates under strict transparency requirements for certain decisions while maintaining inference flexibility for others.

### Mandatory Explanation Categories

**Risk Assessment Methodology**

- Probability calculation basis with data source identification and confidence levels
- Severity assessment logic with impact quantification methodology
- Threshold determination reasoning with historical precedent and user-specific factors
- Temporal reasoning basis with prediction confidence and uncertainty acknowledgment

**Intervention Recommendations**

- Specific action recommendations with effectiveness probability and implementation requirements
- Alternative option analysis with comparative risk-benefit assessment
- Resource requirement identification with availability and cost analysis
- Timeline and milestone specification with success measurement criteria

**Escalation Justification**

- Harm prevention necessity with quantified risk and impact analysis
- User agency override justification with proportionality assessment
- External resource activation reasoning with capability and availability confirmation
- Recovery plan rationale with milestone achievement probability and timeline requirements

### Permitted Inference Categories

**User Behavior Prediction**

- Response probability to different intervention types based on historical patterns
- Decision-making capacity assessment under different stress and time constraint conditions
- Risk tolerance calibration based on observed behavior and stated preferences
- Learning and adaptation patterns for risk management skill development

**External Factor Assessment**

- Economic condition impacts on user's specific income sources and financial stability
- Regulatory and policy change effects on user's financial planning and obligation management
- Market condition influences on user's earning capacity and expense management
- Social and family network effects on user's financial resilience and resource availability

**System Optimization**

- Intervention timing optimization based on user response patterns and external constraints
- Communication strategy adaptation based on user comprehension and engagement patterns
- Resource allocation optimization based on user needs and system capacity constraints
- Learning algorithm adjustment based on prediction accuracy and user outcome analysis

The fundamental principle is transparency for all decisions affecting user agency while maintaining flexibility for system optimization and user experience enhancement that does not constrain user choice or impose financial obligations.

┌─────────────────────────────────────────────────────────────────┐
│ INPUT AGGREGATION │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ Cashflow Signals│ │Timing Uncertainty│ │Seasonality Cues │ │
│ │- Income streams │ │- Payment windows │ │- Economic cycles│ │
│ │- Expense oblig. │ │- Obligation timing│ │- Personal cycles│ │
│ │- Liquidity pos. │ │- Cash flow gaps │ │- External factors│ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────────┐
│ RISK ASSESSMENT │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ • Probability calculation (Bayesian updating) │ │
│ │ • Severity impact assessment (direct + compound effects) │ │
│ │ • Confidence interval determination │ │
│ │ • Temporal horizon analysis (0-30, 30-90, 90+ days) │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────────┐
│ THRESHOLD EVALUATION │
└─────────────────────────────────────────────────────────────────┘
│
┌─────────────┼─────────────┐
▼ ▼ ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
│ LOW RISK │ │MEDIUM RISK │ │ HIGH RISK │
│ (Green Zone) │ │(Yellow Zone)│ │ (Red Zone) │
│ │ │ │ │ │
│ <15% shortfall │ │15-40% │ │ >40% shortfall │
│ probability │ │shortfall │ │ probability │
│ 30-day horizon │ │probability │ │ 30-day horizon │
└─────────────────┘ └─────────────┘ └─────────────────┘
│ │ │
▼ ▼ ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
│ NO ACTION │ │ WARNING │ │ ESCALATION │
│ │ │ │ │ │
│ • Confidence │ │ • Risk │ │ • Immediate │
│ <60% OR │ │ factor │ │ intervention │
│ • User │ │ ID │ │ • External │
│ competence │ │ • Mitigation│ │ resource │
│ demonstrated │ │ options │ │ activation │
│ • False positive│ │ • Timeline │ │ • User agency │
│ harm risk │ │ for action│ │ override │
└─────────────────┘ └─────────────┘ └─────────────────┘
│ │ │
▼ ▼ ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
│ CONTINUE │ │ MONITOR │ │ CRISIS │
│ MONITORING │ │ RESPONSE │ │ MANAGEMENT │
│ │ │ │ │ │
│ • Routine │ │ • Enhanced │ │ • Recovery │
│ assessment │ │ tracking │ │ plan │
│ • User agency │ │ • User │ │ • Milestone │
│ preserved │ │ education │ │ tracking │
│ │ │ • Prep for │ │ • External │
│ │ │ escalation│ │ coordination │
└─────────────────┘ └─────────────┘ └─────────────────┘
