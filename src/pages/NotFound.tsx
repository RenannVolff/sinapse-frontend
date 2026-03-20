import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BrainCircuit } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();


  const isBatata = location.pathname.toLowerCase().includes('batata');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 fade-in">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl shadow-blue-900/5 border border-gray-100 text-center max-w-md w-full relative overflow-hidden">
        

        <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
          <BrainCircuit className="h-48 w-48 text-primary" />
        </div>

        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            {isBatata ? (

              <div className="h-24 w-24 bg-orange-50 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-5xl" title="Batata!">🥔</span>
              </div>
            ) : (

              <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center">
                <span className="text-4xl font-black text-primary tracking-tighter">404</span>
              </div>
            )}
          </div>
          
          {isBatata ? (

            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Deu batata!</h1>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Sabemos que o cérebro gasta muita energia pensando e um carboidrato vai bem, mas a rota <strong className="text-orange-500">{location.pathname}</strong> tá frita! 
                <br /><br />
                Volte para o sistema antes que esfrie.
              </p>
            </>
          ) : (

            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Página não encontrada</h1>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Parece que a página que você está procurando não existe, foi movida ou você não tem permissão para acessá-la.
              </p>
            </>
          )}
          
          <Button onClick={() => navigate('/dashboard')} className="w-full">
            <Home className="h-5 w-5 mr-2" />
            Voltar para o Início
          </Button>
        </div>
      </div>
    </div>
  );
}