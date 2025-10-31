import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useThemeStore } from '@/hooks/useTheme';
import { authAPI } from '@/services/api';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  
  // Redirect to dashboard if already authenticated (when page loads with existing session)
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Already authenticated on page load, redirecting...');
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) {
      console.log('Already submitting, ignoring duplicate call');
      return;
    }
    
    clearError();
    setIsSubmitting(true);
    
    try {
      if (isRegisterMode) {
        await register(email, password);
        setPendingVerifyEmail(email);
        setIsRegisterMode(false);
      } else {
        await login(email, password);
        // Give a moment for state to update after login
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Check authentication state and navigate
        const authState = useAuthStore.getState();
        console.log('Auth state after login:', authState);
        
        if (authState.isAuthenticated) {
          console.log('Login successful, navigating to dashboard');
          navigate('/dashboard');
        } else {
          console.warn('Not authenticated immediately after login, retrying...');
          // Retry after another delay
          setTimeout(() => {
            const retryState = useAuthStore.getState();
            console.log('Retry auth state:', retryState);
            if (retryState.isAuthenticated) {
              console.log('Navigating to dashboard (retry)');
              navigate('/dashboard');
            }
          }, 200);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-apple-gray-50 to-white dark:from-apple-gray-900 dark:to-apple-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-block p-4 bg-apple-blue rounded-3xl mb-4"
          >
            <LogIn className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold text-apple-gray-900 dark:text-apple-gray-50 mb-2">Legal Diff</h1>
          <p className="text-apple-gray-600 dark:text-apple-gray-400">
            Умная обработка юридических документов
          </p>
        </div>

        <div className="card-apple">
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              onClick={toggleTheme}
              className="p-2"
              title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
          <h2 className="text-2xl font-semibold text-apple-gray-900 dark:text-apple-gray-50 mb-6">
            {pendingVerifyEmail ? 'Подтвердите email' : isRegisterMode ? 'Регистрация' : 'Вход'}
          </h2>

          {error && !pendingVerifyEmail && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 mb-6"
            >
              {error}
            </motion.div>
          )}

          {!pendingVerifyEmail ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />

            <Input
              type="password"
              label="Пароль"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
              icon={<LogIn />}
            >
              {isRegisterMode ? 'Зарегистрироваться' : 'Войти'}
            </Button>
          </form>
          ) : (
            <div className="space-y-4">
              <p className="text-apple-gray-700">
                Мы отправили письмо с подтверждением на <b>{pendingVerifyEmail}</b>.
                Проверьте входящие (и папку «Спам»). После подтверждения вернитесь и войдите.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await authAPI.requestVerify(pendingVerifyEmail);
                      alert('Письмо с подтверждением отправлено повторно');
                    } catch (e: any) {
                      alert(e?.normalizedMessage || 'Не удалось отправить письмо');
                    }
                  }}
                  isLoading={isLoading}
                >
                  Отправить письмо ещё раз
                </Button>
                <button
                  className="text-apple-blue hover:text-apple-blue-hover"
                  onClick={() => setPendingVerifyEmail(null)}
                >
                  Изменить email
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-apple-blue hover:text-apple-blue-hover dark:text-apple-blue dark:hover:text-apple-blue-hover font-medium transition-colors"
              disabled={isLoading}
            >
              {isRegisterMode
                ? 'Уже есть аккаунт? Войти'
                : 'Нет аккаунта? Зарегистрироваться'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

