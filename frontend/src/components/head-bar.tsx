import React, { useState, useRef } from 'react';
import { Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription } from './ui/popover';
import { useUserStore } from '@/store/user-store';

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
					<a href="/" className="flex items-center gap-2 text-lg font-semibold text-indigo-600">
						<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16M4 12h10M4 18h16" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
						<span>AssetChain</span>
					</a>
				</div>

				<nav className="hidden md:flex gap-6 text-sm text-slate-600">
					<a href="#">首页</a>
					<a href="#">交易市场</a>
					<a href="#">资产铸造</a>
					<a href="#">个人中心</a>
				</nav>

				<div className="flex items-center gap-3">
					<div
						onMouseEnter={handleMouseEnter}
						onMouseLeave={handleMouseLeave}
						className="relative"
					>
						{user ? (
							<Popover open={open} onOpenChange={(v: boolean) => setOpen(v)}>
								<PopoverTrigger asChild>
									<button
										aria-label="用户菜单"
										className="rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
									>
										<Avatar cid={user.profile?.avatarCid} size={40} />
									</button>
								</PopoverTrigger>

								<PopoverContent sideOffset={8} align="end">
									<PopoverHeader>
										<div className="flex items-center gap-3">
											<div className="w-12 h-12">
												<Avatar cid={user.profile?.avatarCid} size={48} />
											</div>
											<div className="flex flex-col">
												<PopoverTitle>{user.profile?.displayName ?? shorten(user.address)}</PopoverTitle>
												<PopoverDescription className="text-xs">{shorten(user.address)}</PopoverDescription>
											</div>
										</div>
									</PopoverHeader>

									<div className="mt-2 flex flex-col gap-2">
										<div className="text-sm text-slate-700">角色：{user.role}</div>
										<div className="text-sm text-slate-500">已创作：{user.createdCount ?? 0}</div>

										<div className="mt-2 flex gap-2">
											<button
												onClick={() => {
													logout();
													// 注：登出后占位跳转
													window.location.href = '/';
												}}
												className="ml-auto rounded-md bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
											>
												登出
											</button>
										</div>
									</div>
								</PopoverContent>
							</Popover>
						) : (
							<button
								onClick={() => (window.location.href = '/login')}
								aria-label="登录"
								className="rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
							>
								<Avatar size={40} />
							</button>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
