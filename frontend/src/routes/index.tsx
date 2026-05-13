import { createBrowserRouter } from 'react-router-dom';
import HomePage from '@/pages/home-page';
import MarketPage from '@/pages/market';
import ProfilePage from '@/pages/profile';
import AssertPage from '@/pages/assert';
import NotFoundPage from '@/pages/not-found';

export const router = createBrowserRouter([
	{
		path: '/',
		element: <HomePage />,
	},
	{
		path: '/market',
		element: <MarketPage />,
	},
	{
		path: '/profile',
		element: <ProfilePage />,
	},
	{
		path: '/assert',
		element: <AssertPage />,
	},
	{
		path: '*',
		element: <NotFoundPage />,
	},
]);

