import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../lib/api';
import { Input } from '../registry/components/input/input';
import { Button } from '../registry/components/button/button';
import { useUser } from '@clerk/clerk-react';
import { Progress } from '../registry/components/progress/progress';
import { AnimatedCounter } from '../registry/components/animated-counter/animated-counter';
import { motionTokens } from '../lib/motion-tokens';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [intent, setIntent] = useState('');
  const [projectType, setProjectType] = useState('');
  const [customProject, setCustomProject] = useState('');
  const [emails, setEmails] = useState(['', '', '']);
  
  const { user } = useUser();
  const userName = user?.fullName || 'there';

  const handleComplete = async () => {
    setLoading(true);
    try {
      await api.post('/workspaces', {
        name: `${userName}'s Workspace`
      });
      // Allow time to simulate setup feel
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to create workspace:', error);
      // Fallback redirect just in case
      navigate('/dashboard');
    }
  };

  const nextStep = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#080808] flex flex-col selection:bg-white/20 text-white font-sans relative overflow-hidden">
      {/* Premium ambient glow */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-white/[0.035] blur-[120px] rounded-[100%] pointer-events-none" />

      {/* Top Navigation */}
      <nav className="absolute top-0 left-0 w-full flex justify-between items-center px-6 md:px-10 h-24 z-10">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center shadow-sm">
               <div className="w-2.5 h-2.5 bg-[#080808] rounded-[2px]" />
            </div>
            <span className="font-semibold tracking-tight text-[15px]">Kriri</span>
          </div>
          
          {/* Back button integrated into nav */}
          {step > 1 && (
            <Button 
              variant="ghost"
              onClick={prevStep}
              className="flex items-center gap-1.5 text-[13px] font-medium text-text-muted hover:text-white transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Back
            </Button>
          )}
        </div>
        
        {/* Premium Animated Progress */}
        <div className="flex items-center gap-4 w-32">
          <Progress value={(step / 4) * 100} className="w-full" showValue={false} />
          <div className="text-[12px] font-medium text-text-muted flex gap-[2px] items-center tabular-nums">
            <AnimatedCounter value={step} />
            <span className="opacity-50 mt-[1px]">/ 4</span>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 w-full flex justify-center items-center mt-12 relative z-10 p-4">
        
        <AnimatePresence mode="wait">
        {/* Step 1: Welcome */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-10 max-w-[420px] w-full"
          >
            <div className="flex flex-col gap-3">
              <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight text-white leading-tight">Welcome to Kriri</h1>
              <p className="text-[15px] text-text-muted leading-relaxed">Let's get your workspace set up. It will take about a minute.</p>
            </div>
            
            <Button 
              onClick={nextStep} 
              className="w-full mt-2 h-11"
            >
              Get started
            </Button>
          </motion.div>
        )}

        {/* Step 2: Intent */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-10 max-w-[440px] w-full"
          >
            <div className="flex flex-col gap-3">
              <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight text-white leading-tight">What are you planning to use Kriri for?</h1>
              <p className="text-[15px] text-text-muted leading-relaxed">We'll tailor your experience and default views based on how you work.</p>
            </div>
            
            <div className="flex flex-col gap-3">
              {[
                { id: 'Work', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg> },
                { id: 'School', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg> },
                { id: 'Personal', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }
              ].map(r => (
                <button 
                  key={r.id}
                  onClick={() => {
                    setIntent(r.id);
                    setTimeout(nextStep, 300);
                  }}
                  className={`relative flex items-center justify-between w-full p-4 rounded-xl text-left group overflow-hidden ${intent === r.id ? 'scale-[1.01] transition-transform duration-300' : 'transition-transform duration-300'}`}
                >
                  {intent === r.id && (
                    <motion.div layoutId="intent-bg" className="absolute inset-0 bg-white/[0.06] border border-white rounded-xl" transition={motionTokens.spring.morph} />
                  )}
                  {intent !== r.id && (
                    <div className="absolute inset-0 border border-border bg-surface/40 rounded-xl group-hover:border-white/30 transition-colors" />
                  )}
                  
                  <div className="relative z-10 flex items-center gap-3">
                    <div className={`flex items-center justify-center transition-colors duration-200 ${intent === r.id ? 'text-white' : 'text-text-muted'}`}>
                      {r.icon}
                    </div>
                    <span className="font-medium text-[15px] text-white">{r.id}</span>
                  </div>
                  
                  {/* Premium Morphing Radio Button */}
                  <div className={`relative z-10 w-4 h-4 rounded-full border flex items-center justify-center transition-colors duration-200 ${intent === r.id ? 'border-white' : 'border-border/80'}`}>
                    {intent === r.id && (
                       <motion.div layoutId="intent-radio" className="w-2 h-2 bg-white rounded-full" transition={motionTokens.spring.snappy} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 3: First Project */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-10 max-w-[440px] w-full"
          >
            <div className="flex flex-col gap-3">
              <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight text-white leading-tight">Let's create your first project</h1>
              <p className="text-[15px] text-text-muted leading-relaxed">Pick one below to start with, or describe it yourself.</p>
            </div>
            
            <div className="flex flex-col gap-3">
              {[
                { id: 'Product Roadmap', desc: 'Plan and track your product goals', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg> },
                { id: 'Software Development', desc: 'Track bugs and engineering cycles', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
                { id: 'Design System', desc: 'Manage components and guidelines', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> },
              ].map(proj => (
                <button 
                  key={proj.id}
                  onClick={() => {
                    setProjectType(proj.id); 
                    setCustomProject('');
                  }}
                  className={`relative flex items-center gap-4 w-full p-4 rounded-xl text-left group overflow-hidden ${projectType === proj.id ? 'scale-[1.01] transition-transform duration-300' : 'transition-transform duration-300'}`}
                >
                  {projectType === proj.id && (
                    <motion.div layoutId="project-bg" className="absolute inset-0 bg-white/[0.06] border border-white rounded-xl" transition={motionTokens.spring.morph} />
                  )}
                  {projectType !== proj.id && (
                    <div className="absolute inset-0 border border-border bg-surface/40 rounded-xl group-hover:border-white/30 transition-colors" />
                  )}
                  
                  <div className={`relative z-10 w-10 h-10 rounded-lg border flex items-center justify-center transition-colors duration-200 ${projectType === proj.id ? 'bg-white/10 border-white/20 text-white' : 'bg-white/[0.03] border-white/5 text-text-muted'}`}>
                    {proj.icon}
                  </div>
                  <div className="relative z-10 flex flex-col gap-1">
                    <span className="font-medium text-[15px] text-white">{proj.id}</span>
                    <span className="text-[13px] text-text-muted">{proj.desc}</span>
                  </div>
                </button>
              ))}
              
              <div className="mt-2">
                <Input 
                  value={customProject}
                  onChange={e => {setCustomProject(e.target.value); setProjectType('');}}
                  placeholder="Or describe it (e.g. Wedding planner)"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-4 mt-2">
              <Button 
                onClick={nextStep} 
                disabled={!projectType && !customProject.trim()}
                className="w-full h-11"
              >
                Continue
              </Button>
              
              {/* Skip Button */}
              <Button 
                variant="ghost"
                onClick={nextStep}
                className="text-text-muted hover:text-white"
              >
                Skip for now
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Invites */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-10 max-w-[440px] w-full"
          >
            <div className="flex flex-col gap-3">
              <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight text-white leading-tight">Invite your team</h1>
              <p className="text-[15px] text-text-muted leading-relaxed">Kriri is better together. Invite your team to get started building.</p>
            </div>
            
            <div className="flex flex-col gap-4">
              {emails.map((email, index) => (
                <Input 
                  key={index}
                  value={email}
                  onChange={e => {
                    const newEmails = [...emails];
                    newEmails[index] = e.target.value;
                    setEmails(newEmails);
                  }}
                  placeholder={`Teammate's email ${index === 0 ? '(recommended)' : ''}`} 
                  autoFocus={index === 0}
                />
              ))}
              
              <Button 
                variant="ghost"
                className="mt-1 w-fit flex items-center gap-1.5 text-[13.5px]"
                onClick={() => setEmails([...emails, ''])}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                Add another
              </Button>
            </div>
            
            <div className="flex flex-col gap-5 mt-4">
              <Button 
                onClick={handleComplete} 
                loading={loading}
                className="w-full h-11"
              >
                Go to Kriri
              </Button>
              
              {/* Skip Button instead of Trial Message */}
              <Button 
                variant="ghost"
                onClick={handleComplete}
                className="text-text-muted hover:text-white"
              >
                Skip for now
              </Button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

      </div>
    </div>
  );
}
