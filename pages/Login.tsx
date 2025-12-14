
import React, { useState } from 'react';
import { useNavigate } from '../components/UIComponents';
import { api } from '../services/mockService';
import { User } from '../types';
import { Input, Button, Card, Logo } from '../components/UIComponents';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (token: string, user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    
    try {
      const res = await api.login(username, password);
      if (res.status === 'success' && res.token && res.user) {
        setStatus('success');
        setTimeout(() => {
          onLogin(res.token, res.user);
          navigate('/');
        }, 1000); // Slight delay to show success state
      } else {
        setErrorMsg(res.message || 'Login failed');
        setStatus('error');
        // Reset status to idle after shake animation
        setTimeout(() => setStatus('idle'), 2000); 
      }
    } catch (err) {
      setErrorMsg('An error occurred');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4FBFF] flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <Card className={`w-full max-w-md p-8 border-t-4 border-primary relative z-10 transition-transform duration-300 
        ${status === 'error' ? 'animate-[shake_0.5s_ease-in-out]' : 'animate-scale-in'}
      `}>
        {/* Progress Bar (Loading State) */}
        {status === 'loading' && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 overflow-hidden rounded-t-xl">
            <div className="h-full bg-primary animate-[progress_1.5s_ease-in-out_infinite]"></div>
          </div>
        )}

        <div className="text-center mb-6">
           {/* Logo Wrapper - Adjusted margin to pull text closer */}
           <div className="relative w-44 h-44 mx-auto -mb-5 flex items-center justify-center">
             
             {/* Decorative background glow behind logo */}
             <div className={`absolute inset-4 bg-primary/5 rounded-full blur-xl transition-all duration-500 ${status === 'loading' ? 'bg-primary/20 scale-110' : ''}`}></div>
             
             {/* Logo Content Container */}
             <div className={`relative w-full h-full flex items-center justify-center transition-all duration-500
                ${status === 'loading' ? 'scale-95 opacity-90' : 'scale-100'}
             `}>
               {status === 'idle' || status === 'loading' ? (
                 <div className="relative w-full h-full flex items-center justify-center">
                   <Logo 
                      className={`w-full h-full object-contain drop-shadow-lg transition-all duration-700 
                      ${status === 'loading' ? 'filter brightness-110' : ''}`} 
                   />
                   {/* Scanning Overlay Animation */}
                   {status === 'loading' && (
                     <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none overflow-hidden rounded-full">
                       <div className="w-full h-[2px] bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[scan_1.5s_linear_infinite]"></div>
                     </div>
                   )}
                 </div>
               ) : (
                 <div className={`w-28 h-28 rounded-full flex items-center justify-center text-white shadow-2xl animate-scale-in transform transition-all duration-500
                    ${status === 'success' ? 'bg-green-500 rotate-0' : 'bg-red-500 rotate-0'}
                 `}>
                    {status === 'success' ? <CheckCircle2 size={56} strokeWidth={3} /> : <AlertCircle size={56} strokeWidth={3} />}
                 </div>
               )}
             </div>
           </div>

          <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-none mb-1">SIMANDA SPPG</h1>
          <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Sistem Manajemen Data SPPG</p>
          <p className="text-gray-500 text-sm">
            {status === 'loading' ? 'Sedang memverifikasi akun...' : 'Silahkan login untuk masuk ke dashboard'}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <Input 
            label="Username" 
            placeholder="Enter username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            disabled={status === 'loading' || status === 'success'}
            autoFocus
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="Enter password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            disabled={status === 'loading' || status === 'success'}
          />
          
          {errorMsg && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-center justify-center animate-fade-in shadow-sm">
              <AlertCircle size={16} className="mr-2 shrink-0"/> <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          <Button 
            type="submit" 
            className={`w-full py-3 text-base shadow-lg transition-all duration-300 mt-2
              ${status === 'loading' ? 'bg-opacity-80' : 'shadow-primary/20 hover:shadow-primary/30'}
            `} 
            isLoading={status === 'loading'} 
            disabled={status === 'success'}
          >
            {status === 'success' ? 'Berhasil Masuk!' : status === 'loading' ? 'Memproses...' : 'Masuk Dashboard'}
          </Button>

          <div className="text-center mt-6">
            <p className="text-xs text-gray-400 font-medium">
              &copy; 2025 SIMANDA SPPG. <br/> Hubungi administrator jika lupa password.
            </p>
          </div>
        </form>
      </Card>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        @keyframes scan {
          0% { transform: translateY(-60px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(60px); opacity: 0; }
        }
        @keyframes progress {
          0% { width: 0%; margin-left: 0; }
          50% { width: 70%; margin-left: 30%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
};
