import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function DefaultLayout() {
    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar Fixa */}
            <Sidebar />

            {/* Conteúdo Principal */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-64 transition-all duration-300">
                <Header />

                {/* Área de Scroll onde as páginas aparecem */}
                <main className="flex-1 p-6 overflow-y-auto">
                    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}