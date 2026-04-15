目录结构参考下表
```
asset-chain/
├── .github/                    # GitHub Actions CI/CD 配置（自动化测试与部署）
├── contracts/                  # 👉 [智能合约组工作区]
│   ├── contracts/              # Solidity 源码目录
│   │   ├── ERC721Token.sol     # 核心 NFT 合约
│   │   └── Marketplace.sol     # 交易与版税逻辑合约
│   ├── scripts/                # 部署脚本 (如 deploy.js)
│   ├── test/                   # 测试用例目录 (非常重要，PM/QA主要阵地)
│   ├── hardhat.config.js       # Hardhat 链上环境与网络配置
│   └── package.json            # 合约依赖 (OpenZeppelin等)
│
├── frontend/                   # 👉 [前端组工作区]
│   ├── public/                 # 静态资源
│   ├── src/
│   │   ├── abis/               # 存放从 contracts 编译生成的 ABI 文件
│   │   ├── components/         # 页面 UI 组件 (使用 TailwindCSS)
│   │   ├── hooks/              # 自定义 Hooks (如 useWallet, 去调用 Ethers.js)
│   │   ├── utils/              # 工具函数 (如 ipfsUploader.js 处理 IPFS 上传)
│   │   ├── App.jsx             # 前端入口
│   │   └── index.css           # 全局样式/Tailwind 引入
│   ├── package.json            # 前端依赖 (React, Ethers.js, Tailwind等)
│   └── tailwind.config.js      # Tailwind 配置文件
│
├── docs/                       # 👉 [项目文档与架构统筹]
│   ├── api-design.md           # 智能合约函数接口规范
│   ├── system-design.md        # PPT中提到的架构图、流程图
│   └── meeting-notes.md        # 团队沟通记录
│
├── .editorconfig               # 统一跨编辑器的缩进和编码格式
├── .gitignore                  # 忽略 node_modules, .env 等文件
├── Makefile                    # 封装常用终端命令（如 make install, make node）
└── README.md                   # 项目首页介绍、启动指南
```