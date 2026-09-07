import { 
  ScientificAssignmentSubmission, 
  PresentationSubmission, 
  InstitutePresence, 
  ActiveLearningSession 
} from '../types';

export const MOCK_ASSIGNMENT_TASKS = [
  {
    taskId: 'TASK-NWP-01',
    title: 'NCUM-4DVar Atmospheric Inversion & Observation Matrix',
    courseTitle: 'Numerical Weather Prediction: WRF & NCUM Operational Modeling',
    department: 'NCMRWF Noida',
    category: 'Data Assimilation',
    difficulty: 'Advanced',
    deadline: '18 Sept 2026',
    supportedFormats: ['.csv', '.json', '.py', '.ipynb', '.pdf'],
    benchmarkTarget: 'Convergence delta < 0.002 on PARAM Mihir HPC benchmark dataset',
    description: 'Ingest raw radiosonde and satellite radiance tensors, apply background error covariance (B-matrix), and formulate the incremental 4D-Var minimization loop. Ensure observation vector conforms to WMO BUFR schema.'
  },
  {
    taskId: 'TASK-RAD-02',
    title: 'DWR Dual-Polarization Rain Rate (Z-R) Inversion',
    courseTitle: 'Doppler Radar Meteorology & Severe Storm Tracking',
    department: 'IMD New Delhi',
    category: 'Radar Meteorology',
    difficulty: 'Intermediate',
    deadline: '22 Sept 2026',
    supportedFormats: ['.csv', '.py', '.ipynb', '.pdf'],
    benchmarkTarget: 'Rain rate root-mean-square error (RMSE) <= 1.4 mm/hr across 15 automated weather stations',
    description: 'Process S-band Doppler radar raw I/Q moments (Z_H, Z_DR, K_DP, and rho_HV). Filter ground clutter anomalies and generate high-resolution quantitative precipitation estimates (QPE).'
  },
  {
    taskId: 'TASK-TSU-03',
    title: 'INCOIS Tsunami DART Sea-Floor Pressure Waveform Inversion',
    courseTitle: 'Seismological Data Inversion & Tsunami Warning',
    department: 'INCOIS Hyderabad',
    category: 'Ocean Hazards',
    difficulty: 'Advanced',
    deadline: '25 Sept 2026',
    supportedFormats: ['.csv', '.json', '.py'],
    benchmarkTarget: 'Wave amplitude arrival time prediction error < 45 seconds on Makran Trench synthetic simulation',
    description: 'Parse bottom pressure recorder (BPR) telemetry packets from Bay of Bengal buoys, filter tidal harmonics via Butterworth bandpass, and compute coastal runup travel time matrix.'
  },
  {
    taskId: 'TASK-CRY-04',
    title: 'Antarctic Maitri Ice Core Trace Chemistry Profiling',
    courseTitle: 'Polar Earth Sciences & Cryosphere Modeling',
    department: 'NCPOR Goa',
    category: 'Cryosphere',
    difficulty: 'Intermediate',
    deadline: '30 Sept 2026',
    supportedFormats: ['.csv', '.json', '.ipynb', '.pdf'],
    benchmarkTarget: 'Isotope delta-O18 calibration fidelity R^2 >= 0.96 with EPICA ice core baseline',
    description: 'Clean spectrophotometry and isotope ratio mass spectrometry data from 120-meter Schirmacher Oasis core drills. Detect volcanic sulfate spikes corresponding to historical eruption epochs.'
  }
];

