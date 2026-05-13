import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useUserStore } from '@/store/user-store';

import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from './ui/popover';

function shorten(address: string) {
	return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
}

function Avatar({ cid, size = 36 }: { cid?: string; size?: number }) {
	if (cid) {
		// 使用 IPFS 网关占位渲染; 实际项目中应使用配置的网关解析
		const src = `https://ipfs.io/ipfs/${cid}`;
		return (
			// eslint-disable-next-line jsx-a11y/img-redundant-alt
			<img
				src={src}
				alt="avatar"
				width={size}
				height={size}
				className="rounded-full object-cover"
			/>
		);
	}

	return (
		<div
			className="flex items-center justify-center rounded-full bg-slate-200 text-slate-600"
			style={{ width: size, height: size }}
			aria-hidden
		>
			<svg xmlns="http://www.w3.org/2000/svg" width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
				<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
				<circle cx="12" cy="7" r="4" />
			</svg>
		</div>
	);
}

export default function HeadBar() {
	const user = useUserStore((s) => s.user);
	const logout = useUserStore((s) => s.logout);
	const navigate = useNavigate();

	const [open, setOpen] = useState(false);
	const timeoutRef = useRef<number | null>(null);

	const handleMouseEnter = () => {
		if (!user) return;
		if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
		setOpen(true);
	};

	const handleMouseLeave = () => {
		if (!user) return;
		// 延迟关闭，提升可用性
		timeoutRef.current = window.setTimeout(() => setOpen(false), 150);
	};

	return (
		<header className="w-full border-b border-slate-100 bg-white">
			<div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
				<div className="flex items-center gap-4">
					<Link to="/" className="flex items-center gap-2 text-lg font-semibold text-indigo-600">
						<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16M4 12h10M4 18h16" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
						<span>AssetChain</span>
					</Link>
				</div>

				<nav className="hidden md:flex gap-6 text-sm text-slate-600">
					<Link to="/">首页</Link>
					<Link to="/market">交易市场</Link>
					<Link to="/assert">资产铸造</Link>
					<Link to="/profile">个人中心</Link>
				</nav>

				<div className="flex items-center gap-3">
					<div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
						{user ? (
							<Popover open={open} onOpenChange={setOpen}>
								<PopoverTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										aria-label="用户菜单"
										className="h-10 w-10 rounded-full p-0"
									>
										<Avatar cid={user.profile?.avatarCid} size={40} />
									</Button>
								</PopoverTrigger>

								<PopoverContent sideOffset={8} align="end" className="w-72">
									<PopoverHeader>
										<div className="flex items-center gap-3">
											<Avatar cid={user.profile?.avatarCid} size={48} />
											<div className="flex flex-col">
												<PopoverTitle>{user.profile?.displayName ?? shorten(user.address)}</PopoverTitle>
												<PopoverDescription className="text-xs">{shorten(user.address)}</PopoverDescription>
											</div>
										</div>
									</PopoverHeader>

									<div className="mt-2 flex flex-col gap-3">
										<div className="text-sm text-slate-700">角色：{user.role}</div>
										<div className="text-sm text-slate-500">已创作：{user.createdCount ?? 0}</div>
										<Button
											variant="destructive"
											size="sm"
											className="w-fit"
											onClick={() => {
												logout();
												navigate('/');
											}}
										>
											登出
										</Button>
									</div>
								</PopoverContent>
							</Popover>
						) : (
							<Button
								variant="ghost"
								size="icon"
								aria-label="登录"
								className="h-10 w-10 rounded-full p-0"
								onClick={() => navigate('/profile')}
							>
								<Avatar size={40} />
							</Button>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
