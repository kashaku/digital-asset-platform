import { Route, Routes } from 'react-router-dom';
import HomePage from '@/pages/home-page';
import MarketPage from '@/pages/Market/market.tsx';
import ProfilePage from '@/pages/profile';
import AssertPage from '@/pages/assert';
import NotFoundPage from '@/pages/not-found';

export default function AppRoutes() {
	return (
		<Routes>
			<Route path="/" element={<HomePage />} />
			<Route path="/market" element={<MarketPage />} />
			<Route path="/profile" element={<ProfilePage />} />
			<Route path="/assert" element={<AssertPage />} />
			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	);
}