export const INITIAL_ASSIGNMENT_SUBMISSIONS: ScientificAssignmentSubmission[] = [
  {
    id: 'sub-001',
    taskId: 'TASK-NWP-01',
    taskTitle: 'NCUM-4DVar Atmospheric Inversion & Observation Matrix',
    courseTitle: 'Numerical Weather Prediction: WRF & NCUM Operational Modeling',
    department: 'NCMRWF Noida',
    traineeName: 'Arjun Somany',
    traineeId: 'trainee-001',
    submittedAt: '04 Sept 2026, 14:32 IST',
    fileName: 'ncum_4dvar_inversion_v2.py',
    fileSize: '4.2 MB',
    fileType: '.py',
    status: 'Graded',
    resubmissionCount: 0,
    datasetBenchmarkTarget: 'Convergence delta < 0.002 on PARAM Mihir benchmark',
    feedbackNotes: 'Exemplary formulation of the Hessian preconditioner. B-matrix sparsity pattern maintained efficiently with sparse scipy linear operators.',
    scoreBreakdown: {
      schemaIntegrity: 25,
      algorithmicPrecision: 34,
      errorResilience: 19,
      documentationStandards: 18,
      totalScore: 96
    },
    testCaseLogs: [
      {
        testId: 'TC-01',
        name: 'WMO BUFR Ingestion & Timestamp Validation',
        category: 'schema',
        passed: true,
        runtimeMs: 42,
        outputLog: '[PASS] Ingested 18,400 sounding records. Zero null timestamp anomalies.'
      },
      {
        testId: 'TC-02',
        name: 'Observation Error Covariance Orthogonality',
        category: 'accuracy',
        passed: true,
        runtimeMs: 112,
        outputLog: '[PASS] R-matrix condition number 1.042 (optimal band limit achieved).'
      },
      {
        testId: 'TC-03',
        name: 'Cost Function Minimization Gradient Check',
        category: 'accuracy',
        passed: true,
        runtimeMs: 184,
        outputLog: '[PASS] Residual gradient norm decreased by 4 orders in 22 conjugate gradient iterations.'
      },
      {
        testId: 'TC-04',
        name: 'HPC Threading & Memory Bounds (PARAM Mihir)',
        category: 'performance',
        passed: true,
        runtimeMs: 78,
        outputLog: '[PASS] Peak resident memory 384 MB (limit: 1024 MB). OpenMP vectorization confirmed.'
      }
    ]
  },
  {
    id: 'sub-002',
    taskId: 'TASK-RAD-02',
    taskTitle: 'DWR Dual-Polarization Rain Rate (Z-R) Inversion',
    courseTitle: 'Doppler Radar Meteorology & Severe Storm Tracking',
    department: 'IMD New Delhi',
    traineeName: 'Priyanka Dasgupta',
    traineeId: 'trainee-002',
    submittedAt: '05 Sept 2026, 11:15 IST',
    fileName: 'dwr_kolkata_zdr_inversion.ipynb',
    fileSize: '8.7 MB',
    fileType: '.ipynb',
    status: 'Pending Auto-Grade',
    resubmissionCount: 0,
    datasetBenchmarkTarget: 'RMSE <= 1.4 mm/hr across 15 AWS stations',
    feedbackNotes: 'Uploaded and scheduled for automatic containerized testing on the MoES GPU compute cluster.',
    testCaseLogs: [
      {
        testId: 'TC-01',
        name: 'Doppler Raw NetCDF4/CF-Radial Schema Audit',
        category: 'schema',
        passed: true,
        runtimeMs: 38,
        outputLog: '[PASS] Sweep angles calibrated: 0.5, 1.5, 3.0, 4.5 degrees verified.'
      },
      {
        testId: 'TC-02',
        name: 'Ground Clutter Phase Variance Filter',
        category: 'accuracy',
        passed: true,
        runtimeMs: 95,
        outputLog: '[PASS] Ground clutter attenuation 32 dB achieved over urban Kolkata quadrant.'
      }
    ]
  },
  {
    id: 'sub-003',
    taskId: 'TASK-TSU-03',
    taskTitle: 'INCOIS Tsunami DART Sea-Floor Pressure Waveform Inversion',
    courseTitle: 'Seismological Data Inversion & Tsunami Warning',
    department: 'INCOIS Hyderabad',
    traineeName: 'Venkatesh Babu',
    traineeId: 'trainee-003',
    submittedAt: '03 Sept 2026, 09:48 IST',
    fileName: 'dart_gauge_inversion_dataset.csv',
    fileSize: '12.4 MB',
    fileType: '.csv',
    status: 'Requires Resubmission',
    resubmissionCount: 1,
    datasetBenchmarkTarget: 'Prediction error < 45 seconds on synthetic Makran run',
    feedbackNotes: 'Atmospheric pressure compensation was omitted from the hydrostatic depth equation. Please resubmit with barometric correction applied.',
    scoreBreakdown: {
      schemaIntegrity: 22,
      algorithmicPrecision: 21,
      errorResilience: 14,
      documentationStandards: 11,
      totalScore: 68
    },
    testCaseLogs: [
      {
        testId: 'TC-01',
        name: 'Sensor Sampling Periodicity (15s Rapid Tsunami Mode)',
        category: 'schema',
        passed: true,
        runtimeMs: 25,
        outputLog: '[PASS] Continuous 15-second telemetry frame detected without time skips.'
      },
      {
        testId: 'TC-02',
        name: 'Atmospheric Pressure Residual Correction',
        category: 'accuracy',
        passed: false,
        runtimeMs: 82,
        outputLog: '[FAIL] Surface atmospheric pressure variation introduced a 6.8 cm fictitious ocean swell artifact.'
      },
      {
        testId: 'TC-03',
        name: 'Makran Trench Benchmark Propagation Time',
        category: 'accuracy',
        passed: false,
        runtimeMs: 140,
        outputLog: '[FAIL] Estimated travel time error 92 seconds (tolerance limit: 45 seconds).'
      }
    ]
  }
];

