import React, { useState, useEffect } from 'react';
import { secureId } from '../../lib/security';
import { Assessment, QuizResult } from '../../types';
import confetti from 'canvas-confetti';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Award, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  AlertTriangle, 
  HelpCircle,
  ShieldCheck,
  FileCheck
} from 'lucide-react';

interface AssessmentPlayerProps {
  assessment: Assessment;
  traineeName: string;
  onFinishQuiz: (result: QuizResult) => void;
  onOpenCertificate: (result: QuizResult) => void;
  onBack: () => void;
}

export const AssessmentPlayer: React.FC<AssessmentPlayerProps> = ({
  assessment,
  traineeName,
  onFinishQuiz,
  onOpenCertificate,
  onBack,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(assessment.durationMinutes * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  // Countdown timer
  useEffect(() => {
    if (isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitAssessment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, selectedAnswers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers({
      ...selectedAnswers,
      [currentIdx]: optIdx,
    });
  };

  const handleSubmitAssessment = () => {
    if (isSubmitted) return;

    let correctCount = 0;
    const answerBreakdown = assessment.questions.map((q, idx) => {
      const selected = selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1;
      const isCorrect = selected === q.correctIndex;
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        selectedIndex: selected,
        isCorrect,
      };
    });

    const scorePercentage = Math.round((correctCount / assessment.questions.length) * 100);
    const passed = scorePercentage >= assessment.passingPercentage;
    // Provisional serial: the signed one is minted by the portal API in CertificateModal.
    const certId = passed ? secureId('MOES-CERT', 12) : undefined;

    const result: QuizResult = {
      assessmentId: assessment.id,
      courseTitle: assessment.courseTitle,
      traineeName,
      score: scorePercentage,
      correctCount,
      totalQuestions: assessment.questions.length,
      passed,
      completedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      answers: answerBreakdown,
      certificateId: certId,
    };

    setQuizResult(result);
    setIsSubmitted(true);
    onFinishQuiz(result);

    // Celebratory Confetti if passed (> 70%)
    if (passed) {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#e11d48', '#10b981', '#f59e0b', '#ef4444'],
        });
      } catch (e) {
        console.log('Confetti triggered');
      }
    }
  };

  const currentQ = assessment.questions[currentIdx];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Top Header Card */}
      <div className="liquid-glass rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-400 flex items-center gap-1 mb-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
          </button>
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
            {assessment.subject} • Official MoES Examination
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {assessment.title}
          </h2>
        </div>

        {/* Countdown Timer */}
        {!isSubmitted ? (
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border font-mono font-bold text-sm sm:text-base ${
            timeLeft < 120 
              ? 'bg-red-50 dark:bg-red-950/80 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 animate-pulse' 
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}>
            <Clock className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <span>Time Remaining: {formatTime(timeLeft)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              Exam Concluded
            </span>
          </div>
        )}
      </div>

      {/* QUIZ IN PROGRESS VIEW */}
      {!isSubmitted ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Question Panel (3 cols) */}
          <div className="lg:col-span-3 liquid-glass rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between min-h-[420px] border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80">
            <div className="space-y-4">
              {/* Question Number & Tag */}
              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-200 dark:border-slate-700">
                <span className="font-mono font-bold text-rose-700 dark:text-rose-400">
                  Question {currentIdx + 1} of {assessment.questions.length}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold">
                  Difficulty: {currentQ.difficulty}
                </span>
              </div>

              {/* Question Text */}
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {currentQ.question}
              </h3>

              {/* MCQ Options */}
              <div className="space-y-3 pt-2">
                {currentQ.options.map((opt, oIdx) => {
                  const isChosen = selectedAnswers[currentIdx] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectOption(oIdx)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3 text-xs sm:text-sm font-medium cursor-pointer ${
                        isChosen
                          ? 'bg-rose-50/80 dark:bg-rose-950/70 border-rose-500 dark:border-rose-500 text-rose-950 dark:text-rose-100 shadow-md shadow-rose-900/5'
                          : 'bg-white/80 dark:bg-slate-700/60 border-slate-200/80 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 ${
                        isChosen ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="flex-1 leading-relaxed">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation & Submit controls */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
              >
                Previous
              </button>

              <div className="flex items-center gap-3">
                {currentIdx < assessment.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIdx((prev) => Math.min(assessment.questions.length - 1, prev + 1))}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-rose-600 hover:bg-rose-700 dark:hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    id="submit-assessment-btn"
                    type="button"
                    onClick={handleSubmitAssessment}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                  >
                    Submit Assessment Now
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Question Palette Sidebar (1 col) */}
          <div className="liquid-glass rounded-3xl p-6 space-y-4 border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Question Navigator
            </h4>

            <div className="grid grid-cols-4 gap-2">
              {assessment.questions.map((_, idx) => {
                const answered = selectedAnswers[idx] !== undefined;
                const isCurrent = currentIdx === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-10 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? 'ring-2 ring-rose-500 bg-rose-600 text-white'
                        : answered
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 text-[11px] space-y-2 text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Answered ({Object.keys(selectedAnswers).length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                <span>Unvisited ({assessment.questions.length - Object.keys(selectedAnswers).length})</span>
              </div>
            </div>

            <button
              onClick={handleSubmitAssessment}
              className="w-full mt-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-sm transition cursor-pointer"
            >
              Finish & Grade
            </button>
          </div>

        </div>
      ) : (
        /* QUIZ RESULTS & EXPLANATIONS VIEW */
        <div className="space-y-6">
          {quizResult && (
            <div className={`rounded-3xl p-6 sm:p-8 border shadow-lg ${
              quizResult.passed 
                ? 'liquid-glass-accent border-emerald-300 dark:border-emerald-800 bg-white/90 dark:bg-slate-800/90' 
                : 'liquid-glass-red border-red-300 dark:border-red-800 bg-white/90 dark:bg-slate-800/90'
            }`}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                    quizResult.passed 
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                      : 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                  }`}>
                    {quizResult.passed ? 'Status: PASSED & CERTIFIED' : 'Status: RETEST REQUIRED'}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight pt-1">
                    Your Score: {quizResult.score}% ({quizResult.correctCount}/{quizResult.totalQuestions} Correct)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    Passing Threshold: {assessment.passingPercentage}%. Automated evaluation verified by MoES Examination Engine.
                  </p>
                </div>

                {/* Certificate action if passed */}
                {quizResult.passed && (
                  <button
                    id="view-earned-certificate-btn"
                    onClick={() => onOpenCertificate(quizResult)}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-700/20 transition flex items-center gap-2 active:scale-95 shrink-0 cursor-pointer"
                  >
                    <Award className="w-5 h-5" />
                    <span>View & Download Certificate</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Detailed Question Review & Automated Technical Explanations */}
          <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              Question-by-Question Technical Feedback
            </h4>

            <div className="space-y-6">
              {assessment.questions.map((q, idx) => {
                const userAns = selectedAnswers[idx];
                const isCorrect = userAns === q.correctIndex;

                return (
                  <div 
                    key={q.id}
                    className={`p-5 rounded-2xl border space-y-3 ${
                      isCorrect 
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' 
                        : 'bg-red-50/30 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                        {idx + 1}. {q.question}
                      </h5>
                      {isCorrect ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 rounded-full shrink-0 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+10)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950 px-2.5 py-1 rounded-full shrink-0 border border-red-200 dark:border-red-800">
                          <XCircle className="w-3.5 h-3.5" /> Incorrect
                        </span>
                      )}
                    </div>

                    {/* Options Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options.map((opt, oIdx) => {
                        const isSelectedByTrainee = userAns === oIdx;
                        const isActualCorrect = q.correctIndex === oIdx;

                        return (
                          <div
                            key={oIdx}
                            className={`p-3 rounded-xl border flex items-center justify-between ${
                              isActualCorrect
                                ? 'bg-emerald-100/70 dark:bg-emerald-900/60 border-emerald-400 dark:border-emerald-700 font-bold text-emerald-900 dark:text-emerald-200'
                                : isSelectedByTrainee
                                ? 'bg-red-100/70 dark:bg-red-900/60 border-red-400 dark:border-red-700 font-bold text-red-900 dark:text-red-200'
                                : 'bg-white/70 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                            {isActualCorrect && (
                              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">✓ Correct</span>
                            )}
                            {isSelectedByTrainee && !isActualCorrect && (
                              <span className="text-[10px] uppercase font-bold text-red-700 dark:text-red-300">✗ Your Pick</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Automated Scientific Explanation */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs text-slate-700 dark:text-slate-200 space-y-1">
                      <strong className="text-rose-800 dark:text-rose-300 font-bold flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" /> Operational Rationale & IMD Guidelines:
                      </strong>
                      <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Back to courses */}
            <div className="pt-4 flex justify-between">
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setSelectedAnswers({});
                  setTimeLeft(assessment.durationMinutes * 60);
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retake Assessment
              </button>

              <button
                onClick={onBack}
                className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 dark:hover:bg-rose-500 transition cursor-pointer"
              >
                Return to Course Hub
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