export const INITIAL_PRESENTATION_SUBMISSIONS: PresentationSubmission[] = [
  {
    id: 'pres-001',
    title: 'Operational Doppler Radar Nowcasting of Severe Thunderstorms (Squall Lines) in West Bengal',
    seminarTopic: 'Severe Weather Dynamics & Dual-Pol Clutter Filtering',
    courseTitle: 'Doppler Radar Meteorology & Severe Storm Tracking',
    traineeName: 'Priyanka Dasgupta',
    traineeId: 'trainee-002',
    department: 'IMD Kolkata',
    submittedAt: '03 Sept 2026, 16:45 IST',
    format: 'MP4',
    mediaUrl: 'https://images.unsplash.com/photo-1590055531615-f16d36ffe8ec?auto=format&fit=crop&q=80&w=800',
    durationOrPages: '14 mins 20 secs (1080p)',
    fileSize: '142 MB',
    status: 'Graded',
    summary: 'Comprehensive analysis of Kalbaishakhi (Norwester) convective cell development using RMC Kolkata Doppler radar. Demonstrated hydrometeor differentiation between graupel and heavy rainfall.',
    rubricScore: {
      communicationSkill: 28, // Max 30
      technicalDepth: 38, // Max 40
      domainAccuracy: 29, // Max 30
      totalScore: 95,
      evaluatedBy: 'Dr. V. K. Srivastav (Scientist F, Chief Radar Operations Officer)',
      evaluationDate: '04 Sept 2026',
      detailedComments: 'Outstanding presentation. Clear voice modulation, rigorous explanation of ZDR and KDP signatures during convective initiation, and flawless adherence to IMD severe weather alert color coding.'
    }
  },
  {
    id: 'pres-002',
    title: 'High-Resolution 4D-Var Data Assimilation of Scatterometer Ocean Winds in Global NCUM',
    seminarTopic: 'Ensemble Modeling & Satellite Wind Inversion',
    courseTitle: 'Numerical Weather Prediction: WRF & NCUM Operational Modeling',
    traineeName: 'Arjun Somany',
    traineeId: 'trainee-001',
    department: 'NCMRWF Noida',
    submittedAt: '05 Sept 2026, 10:20 IST',
    format: 'PDF/PPTX',
    mediaUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
    durationOrPages: '28 Presentation Slides (PDF)',
    fileSize: '18.6 MB',
    status: 'Submitted - In Review',
    summary: 'Details the integration of OSCAT-3 and MetOp ASCAT scatterometer surface wind vectors into the 12km NCUM unified model, showcasing impact on monsoon low-pressure system genesis.',
    rubricScore: undefined
  },
  {
    id: 'pres-003',
    title: 'Real-Time Inversion of Deep-Sea BPR Signals for Arabian Sea Tsunami Advisory',
    seminarTopic: 'Subduction Zone Seismology & Tsunami Travel Time',
    courseTitle: 'Seismological Data Inversion & Tsunami Warning',
    traineeName: 'Venkatesh Babu',
    traineeId: 'trainee-003',
    department: 'INCOIS Hyderabad',
    submittedAt: '02 Sept 2026, 18:10 IST',
    format: 'WebM',
    mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
    durationOrPages: '11 mins 45 secs (720p)',
    fileSize: '98 MB',
    status: 'Requires Resubmission',
    summary: 'Evaluation of bottom pressure recorder telemetry during simulated Mw 8.1 Makran earthquakes with wave arrival estimates along Gujarat coastline.',
    rubricScore: {
      communicationSkill: 20,
      technicalDepth: 23,
      domainAccuracy: 22,
      totalScore: 65,
      evaluatedBy: 'Dr. T. Hemalatha (Scientist G & Head, ITEWC)',
      evaluationDate: '03 Sept 2026',
      detailedComments: 'The acoustic telemetry packet structure was well explained, but the tidal harmonic deconvolution method requires deeper mathematical rigor before it can be certified for operational decision support.'
    }
  }
];

export const MOCK_INSTITUTE_PRESENCE: InstitutePresence[] = [
  {
    id: 'inst-imd',
    code: 'IMD',
    name: 'India Meteorological Department',
    city: 'New Delhi & Regional Centers',
    activeUsersCount: 142,
    activeTrainees: 118,
    activeTrainers: 24,
    avgEngagementScore: 94.2,
    systemLoadStatus: 'Optimal',
    primaryFocusArea: 'Nowcasting, Cyclone Radar & Agromet Operations'
  },
  {
    id: 'inst-incois',
    code: 'INCOIS',
    name: 'Indian National Centre for Ocean Information Services',
    city: 'Hyderabad, Telangana',
    activeUsersCount: 86,
    activeTrainees: 72,
    activeTrainers: 14,
    avgEngagementScore: 96.5,
    systemLoadStatus: 'Optimal',
    primaryFocusArea: 'Tsunami Warning & Ocean State Forecasting'
  },
  {
    id: 'inst-iitm',
    code: 'IITM',
    name: 'Indian Institute of Tropical Meteorology',
    city: 'Pune, Maharashtra',
    activeUsersCount: 64,
    activeTrainees: 52,
    activeTrainers: 12,
    avgEngagementScore: 91.8,
    systemLoadStatus: 'Elevated',
    primaryFocusArea: 'Monsoon Dynamic Modeling & Cloud Physics'
  },
  {
    id: 'inst-ncmrwf',
    code: 'NCMRWF',
    name: 'National Centre for Medium Range Weather Forecasting',
    city: 'Noida, Uttar Pradesh',
    activeUsersCount: 49,
    activeTrainees: 41,
    activeTrainers: 8,
    avgEngagementScore: 98.1,
    systemLoadStatus: 'Optimal',
    primaryFocusArea: 'PARAM Mihir HPC & 4D-Var Data Assimilation'
  },
  {
    id: 'inst-ncpor',
    code: 'NCPOR',
    name: 'National Centre for Polar and Ocean Research',
    city: 'Vasco da Gama, Goa',
    activeUsersCount: 38,
    activeTrainees: 31,
    activeTrainers: 7,
    avgEngagementScore: 93.0,
    systemLoadStatus: 'Optimal',
    primaryFocusArea: 'Arctic, Antarctic & Southern Ocean Cryosphere'
  }
];

export const MOCK_ACTIVE_SESSIONS: ActiveLearningSession[] = [
  {
    id: 'act-01',
    officerName: 'Roshni Bhattacharya',
    designation: 'Junior Research Fellow (JRF)',
    instituteCode: 'INCOIS',
    activity: 'Streaming Lecture: DART Acoustic Telemetry Calibration',
    courseOrModule: 'Seismological Data Inversion & Tsunami Warning (Mod 3)',
    timestamp: 'Just now (Heartbeat: 42m active)',
    engagementVerified: true
  },
  {
    id: 'act-02',
    officerName: 'Arjun Somany',
    designation: "Scientist 'B' Probationer",
    instituteCode: 'NCMRWF',
    activity: 'Executing Benchmark: 4D-Var MetPy Optimization Suite',
    courseOrModule: 'HPC Numerical Weather Prediction (Mod 4)',
    timestamp: '2 mins ago (Heartbeat: 28m active)',
    engagementVerified: true
  },
  {
    id: 'act-03',
    officerName: 'Priyanka Dasgupta',
    designation: 'Meteorologist Gr. II',
    instituteCode: 'IMD',
    activity: 'Submitted Real-World Dataset: Kolkata DWR Z_DR Sweep NetCDF',
    courseOrModule: 'Doppler Radar Meteorology & Severe Storm Tracking',
    timestamp: '4 mins ago (Auto-Grade queued)',
    engagementVerified: true
  },
  {
    id: 'act-04',
    officerName: 'Dr. Meera Namboodiri',
    designation: "Senior Principal Scientist (Scientist 'F')",
    instituteCode: 'NCPOR',
    activity: 'Reviewing Trainee Presentation Rubric: Polar Paleoclimate Analysis',
    courseOrModule: 'Cryospheric Science & Ice Core Analysis',
    timestamp: '6 mins ago (Faculty Session)',
    engagementVerified: true
  },
  {
    id: 'act-05',
    officerName: 'Gaurav Kulkarni',
    designation: "Project Scientist 'I'",
    instituteCode: 'IITM',
    activity: 'Interactive Code Task: CAIPEEX Cloud Droplet Size Distribution',
    courseOrModule: 'Monsoon Dynamic Meteorology (Mod 2)',
    timestamp: '8 mins ago (Heartbeat: 35m active)',
    engagementVerified: true
  },
  {
    id: 'act-06',
    officerName: 'Himanshu Sekhar Sahoo',
    designation: 'Probationary Meteorologist 2026',
    instituteCode: 'IMD',
    activity: 'Taking Timed Assessment: Synoptic Surface Chart Analysis',
    courseOrModule: 'Operational Weather Forecasting Certification',
    timestamp: '11 mins ago (Exam in progress)',
    engagementVerified: true
  }
];
